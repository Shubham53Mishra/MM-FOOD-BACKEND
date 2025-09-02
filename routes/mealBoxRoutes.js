const express = require('express');
const router = express.Router();

// ...existing code...
const { createMealBox, addMultipleCustomItemsToMealBox, addCustomItemToMealBox } = require('../controllers/mealBox.controller');
const MealBox = require('../models/MealBox');

// ...existing code...

// POST /api/mealbox/:mealBoxId/add-items - add multiple custom items to a mealbox
router.post('/:mealBoxId/add-items', addMultipleCustomItemsToMealBox);

// POST /api/mealbox/:mealBoxId/add-item - add a custom item to a mealbox
router.post('/:mealBoxId/add-item', addCustomItemToMealBox);

// POST /api/mealbox
router.post('/', createMealBox);

// GET /api/mealbox - get all mealBox documents from MealBox collection
router.get('/', async (req, res) => {
	try {
		const mealboxes = await MealBox.find().populate('vendor', 'name email mobile image');
		// Only show customItems, not categories/subCategories
		const sanitizedMealboxes = mealboxes.map(box => {
			if (box.vendor && box.vendor.password) {
				const vendor = box.vendor.toObject ? box.vendor.toObject() : { ...box.vendor };
				delete vendor.password;
				return { ...box.toObject(), vendor, customItems: box.customItems };
			}
			return { ...box.toObject(), customItems: box.customItems };
		});
		res.json({ mealboxes: sanitizedMealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
});

module.exports = router;


