const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const { createItem, updateItem, deleteItem } = require('../controllers/item.controller');
const auth = require('../middlewares/auth');

// PUT /api/item/:id - update an item (form-data supported)
router.put('/:id', auth, updateItem);

// DELETE /api/item/:id - delete an item
router.delete('/:id', auth, deleteItem);

// GET /api/item - get all items
router.get('/', async (req, res) => {
	try {
		const items = await Item.find();
		res.json({ items });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching items', error: err.message });
	}
});

// POST /api/item - create a new item (form-data supported, requires auth)
router.post('/', auth, createItem);

module.exports = router;
