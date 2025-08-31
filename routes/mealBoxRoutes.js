
const express = require('express');
const router = express.Router();
const { createMealBox } = require('../controllers/mealBox.controller');

// POST /api/mealbox
router.post('/', createMealBox);

// GET /api/mealbox - get all mealBox objects only
const Order = require('../models/Order');
router.get('/', async (req, res) => {
	try {
		const orders = await Order.find({ mealBox: { $exists: true, $ne: null } });
		const mealboxes = orders.map(order => order.mealBox);
		res.json({ mealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
});

module.exports = router;


