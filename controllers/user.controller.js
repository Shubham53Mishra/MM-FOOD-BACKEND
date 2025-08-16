// Get all delivery addresses
exports.getDeliveryAddresses = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json({ addresses: user.deliveryAddresses });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
// Add new delivery address
exports.addDeliveryAddress = async (req, res) => {
	try {
		const { addressLine, city, state, pincode, label } = req.body;
		if (!addressLine) return res.status(400).json({ message: 'Address line is required' });
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		user.deliveryAddresses.push({ addressLine, city, state, pincode, label });
		await user.save();
		res.json({ message: 'Address added', addresses: user.deliveryAddresses });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
const User = require('../models/User');
const { uploadImage } = require('../services/cloudinaryService');

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

// Update user profile with image upload
exports.updateProfile = async (req, res) => {
	try {
		const { fullName, email, mobile, city, state, company, deliveryAddress } = req.body;
		let imageUrl;
		if (req.file && req.file.buffer) {
			imageUrl = await uploadImage(req.file.buffer);
		}
		const updateFields = { fullName, email, mobile, city, state, company, deliveryAddress };
		if (imageUrl) updateFields.image = imageUrl;
		const updated = await User.findByIdAndUpdate(
			req.user.id,
			updateFields,
			{ new: true, runValidators: true }
		).select('-password');
		if (!updated) return res.status(404).json({ message: 'User not found' });
		res.json(updated);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
