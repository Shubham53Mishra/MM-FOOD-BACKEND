const express = require('express');
const router = express.Router();

const { createItem } = require('../controllers/item.controller');

// POST /api/item - create a new item (form-data supported)
router.post('/', createItem);

module.exports = router;
