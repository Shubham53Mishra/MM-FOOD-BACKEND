const Item = require('../models/Item');

// Create a new item
exports.createItem = async (req, res) => {
	try {
			const { name, description, imageUrl, category, vendor } = req.body;
			if (!name) {
				return res.status(400).json({ message: 'Name is required' });
			}
			const item = new Item({ name, description, imageUrl, category, vendor });
		await item.save();
		res.status(201).json({ item });
	} catch (err) {
		res.status(500).json({ message: 'Error creating item', error: err.message });
	}
};
