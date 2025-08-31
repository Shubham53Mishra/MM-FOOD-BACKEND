
const express = require('express');
const router = express.Router();
const { createMealBox } = require('../controllers/mealBox.controller');

// POST /api/mealbox
router.post('/mealbox', createMealBox);

module.exports = router;


