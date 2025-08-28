const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const User = require('../models/User');

// Get total order count
router.get('/count', async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.json({ totalOrders: count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order count', error: err.message });
  }
});
router.post('/create', async (req, res) => {
  const { customerName, customerEmail, items, vendorId } = req.body;
  if (!customerName || !customerEmail || !items || !vendorId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Validate each item for subCategory and mealBox existence, and apply discount
  for (const item of items) {
    if (item.subCategory) {
      const subCategoryExists = await SubCategory.findById(item.subCategory);
      if (!subCategoryExists) {
        return res.status(400).json({ message: `SubCategory ID ${item.subCategory} not found` });
      }
      // Apply discount if present
      if (subCategoryExists.discount && subCategoryExists.pricePerUnit) {
        const discountAmount = (subCategoryExists.pricePerUnit * subCategoryExists.discount) / 100;
        item.discountedPrice = subCategoryExists.pricePerUnit - discountAmount;
      } else {
        item.discountedPrice = subCategoryExists.pricePerUnit;
      }
    }
    if (item.mealBox) {
      const mealBoxExists = await require('../models/MealBox').findById(item.mealBox);
      if (!mealBoxExists) {
        return res.status(400).json({ message: `MealBox ID ${item.mealBox} not found` });
      }
    }
  }

  try {
    // Find user by email and get deliveryAddress and mobile
    const user = await User.findOne({ email: customerEmail });
    let deliveryAddress = user && user.deliveryAddress ? user.deliveryAddress : '';
    let customerMobile = user && user.mobile ? user.mobile : '';
    const order = new Order({ customerName, customerEmail, items, vendor: vendorId, deliveryAddress, customerMobile });
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
    // Add mobile number to each order in response
    const ordersWithMobile = await Promise.all(orders.map(async (order) => {
      let mobile = order.customerMobile;
      // If not present, fetch from user
      if (!mobile && order.customerEmail) {
        const user = await User.findOne({ email: order.customerEmail });
        mobile = user && user.mobile ? user.mobile : '';
      }
      return { ...order.toObject(), customerMobile: mobile };
    }));
    res.json({ orders: ordersWithMobile });
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

// Vendor views all orders (admin or vendor with valid token)
router.get('/all-orders', authVendor, async (req, res) => {
  try {
    const orders = await Order.find().populate('items.category items.subCategory vendor');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Error fetching all orders", error: err.message });
  }
});

// Vendor confirms an order
router.put('/confirm/:orderId', authVendor, async (req, res) => {
  try {
    // Debug: log vendorId and orderId
    console.log('Vendor:', req.vendorId, 'Order:', req.params.orderId);
    const order = await Order.findOne({ _id: req.params.orderId, vendor: req.vendorId });
    if (!order) {
      return res.status(404).json({ message: "Order not found or not authorized" });
    }
    order.status = 'confirmed';
    await order.save();
    res.json({ message: "Order confirmed", order });
  } catch (err) {
    res.status(500).json({ message: "Error confirming order", error: err.message });
  }
});

// Cancel an order (vendor or user can call this)
router.put('/cancel/:orderId', async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ message: "Cancellation reason is required" });
  }
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    order.status = 'cancelled';
    order.cancelReason = reason;
    await order.save();
    res.json({ message: "Order cancelled", order });
  } catch (err) {
    res.status(500).json({ message: "Error cancelling order", error: err.message });
  }
});

module.exports = router;
