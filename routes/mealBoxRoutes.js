
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
		   // Remove password if present in vendor (defensive, but should not be present due to projection)
		   const sanitizedMealboxes = mealboxes.map(box => {
			   if (box.vendor && box.vendor.password) {
				   const vendor = box.vendor.toObject ? box.vendor.toObject() : { ...box.vendor };
				   delete vendor.password;
				   return { ...box.toObject(), vendor };
			   }
			   return box;
		   });
		   res.json({ mealboxes: sanitizedMealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
});

module.exports = router;


