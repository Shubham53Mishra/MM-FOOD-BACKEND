const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Use Cloudinary in production
const { createMealBox, getMealBoxes, deleteMealBox } = require('../controllers/mealBox.controller');
const auth = require('../middlewares/auth');

router.post('/mealbox', auth, upload.fields([{ name: 'boxImage' }, { name: 'actualImage' }]), createMealBox);
router.get('/mealbox', auth, getMealBoxes);

module.exports = router;

// Delete meal box by ID
router.delete('/mealbox/:id', auth, deleteMealBox);
