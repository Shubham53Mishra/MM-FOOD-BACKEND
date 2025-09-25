const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const auth = require('../middlewares/auth');


// Get single subcategory by ID (including reviews)
router.get('/subcategory/:id', async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }
    res.json({ subCategory });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sub-category', error: err.message });
  }
});

// Add review to subcategory
router.post('/add-review/:subCategoryId', auth, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user && req.user.id ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ message: "User authentication required" });
  }
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }
  try {
    const subCategory = await SubCategory.findById(req.params.subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    subCategory.reviews.push({ user: userId, rating, comment });
    await subCategory.save();
    res.json({ message: "Review added", reviews: subCategory.reviews });
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err.message });
  }
});

// Vendor can update subcategory availability
router.put('/update-subcategory-availability/:id', auth, async (req, res) => {
  const { available } = req.body;
  if (typeof available !== 'boolean') {
    return res.status(400).json({ message: 'Available field must be true or false' });
  }
  try {
    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    );
    if (!subCategory) {
      return res.status(404).json({ message: 'Sub-category not found' });
    }
    // Emit websocket event for real-time update
    const { io } = require('../server');
    io.emit('subcategoryAvailabilityUpdated', {
      subCategoryId: subCategory._id,
      available: subCategory.available
    });
    res.json({ message: 'Availability updated', subCategory });
  } catch (err) {
    res.status(500).json({ message: 'Error updating availability', error: err.message });
  }
});

// Get all categories and subcategories for the logged-in vendor
router.get('/my-categories-with-subcategories', auth, async (req, res) => {
  try {
    const vendorId = req.user && req.user.id ? req.user.id : null;
    if (!vendorId) {
      return res.status(401).json({ message: 'Vendor authentication required' });
    }
    // Find categories created by this vendor
    const categories = await Category.find({ vendor: vendorId });
    const categoriesWithSubs = await Promise.all(
      categories.map(async (cat) => {
    const subCategories = await SubCategory.find({ category: cat._id, vendor: vendorId });
        return { ...cat.toObject(), subCategories };
      })
    );
    res.json({ categories: categoriesWithSubs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

/*
==========================
CATEGORY & SUB-CATEGORY APIs
==========================

MAIN CATEGORY APIs

1. Create main category
   POST   /api/categories/add
   Body: form-data (for image) or JSON
     - name: "Snacks"
     - shortDescription: "All snack items"
     - quantity: 100
     - image: (file, optional)
   Result: Adds a new main category to the database.

2. Get all main categories
   GET    /api/categories/all
   Result: Returns all main categories.

3. Update main category
   PUT    /api/categories/update/:id
   Body: JSON
     - name
     - shortDescription
     - quantity
     - imageUrl (optional)
   Result: Updates the main category with the given id.

4. Delete main category
   DELETE /api/categories/delete/:id
   Result: Deletes the main category and all its sub-categories.

5. Create or add category only if it does not exist
   POST   /api/categories/create-or-add
   Body: JSON
     - name
     - shortDescription
     - quantity
   Result: Adds a new category only if it doesn't already exist.

SUB-CATEGORY APIs

6. Create sub-category under a main category
   POST   /api/categories/add-subcategory
   Body: JSON
     - name: "Mexican"
     - description: "Mexican snacks"
     - categoryId: "<main_category_id>"
   Result: Adds a sub-category linked to the main category.

7. Get all categories with their sub-categories
   GET    /api/categories/all-with-subcategories
   Result: Returns all categories, each with its sub-categories.

8. Update sub-category
   PUT    /api/categories/update-subcategory/:id
   Body: JSON
     - name
     - description
   Result: Updates the sub-category with the given id.

9. Delete sub-category
   DELETE /api/categories/delete-subcategory/:id
   Result: Deletes the sub-category with the given id.

------------------------------------------
How it works:
- Create main categories (e.g., Snacks, Meal, Vegan, Dessert, Drinks).
- Create sub-categories (e.g., Mexican, Pak) and link them to a main category using its _id.
- Update or delete any category or sub-category by their _id.
- Fetch all categories and see their sub-categories grouped together.

Example workflow:
- Admin creates "Snacks" (main category).
- Admin creates "Mexican" (sub-category) and links it to "Snacks" using Snacks' _id.
- GET /api/categories/all-with-subcategories returns:
  [
    { name: "Snacks", subCategories: [ { name: "Mexican" }, ... ] },
    ...
  ]
==========================
*/

// 1. Get all main categories
// Method: GET
// URL: http://localhost:5000/api/categories/all
// Only main categories
router.get('/all', async (req, res) => {
  try {
    let categories;
    if (req.user && req.user.id) {
      // Vendor token present, show only vendor's categories
      categories = await Category.find({ vendor: req.user.id }, '_id name');
    } else {
      // No vendor token, show all categories
      categories = await Category.find({}, '_id name');
    }
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
router.post('/add', auth, async (req, res) => {
  const { name, minQty } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  const vendorId = req.user && req.user.id ? req.user.id : null;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }
  try {
    const newCategory = new Category({ name, vendor: vendorId, minQty: minQty !== undefined ? minQty : 1 });
    await newCategory.save();
    res.status(201).json({ message: "Category added", category: newCategory });
  } catch (err) {
    console.error('Error saving category:', err);
    res.status(500).json({ message: "Error saving category", error: err.message, stack: err.stack });
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
// Categories with their sub-categories and meal boxes
const jwt = require('jsonwebtoken');

// Middleware to verify vendor JWT
function authVendor(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
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

router.get('/all-with-subcategories', async (req, res) => {
  try {
    // If you want to fetch all categories and subcategories for all vendors, remove vendor filtering
    const categories = await Category.find();
    const categoriesWithSubs = await Promise.all(
      categories.map(async (cat) => {
        const subCategories = await SubCategory.find({ category: cat._id });
        return { ...cat.toObject(), minQty: cat.minQty, subCategories };
      })
    );
    res.json({ categories: categoriesWithSubs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// Add a sub-category under a main category (e.g., Snacks -> Mexican)
router.post('/add-subcategory', auth, upload.single('image'), async (req, res) => {
  const { name, description, pricePerUnit, quantity, categoryId, discount, discountStart, discountEnd, minQty } = req.body;
  const vendorId = req.user && req.user.id ? req.user.id : null;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }
  if (!name || !categoryId) {
    return res.status(400).json({ message: "Sub-category name and categoryId are required" });
  }
  let imageUrl = "";
  const emitCategoriesUpdated = async () => {
    try {
      const { io } = require('../server');
      if (io) {
        // Optionally, you can send the updated categories list here
        io.emit('categoriesUpdated', { message: 'Categories or subcategories updated' });
      }
    } catch (e) {
      console.error('Socket emit categoriesUpdated failed:', e);
    }
  };
  if (req.file) {
    try {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        async (error, result) => {
          if (error) return res.status(500).json({ message: "Image upload failed", error: error.message });
          imageUrl = result.secure_url;
          const subCategory = new SubCategory({
            name,
            description,
            pricePerUnit,
            quantity,
            minQty: minQty !== undefined ? minQty : 1,
            imageUrl,
            category: categoryId,
            vendor: vendorId,
            discount,
            discountStart,
            discountEnd
          });
          await subCategory.save();
          await emitCategoriesUpdated();
          res.status(201).json({ message: "Sub-category added", subCategory });
        }
      ).end(req.file.buffer);
    } catch (err) {
      return res.status(500).json({ message: "Image upload failed", error: err.message });
    }
  } else {
    try {
      const subCategory = new SubCategory({
        name,
        description,
        pricePerUnit,
        quantity,
        imageUrl,
        category: categoryId,
        vendor: vendorId,
        discount,
        discountStart,
        discountEnd
      });
      await subCategory.save();
      await emitCategoriesUpdated();
      res.status(201).json({ message: "Sub-category added", subCategory });
    } catch (err) {
      res.status(500).json({ message: "Error saving sub-category", error: err.message });
    }
  }
});

// Update main category
// Method: PUT
// URL: /api/categories/update/:id
router.put('/update/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category updated", category: updatedCategory });
  } catch (err) {
    res.status(500).json({ message: "Error updating category", error: err.message });
  }
});

// Delete main category
// Method: DELETE
// URL: /api/categories/delete/:id
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    // Optionally delete all sub-categories linked to this category
    await SubCategory.deleteMany({ category: req.params.id });
    res.json({ message: "Category and its sub-categories deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting category", error: err.message });
  }
});

// Update sub-category
// Method: PUT
// URL: /api/categories/update-subcategory/:id
router.put('/update-subcategory/:id', async (req, res) => {
  const { name, description, pricePerUnit, imageUrl, category, vendor, discount, discountStart, discountEnd } = req.body;
  try {
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (pricePerUnit !== undefined) updateFields.pricePerUnit = pricePerUnit;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;
    if (category !== undefined) updateFields.category = category;
    if (vendor !== undefined) updateFields.vendor = vendor;
    if (discount !== undefined) updateFields.discount = discount;
    if (discountStart !== undefined) updateFields.discountStart = discountStart;
    if (discountEnd !== undefined) updateFields.discountEnd = discountEnd;
    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!updatedSubCategory) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    res.json({ message: "Sub-category updated", subCategory: updatedSubCategory });
  } catch (err) {
    res.status(500).json({ message: "Error updating sub-category", error: err.message });
  }
});

// Delete sub-category
// Method: DELETE
// URL: /api/categories/delete-subcategory/:id
router.delete('/delete-subcategory/:id', async (req, res) => {
  try {
    const deletedSubCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deletedSubCategory) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    res.json({ message: "Sub-category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting sub-category", error: err.message });
  }
});

module.exports = router;
