const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const { createItem } = require('../controllers/item.controller');
const auth = require('../middlewares/auth');

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
