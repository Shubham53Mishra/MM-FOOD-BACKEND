const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Update an item (supports form-data for image)
const cloudinaryService = require('../services/cloudinaryService');
exports.updateItem = [
	upload.single('image'),
	async (req, res) => {
		try {
			const { id } = req.params;
			const update = req.body;
			if (req.file) {
				// Upload image to Cloudinary
				const imageUrl = await cloudinaryService.uploadImage(req.file.buffer);
				update.imageUrl = imageUrl;
			}
			const item = await Item.findByIdAndUpdate(id, update, { new: true });
			if (!item) return res.status(404).json({ message: 'Item not found' });
			res.json({ item });
		} catch (err) {
			res.status(500).json({ message: 'Error updating item', error: err.message });
		}
	}
];

// Delete an item
exports.deleteItem = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await Item.findByIdAndDelete(id);
		if (!item) return res.status(404).json({ message: 'Item not found' });
		res.json({ message: 'Item deleted' });
	} catch (err) {
		res.status(500).json({ message: 'Error deleting item', error: err.message });
	}
};
const Item = require('../models/Item');


// Create a new item (supports form-data)
exports.createItem = [
	upload.single('image'),
	async (req, res) => {
		try {
			// Support form-data: req.body for text, req.file for image
			const name = req.body.name;
			const description = req.body.description;
			const category = req.body.category;
			let imageUrl = req.body.imageUrl;
			if (req.file) {
				imageUrl = await cloudinaryService.uploadImage(req.file.buffer);
			}
			if (!name) {
				return res.status(400).json({ message: 'Name is required' });
			}
			const vendor = req.vendorId || (req.user && req.user.id);
			const item = new Item({ name, description, imageUrl, category, vendor });
			await item.save();
			res.status(201).json({ item });
		} catch (err) {
			res.status(500).json({ message: 'Error creating item', error: err.message });
		}
	}
];
