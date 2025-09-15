const express = require('express');
const router = express.Router();
const {
  getMealBoxOrders,
  updateMealBoxOrder,
  createMealBoxOrder,
  getConfirmedOrdersWithTracking,
  confirmOrder,
  getOrderTracking
} = require('../controllers/order.controller');

// GET /api/orders/mealbox - get all mealbox orders
router.get('/mealbox', getMealBoxOrders);

// PUT /api/orders/update-mealbox/:id - update a mealbox order
router.put('/update-mealbox/:id', updateMealBoxOrder);


// POST /api/orders/create-mealbox - create a mealbox order
router.post('/create-mealbox', createMealBoxOrder);

// Vendor auth middleware

const auth = require('../middlewares/auth');
function requireVendor(req, res, next) {
  if (req.user && req.user.isVendor) return next();
  return res.status(403).json({ message: 'Vendor authentication required' });
}


// PUT /api/orders/confirm-mealbox/:id - confirm a mealbox order (vendor only)
const { confirmMealBoxOrder, cancelMealBoxOrder } = require('../controllers/mealBox.controller');

function vendorAuthAndHandler(handler) {
  return function(req, res, next) {
    auth(req, res, function(err) {
      if (err) return next(err);
      requireVendor(req, res, function(err2) {
        if (err2) return next(err2);
        handler(req, res, next);
      });
    });
  };
}

function userAuthAndHandler(handler) {
  return function(req, res, next) {
    auth(req, res, function(err) {
      if (err) return next(err);
      handler(req, res, next);
    });
  };
}

router.put('/confirm-mealbox/:id', confirmMealBoxOrder);
router.put('/cancel-mealbox/:id', userAuthAndHandler(cancelMealBoxOrder));
router.get('/tracking', getConfirmedOrdersWithTracking);
router.put('/confirm/:id', confirmOrder);
router.get('/:id', getOrderTracking);

module.exports = router;
