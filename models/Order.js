const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerMobile: { type: String },
  items: [{ 
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
    mealBox: { type: mongoose.Schema.Types.ObjectId, ref: 'MealBox' },
    quantity: Number
  }],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  status: { type: String, default: 'pending' },
  cancelReason: { type: String },
  deliveryAddress: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
