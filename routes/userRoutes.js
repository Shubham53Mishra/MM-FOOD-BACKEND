const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');

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
