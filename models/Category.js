const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  imageUrl: { type: String }
});

module.exports = mongoose.model('Category', categorySchema);
