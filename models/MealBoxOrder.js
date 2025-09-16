const mongoose = require('mongoose');

const mealBoxOrderSchema = new mongoose.Schema({
  customerName: { type: String },
  customerEmail: { type: String },
  customerMobile: { type: String },
  mealBox: { type: mongoose.Schema.Types.ObjectId, ref: 'MealBox' },
  quantity: { type: Number },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  type: { type: String }, // e.g. 'mealbox'
  cancelReason: { type: String },
  deliveryAddress: { type: String },
  deliveryTime: { type: String, default: null },
  deliveryDate: { type: String, default: null },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('MealBoxOrder', mealBoxOrderSchema);
