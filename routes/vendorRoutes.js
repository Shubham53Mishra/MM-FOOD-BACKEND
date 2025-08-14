const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Vendor signup
router.post('/signup', async (req, res) => {
  const { name, email, password, mobile } = req.body;
  if (!name || !email || !password || !mobile) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: "Vendor already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = new Vendor({ name, email, password: hashedPassword, mobile });
    await vendor.save();
    res.status(201).json({ message: "Vendor registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error registering vendor", error: err.message });
  }
});

// Vendor login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Check JWT_SECRET before using
    if (!process.env.JWT_SECRET || typeof process.env.JWT_SECRET !== "string") {
      return res.status(500).json({ message: "JWT_SECRET is missing. Please set it in your .env file and restart the server." });
    }
    const token = jwt.sign(
      { id: vendor._id, email: vendor.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Middleware to verify vendor JWT
function authVendor(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  // Accept both "Bearer <token>" and "<token>"
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = authHeader;
  }
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.vendorId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Get logged-in vendor profile
router.get('/profile', authVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    // Always return mobile, even if empty
    res.json({
      name: vendor.name,
      email: vendor.email,
      mobile: vendor.mobile || "",
      image: vendor.image,
      city: vendor.city,
      state: vendor.state,
      address: vendor.address
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
});

// Show categories for logged-in vendor
router.get('/categories', authVendor, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories", error: err.message });
  }
});

// Vendor logout (frontend should remove token)
router.post('/logout', (req, res) => {
  res.json({ message: "Logout successful. Please remove token on client." });
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create vendor profile with image upload
router.post('/profile', upload.single('image'), async (req, res) => {
  const { name, email, mobile } = req.body;
  if (!name || !email || !mobile) {
    return res.status(400).json({ message: "All fields are required" });
  }
  let imageUrl = "";
  if (req.file) {
    try {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        async (error, result) => {
          if (error) return res.status(500).json({ message: "Image upload failed", error: error.message });
          imageUrl = result.secure_url;
          const vendor = new Vendor({ name, email, mobile, image: imageUrl });
          await vendor.save();
          res.status(201).json({ message: "Profile created", vendor });
        }
      ).end(req.file.buffer);
    } catch (err) {
      return res.status(500).json({ message: "Image upload failed", error: err.message });
    }
  } else {
    try {
      const vendor = new Vendor({ name, email, mobile });
      await vendor.save();
      res.status(201).json({ message: "Profile created", vendor });
    } catch (err) {
      res.status(500).json({ message: "Error saving profile", error: err.message });
    }
  }
});

// Update vendor profile (city, state, address, mobile, etc.)
router.put('/profile', authVendor, async (req, res) => {
  const { city, state, address, mobile, name, image } = req.body;
  try {
    const updateFields = {};
    if (city !== undefined) updateFields.city = city;
    if (state !== undefined) updateFields.state = state;
    if (address !== undefined) updateFields.address = address;
    if (mobile !== undefined) updateFields.mobile = mobile;
    if (name !== undefined) updateFields.name = name;
    if (image !== undefined) updateFields.image = image;

    const vendor = await Vendor.findByIdAndUpdate(
      req.vendorId,
      { $set: updateFields },
      { new: true }
    );
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.json({
      message: "Profile updated",
      vendor: {
        name: vendor.name,
        email: vendor.email,
        mobile: vendor.mobile || "",
        image: vendor.image,
        city: vendor.city,
        state: vendor.state,
        address: vendor.address
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});

module.exports = router;
