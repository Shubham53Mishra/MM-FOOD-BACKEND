const express = require('express');
const router = express.Router();
const { favoriteMealBox, unfavoriteMealBox, getFavoriteMealBoxes } = require('../controllers/mealBox.controller');
const auth = require('../middlewares/auth');
// POST /api/mealbox/:id/favorite - favorite a mealbox
router.post('/:id/favorite', auth, favoriteMealBox);
// POST /api/mealbox/:id/unfavorite - unfavorite a mealbox
router.post('/:id/unfavorite', auth, unfavoriteMealBox);
// GET /api/mealbox/favorites - get all favorite mealboxes for the user
router.get('/favorites', auth, getFavoriteMealBoxes);
// DELETE /api/mealbox/:id - delete a mealbox
const { deleteMealBox } = require('../controllers/mealBox.controller');
router.delete('/:id', deleteMealBox);
const { updateMealBox, createMealBox, addMultipleCustomItemsToMealBox, addCustomItemToMealBox } = require('../controllers/mealBox.controller');
const upload = require('../middlewares/upload');
const { uploadCustomItemImage } = require('../controllers/upload.controller');
const MealBox = require('../models/MealBox');

// PUT /api/mealbox/:id - update a mealbox
// PUT /api/mealbox/:id - update a mealbox (form-data supported)
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
// GET /api/mealbox - get all mealBox documents, or only vendor's if token is present
router.get('/', async (req, res) => {
	try {
		let query = {};
		// If vendorId is set by auth middleware (token present), filter by vendor
		if (req.vendorId || (req.user && req.user.id)) {
			query.vendor = req.vendorId || req.user.id;
		}
		const mealboxes = await MealBox.find(query)
		  .populate('vendor', 'name email mobile image')
		  .populate('items');
		res.json({ mealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
});

module.exports = router;


