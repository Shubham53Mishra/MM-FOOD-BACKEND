const express = require('express');
const router = express.Router();
const { updateMealBox, createMealBox, addMultipleCustomItemsToMealBox, addCustomItemToMealBox } = require('../controllers/mealBox.controller');
const upload = require('../middlewares/upload');
const { uploadCustomItemImage } = require('../controllers/upload.controller');
const MealBox = require('../models/MealBox');

// PUT /api/mealbox/:id - update a mealbox
router.put('/:id', updateMealBox);

// POST /api/mealbox/upload-item-image - upload image for custom item
router.post('/upload-item-image', upload.single('image'), uploadCustomItemImage);

// POST /api/mealbox/:mealBoxId/add-items - add multiple custom items to a mealbox
router.post('/:mealBoxId/add-items', addMultipleCustomItemsToMealBox);

// POST /api/mealbox/:mealBoxId/add-item - add a custom item to a mealbox
router.post('/:mealBoxId/add-item', addCustomItemToMealBox);

// POST /api/mealbox
router.post('/', createMealBox);

// GET /api/mealbox - get all mealBox documents from MealBox collection
router.get('/', async (req, res) => {
	try {
		const mealboxes = await MealBox.find()
		  .populate('vendor', 'name email mobile image')
		  .populate('items');
		res.json({ mealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
});

module.exports = router;


