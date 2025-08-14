const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: 'Authorization header missing' });
	}
	let token;
	if (authHeader.startsWith('Bearer ')) {
		token = authHeader.split(' ')[1];
	} else {
		token = authHeader;
	}
	if (!token) {
		return res.status(401).json({ message: 'No token provided' });
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { id: decoded.id, email: decoded.email };
		next();
	} catch (err) {
		res.status(401).json({ message: 'Invalid token' });
	}
};
