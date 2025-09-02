const express = require('express');
const router = express.Router();

const { createItem } = require('../controllers/item.controller');

const auth = require('../middlewares/auth');

// POST /api/item - create a new item (form-data supported, requires auth)
router.post('/', auth, createItem);

module.exports = router;
