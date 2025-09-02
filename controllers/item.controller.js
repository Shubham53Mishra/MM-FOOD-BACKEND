const Item = require('../models/Item');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Create a new item (supports form-data)
exports.createItem = [
	upload.single('image'),
	async (req, res) => {
		try {
			const { name, description, category, vendor } = req.body;
			let imageUrl = req.body.imageUrl;
			// If image file is uploaded, you can add cloudinary upload logic here
			if (req.file) {
				// For now, just save the filename or buffer info
				imageUrl = req.file.originalname;
			}
			if (!name) {
				return res.status(400).json({ message: 'Name is required' });
			}
			const item = new Item({ name, description, imageUrl, category, vendor });
			await item.save();
			res.status(201).json({ item });
		} catch (err) {
			res.status(500).json({ message: 'Error creating item', error: err.message });
		}
	}
];
