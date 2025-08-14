const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Customer creates an order
router.post('/create', async (req, res) => {
  const { customerName, customerEmail, items, vendorId } = req.body;
  if (!customerName || !customerEmail || !items || !vendorId) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // Validate category_id and subcategory_id
  for (const item of items) {
    if (item.category) {
      const categoryExists = await Category.findById(item.category);
      if (!categoryExists) {
        return res.status(400).json({ message: `Category ID ${item.category} not found` });
      }
    }
    if (item.subCategory) {
      const subCategoryExists = await SubCategory.findById(item.subCategory);
      if (!subCategoryExists) {
        return res.status(400).json({ message: `SubCategory ID ${item.subCategory} not found` });
      }
    }
  }
  try {
    const order = new Order({ customerName, customerEmail, items, vendor: vendorId });
    await order.save();
    res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    res.status(500).json({ message: "Error placing order", error: err.message });
  }
});

// Middleware to verify vendor JWT
function authVendor(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.vendorId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Vendor views their orders
router.get('/vendor-orders', authVendor, async (req, res) => {
  try {
    const orders = await Order.find({ vendor: req.vendorId }).populate('items.category items.subCategory');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

module.exports = router;
