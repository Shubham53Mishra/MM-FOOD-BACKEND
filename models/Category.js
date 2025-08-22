const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  imageUrl: { type: String },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' } // Vendor who created this category
});

module.exports = mongoose.model('Category', categorySchema);
