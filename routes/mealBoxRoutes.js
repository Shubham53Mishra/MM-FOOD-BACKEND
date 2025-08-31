
const express = require('express');
const router = express.Router();
const { createMealBox } = require('../controllers/mealBox.controller');

// POST /api/mealbox
router.post('/', createMealBox);

// GET /api/mealbox - get all mealboxes (orders with mealBox)
const Order = require('../models/Order');
router.get('/', async (req, res) => {
	try {
		const mealboxes = await Order.find({ mealBox: { $exists: true, $ne: null } });
		res.json({ mealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
});

module.exports = router;


