const mongoose = require('mongoose');

const mealBoxSchema = new mongoose.Schema({
  title: String,
  description: String,
  minQty: Number,
  price: Number,
  deliveryDate: Date,
  sampleAvailable: { type: Boolean, default: false },
  boxImage: String,      // Cloudinary URL
  actualImage: String,   // Cloudinary URL
  items: [{ name: String, description: String }],
  packagingDetails: String,
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }],
  email: { type: String }
});

module.exports = mongoose.model('MealBox', mealBoxSchema);
