const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
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
		const user = await User.findById(decoded.id);
		if (!user) {
			return res.status(401).json({ message: 'User not found' });
		}
		req.user = {
			id: user._id,
			name: user.fullName, // Use fullName from schema
			email: user.email,
			mobile: user.mobile
		};
		next();
	} catch (err) {
		res.status(401).json({ message: 'Invalid token' });
	}
};
