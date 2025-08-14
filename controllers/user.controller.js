const User = require('../models/User');

// Get user profile
exports.getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json(user);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

// Update user profile
exports.updateProfile = async (req, res) => {
	try {
		const { fullName, email, mobile, city, state, company } = req.body;
		const updated = await User.findByIdAndUpdate(
			req.user.id,
			{ fullName, email, mobile, city, state, company },
			{ new: true, runValidators: true }
		).select('-password');
		if (!updated) return res.status(404).json({ message: 'User not found' });
		res.json(updated);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
