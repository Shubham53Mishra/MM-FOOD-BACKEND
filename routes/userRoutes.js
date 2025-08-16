const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { getProfile, updateProfile, addDeliveryAddress, getDeliveryAddresses } = require('../controllers/user.controller');
const auth = require('../middlewares/auth');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
