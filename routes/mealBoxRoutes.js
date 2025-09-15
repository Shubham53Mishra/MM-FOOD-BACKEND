const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
	favoriteMealBox,
	unfavoriteMealBox,
	getFavoriteMealBoxes,
	createMealBoxOrder,
	getMealBoxOrders,
	getMyMealBoxes,
	deleteMealBox,
	updateMealBox,
	createMealBox,
	addMultipleCustomItemsToMealBox,
	addCustomItemToMealBox
} = require('../controllers/mealBox.controller');
const { uploadCustomItemImage } = require('../controllers/upload.controller');

// GET /api/mealbox/order - get all mealbox orders
router.get('/order', getMealBoxOrders);
// POST /api/mealbox/order - create a mealbox order
router.post('/order', auth, createMealBoxOrder);
// PUT /api/mealbox/order/:orderId/confirm - confirm a mealbox order
const { confirmMealBoxOrder } = require('../controllers/mealBox.controller');
router.put('/order/:orderId/confirm', auth, confirmMealBoxOrder);
// POST /api/mealbox/:id/favorite - favorite a mealbox
router.post('/:id/favorite', auth, favoriteMealBox);
// POST /api/mealbox/:id/unfavorite - unfavorite a mealbox
router.post('/:id/unfavorite', auth, unfavoriteMealBox);
// GET /api/mealbox/favorites - get all favorite mealboxes for the user
router.get('/favorites', auth, getFavoriteMealBoxes);
// DELETE /api/mealbox/:id - delete a mealbox
router.delete('/:id', deleteMealBox);
// PUT /api/mealbox/:id - update a mealbox
router.put('/:id', updateMealBox);
// POST /api/mealbox/upload-item-image - upload image for custom item
router.post('/upload-item-image', upload.single('image'), uploadCustomItemImage);
// POST /api/mealbox/:mealBoxId/add-items - add multiple custom items to a mealbox
router.post('/:mealBoxId/add-items', addMultipleCustomItemsToMealBox);
// POST /api/mealbox/:mealBoxId/add-item - add a custom item to a mealbox
router.post('/:mealBoxId/add-item', addCustomItemToMealBox);
// POST /api/mealbox (form-data: boxImage, actualImage, fields)
router.post('/', auth, upload.fields([{ name: 'boxImage' }, { name: 'actualImage' }]), createMealBox);
// GET /api/mealbox - get all mealboxes (public or vendor filtered)
const { getMealBoxes } = require('../controllers/mealBox.controller');
router.get('/', getMealBoxes);

module.exports = router;
