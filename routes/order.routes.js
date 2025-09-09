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

module.exports = router;
