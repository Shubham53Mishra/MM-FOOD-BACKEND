const express = require('express');
const router = express.Router();
const {
  getMealBoxOrders,
  updateMealBoxOrder,
  createMealBoxOrder
} = require('../controllers/order.controller');

// GET /api/orders/mealbox - get all mealbox orders
router.get('/mealbox', getMealBoxOrders);

// PUT /api/orders/update-mealbox/:id - update a mealbox order
router.put('/update-mealbox/:id', updateMealBoxOrder);


// POST /api/orders/create-mealbox - create a mealbox order
router.post('/create-mealbox', createMealBoxOrder);

// Vendor auth middleware
const auth = require('../middlewares/auth');
const vendorAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user && req.user.isVendor) return next();
    return res.status(403).json({ message: 'Vendor authentication required' });
  });
};

// PUT /api/orders/confirm-mealbox/:id - confirm a mealbox order (vendor only)
const { confirmMealBoxOrder, cancelMealBoxOrder } = require('../controllers/mealBox.controller');
router.put('/confirm-mealbox/:id', vendorAuth, confirmMealBoxOrder);

// PUT /api/orders/cancel-mealbox/:id - cancel a mealbox order (user or vendor)
router.put('/cancel-mealbox/:id', auth, cancelMealBoxOrder);

module.exports = router;
