const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Category = require('../models/Category');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Show all categories from DB
router.get('/all', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// Add new category with image upload and DB storage
router.post('/add', upload.single('image'), async (req, res) => {
  const { name, shortDescription, quantity } = req.body;
  if (!name || !shortDescription || !quantity) {
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
          const newCategory = new Category({
            name,
            shortDescription,
            quantity,
            imageUrl
          });
          await newCategory.save();
          res.status(201).json({ message: "Category added", category: newCategory });
        }
      ).end(req.file.buffer);
    } catch (err) {
      return res.status(500).json({ message: "Image upload failed", error: err.message });
    }
  } else {
    try {
      const newCategory = new Category({
        name,
        shortDescription,
        quantity,
        imageUrl
      });
      await newCategory.save();
      res.status(201).json({ message: "Category added", category: newCategory });
    } catch (err) {
      res.status(500).json({ message: "Error saving category", error: err.message });
    }
  }
});

// Add "Only Fresh" category directly to DB
router.post('/add-only-fresh', async (req, res) => {
  try {
    const newCategory = new Category({
      name: "Only Fresh",
      shortDescription: "Fresh products only",
      quantity: 80
    });
    await newCategory.save();
    res.status(201).json({ message: "Only Fresh category added", category: newCategory });
  } catch (err) {
    res.status(500).json({ message: "Error saving category", error: err.message });
  }
});

// Add "Only MRP" category directly to DB
router.post('/add-only-mrp', async (req, res) => {
  try {
    const newCategory = new Category({
      name: "Only MRP",
      shortDescription: "MRP products only",
      quantity: 100
    });
    await newCategory.save();
    res.status(201).json({ message: "Only MRP category added", category: newCategory });
  } catch (err) {
    res.status(500).json({ message: "Error saving category", error: err.message });
  }
});

// Add "Mix (MRP)" category directly to DB
router.post('/add-mix-mrp', async (req, res) => {
  try {
    const newCategory = new Category({
      name: "Mix (MRP)",
      shortDescription: "Mix of MRP and fresh products",
      quantity: 120
    });
    await newCategory.save();
    res.status(201).json({ message: "Mix (MRP) category added", category: newCategory });
  } catch (err) {
    res.status(500).json({ message: "Error saving category", error: err.message });
  }
});

module.exports = router;
