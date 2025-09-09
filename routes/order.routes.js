const express = require('express');
const router = express.Router();
const { getMealBoxOrders } = require('../controllers/order.controller');
// GET /api/orders/mealbox - get all mealbox orders
router.get('/mealbox', getMealBoxOrders);
const { updateMealBoxOrder } = require('../controllers/order.controller');
// PUT /api/orders/update-mealbox/:id - update a mealbox order
router.put('/update-mealbox/:id', updateMealBoxOrder);
const { createMealBoxOrder } = require('../controllers/order.controller');
// POST /api/orders/create-mealbox - create a mealbox order
router.post('/create-mealbox', createMealBoxOrder);
