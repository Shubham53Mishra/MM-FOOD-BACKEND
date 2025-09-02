const Item = require('../models/Item');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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
								imageUrl = req.file.originalname;
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
