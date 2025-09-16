const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const MealBoxOrder = require('../models/MealBoxOrder');

router.put('/order/:id/confirm', async (req, res) => {
  try {
    const { deliveryTime, deliveryDate } = req.body;
    const order = await MealBoxOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Always assign values from req.body, even if they are empty or null
    order.deliveryTime = deliveryTime !== undefined ? deliveryTime : '';
    order.deliveryDate = deliveryDate !== undefined ? deliveryDate : '';
    order.status = 'confirmed';
    await order.save();
    // Fetch the updated order with populated fields and explicitly select deliveryTime and deliveryDate
    const updatedOrder = await MealBoxOrder.findById(order._id)
      .populate('mealBox')
      .populate('vendor')
      .select('+deliveryTime +deliveryDate');
    res.json({ success: true, message: 'Order confirmed', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;