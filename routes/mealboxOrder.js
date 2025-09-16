const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

const mealBoxController = require('../controllers/mealBox.controller');

// Use controller for confirming mealbox order
router.put('/order/:orderId/confirm', mealBoxController.confirmMealBoxOrder);

module.exports = router;