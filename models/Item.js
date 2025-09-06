const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  cost: { type: Number, required: true },
  // pricePerUnit: { type: Number, required: true },
  imageUrl: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
});

module.exports = mongoose.model('Item', itemSchema);
