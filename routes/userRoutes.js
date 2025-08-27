const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { getProfile, updateProfile, addDeliveryAddress, getDeliveryAddresses, updateAddress, saveFavoriteSubCategories } = require('../controllers/user.controller');
const auth = require('../middlewares/auth');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
// Save favorite subcategories for user
router.post('/favorite-subcategories', auth, saveFavoriteSubCategories);

// Get vendors for a category
router.get('/category/:id/vendors', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const vendors = await Vendor.find({ category: categoryId });
    res.json({ vendors });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Update only address for user 
router.put('/address', auth, updateAddress);

// Get all delivery addresses
router.get('/address', auth, getDeliveryAddresses);
// Add new delivery address
router.post('/address', auth, addDeliveryAddress);
// Get user profile
router.get('/profile', auth, getProfile);
// Update user profile with image
router.put('/profile', auth, upload.single('image'), updateProfile);
// Use controller for register
router.post('/register', registerUser);

// Use controller for login
router.post('/login', loginUser);

router.post('/forgot-password', (req, res) => {
  // Placeholder logic
  res.json({ message: 'Password reset link sent' });
});

router.post('/logout', (req, res) => {
  res.json({ message: "Logout successful. Please remove token on client." });
});

module.exports = router;
