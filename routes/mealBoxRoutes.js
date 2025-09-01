
const express = require('express');
const router = express.Router();
const { createMealBox } = require('../controllers/mealBox.controller');

// POST /api/mealbox
router.post('/', createMealBox);

// GET /api/mealbox - get all mealBox documents from MealBox collection
const MealBox = require('../models/MealBox');
router.get('/', async (req, res) => {
	try {
		const mealboxes = await MealBox.find().populate('vendor', 'name email mobile image');
		res.json({ mealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
});

module.exports = router;


