const express = require('express');
const router = express.Router();
const { markMealBoxOrderDelivered, getMealBoxOrderTracking } = require('../controllers/mealBox.controller');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const mealBoxController = require('../controllers/mealBox.controller');
console.log('mealBoxController:', mealBoxController); // DEBUG: See what is imported
const {
  cancelMealBoxOrder,
  confirmMealBoxOrder,
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
  addCustomItemToMealBox,
  getMealBoxes,
  getConfirmedMealBoxOrdersWithTracking
} = mealBoxController;

// POST /api/mealbox/simple-order - create a simple (sample) meal box order
router.post('/simple-order', mealBoxController.createSimpleMealBoxOrder);
const { uploadCustomItemImage } = require('../controllers/upload.controller');

// GET /api/mealbox/samples - get all meal boxes with sampleAvailable: true
router.get('/samples', mealBoxController.getSampleMealBoxes);

// Cancel mealbox order
router.put('/order/:orderId/cancel', auth, cancelMealBoxOrder);

// GET /api/mealbox/order - get all mealbox orders
router.get('/order', getMealBoxOrders);
// POST /api/mealbox/order - create a mealbox order
router.post('/order', auth, createMealBoxOrder);
// PUT /api/mealbox/order/:orderId/confirm - confirm a mealbox order
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
router.put('/:id', upload.fields([{ name: 'boxImage' }, { name: 'actualImage' }]), updateMealBox);
// POST /api/mealbox/upload-item-image - upload image for custom item
router.post('/upload-item-image', upload.single('image'), uploadCustomItemImage);
// POST /api/mealbox/:mealBoxId/add-items - add multiple custom items to a mealbox
router.post('/:mealBoxId/add-items', addMultipleCustomItemsToMealBox);
// POST /api/mealbox/:mealBoxId/add-item - add a custom item to a mealbox
router.post('/:mealBoxId/add-item', addCustomItemToMealBox);
// POST /api/mealbox (form-data: boxImage, actualImage, fields)
router.post('/', auth, upload.fields([{ name: 'boxImage' }, { name: 'actualImage' }]), createMealBox);
// GET /api/mealbox - get all mealboxes (public or vendor filtered)
router.get('/', getMealBoxes);
// GET /api/mealbox/tracking - track confirmed mealbox orders for logged-in vendor
router.get('/tracking', auth, getConfirmedMealBoxOrdersWithTracking);
// GET /api/mealbox/tracking/:id - track a specific mealbox order
router.get('/tracking/:id', auth, getMealBoxOrderTracking);

module.exports = router;
