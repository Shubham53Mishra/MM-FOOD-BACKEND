
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

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
		// Try to find user first
		let user = await User.findById(decoded.id);
		if (user) {
			console.log('Authenticated as user:', user.email);
			req.user = {
				_id: user._id,
				id: String(user._id),
				name: user.fullName,
				email: user.email,
				mobile: user.mobile
			};
			console.log('req.user:', req.user);
			return next();
		}
		// If not user, try vendor
		let vendor = await Vendor.findById(decoded.id);
		if (vendor) {
			console.log('Authenticated as vendor:', vendor.email);
			req.user = {
				_id: vendor._id,
				id: String(vendor._id),
				name: vendor.name,
				email: vendor.email,
				mobile: vendor.mobile,
				isVendor: true
			};
			console.log('req.user:', req.user);
			return next();
		}
		return res.status(401).json({ message: 'User not found' });
	} catch (err) {
		res.status(401).json({ message: 'Invalid token' });
	}
};
