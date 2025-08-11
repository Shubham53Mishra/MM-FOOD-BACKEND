const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 1. Get all main categories
// Method: GET
// URL: http://localhost:5000/api/categories/all
router.get('/all', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// 2. Create a new main category
// Method: POST
// URL: http://localhost:5000/api/categories/add
// Body: form-data or JSON
//   name: "Only MRP"
//   shortDescription: "MRP products only"
//   quantity: 100
//   image: (file, optional)
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

// 3. Create or add category only if it does not exist
// Method: POST
// URL: http://localhost:5000/api/categories/create-or-add
// Body: JSON
//   {
//     "name": "Only Fresh",
//     "shortDescription": "Fresh products only",
//     "quantity": 80
//   }
router.post('/create-or-add', async (req, res) => {
  const { name, shortDescription, quantity } = req.body;
  if (!name || !shortDescription || !quantity) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(200).json({ message: "Category already exists", category: existingCategory });
    }
    const newCategory = new Category({
      name,
      shortDescription,
      quantity
    });
    await newCategory.save();
    res.status(201).json({ message: "New category created", category: newCategory });
  } catch (err) {
    res.status(500).json({ message: "Error processing category", error: err.message });
  }
});

// 5. Get all categories with their sub-categories
// Method: GET
// URL: http://localhost:5000/api/categories/all-with-subcategories
router.get('/all-with-subcategories', async (req, res) => {
  try {
    const categories = await Category.find();
    const categoriesWithSubs = await Promise.all(
      categories.map(async (cat) => {
        const subCategories = await SubCategory.find({ category: cat._id });
        return { ...cat.toObject(), subCategories };
      })
    );
    res.json({ categories: categoriesWithSubs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// 4. Add a sub-category to a main category
// Method: POST
// URL: http://localhost:5000/api/categories/add-subcategory
// Body: JSON
//   {
//     "name": "MRP Snacks",
//     "description": "Snacks under MRP",
//     "categoryId": "<main_category_id>"
//   }
router.post('/add-subcategory', async (req, res) => {
  const { name, description, categoryId } = req.body;
  if (!name || !categoryId) {
    return res.status(400).json({ message: "Sub-category name and categoryId are required" });
  }
  try {
    const subCategory = new SubCategory({
      name,
      description,
      category: categoryId
    });
    await subCategory.save();
    res.status(201).json({ message: "Sub-category added", subCategory });
  } catch (err) {
    res.status(500).json({ message: "Error saving sub-category", error: err.message });
  }
});

module.exports = router;

// POST /api/categories/add
// Stores a new main category in the database (with optional image).

// POST /api/categories/add-only-fresh
// Stores "Only Fresh" category in the database.

// POST /api/categories/add-only-mrp
// Stores "Only MRP" category in the database.

// POST /api/categories/add-mix-mrp
// Stores "Mix (MRP)" category in the database.

// POST /api/categories/create-or-add
// Stores a new category only if it does not already exist.

// POST /api/categories/add-subcategory
// Stores a new sub-category in the database, linked to a main category.
