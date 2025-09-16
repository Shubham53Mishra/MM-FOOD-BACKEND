const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const MealBoxOrder = require('../models/MealBoxOrder');

router.put('/order/:id/confirm', async (req, res) => {
  try {
    const { deliveryTime, deliveryDate } = req.body;
    console.log('Received:', { deliveryTime, deliveryDate }); // Debug log
    const order = await MealBoxOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Always assign values from req.body, even if they are empty or null
    order.deliveryTime = deliveryTime;
    order.deliveryDate = deliveryDate;
    order.status = 'confirmed';
    await order.save();
    // Fetch the updated order with populated fields
    const updatedOrder = await MealBoxOrder.findById(order._id)
      .populate('mealBox')
      .populate('vendor');
    console.log('Saved order:', updatedOrder); // Debug log
    res.json({ success: true, message: 'Order confirmed', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;