const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Use Cloudinary in production
const { createMealBox, getMealBoxes } = require('../controllers/mealBox.controller');

router.post('/mealbox', upload.fields([{ name: 'boxImage' }, { name: 'actualImage' }]), createMealBox);
router.get('/mealbox', getMealBoxes);

module.exports = router;
