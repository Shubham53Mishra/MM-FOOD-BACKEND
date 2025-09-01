const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  minQty: { type: Number, default: 1 } // Minimum quantity for this category
});

module.exports = mongoose.model('Category', categorySchema);
