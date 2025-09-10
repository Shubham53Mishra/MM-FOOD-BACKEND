const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const User = require('../models/User');

const auth = require('../middlewares/auth');
// Get total order count
router.get('/count', async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.json({ totalOrders: count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order count', error: err.message });
  }
});

router.post('/create', auth, async (req, res) => {
  const { items, vendorId, mealBox } = req.body;
  // Get user info from token
  const customerName = req.user && req.user.name;
  const customerEmail = req.user && req.user.email;
  const customerMobile = req.user && req.user.mobile;
  if (!customerName || !customerEmail || !items || !vendorId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Validate each item for subCategory existence, and apply discount
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
  }

  // Generate custom orderId: MM<month><date><day><month>
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const day = String(now.getDay()).padStart(2, '0');
  const customOrderId = `MM${month}${date}${day}${month}`;

  try {
    const order = new Order({
      customerName,
      customerEmail,
      customerMobile,
      items,
      vendor: vendorId,
      mealBox,
      orderId: customOrderId
    });
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
    // Convert createdAt and updatedAt to IST
    const ordersWithIST = orders.map(order => {
      const obj = order.toObject();
      // Remove timestamps
      delete obj.createdAt;
      delete obj.updatedAt;
      delete obj.createdAtIST;
      delete obj.updatedAtIST;
  // Show actual status from DB
  // If status is missing, fallback to 'pending'
  obj.status = obj.status || 'pending';
      // Remove vendor password if vendor exists
      if (obj.vendor && obj.vendor.password) {
        delete obj.vendor.password;
      }
      // Remove reviews from items.subCategory if present
      if (Array.isArray(obj.items)) {
        obj.items = obj.items.map(item => {
          if (item.subCategory && item.subCategory.reviews) {
            delete item.subCategory.reviews;
          }
          // Remove category field from item
          if (item.category) {
            delete item.category;
          }
          return item;
        });
      }
      return obj;
    });
    res.json({ orders: ordersWithIST });
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
