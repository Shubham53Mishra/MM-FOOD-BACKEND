exports.uploadCustomItemImage = async (req, res) => {
	res.send('uploadCustomItemImage');
};
const cloudinaryService = require('../services/cloudinaryService');

// Upload image to Cloudinary and return URL
exports.uploadCustomItemImage = async (req, res) => {
	try {
		if (!req.file || !req.file.buffer) {
			return res.status(400).json({ message: 'No image file provided' });
		}
		const imageUrl = await cloudinaryService.uploadImage(req.file.buffer);
		res.json({ imageUrl });
	} catch (err) {
		res.status(500).json({ message: 'Error uploading image', error: err.message });
	}
};
