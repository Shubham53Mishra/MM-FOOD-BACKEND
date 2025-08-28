const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  pricePerUnit: { type: Number },
  discount: { type: Number, default: 0 }, // percent discount, e.g. 20 for 20%
  discountStart: { type: Date }, // discount start time
  discountEnd: { type: Date },   // discount end time
  quantity: { type: Number },
  imageUrl: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
