const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerMobile: { type: String },
  items: [{ 
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
    quantity: Number
  }],
  mealBox: {
    title: { type: String },
    description: { type: String },
    minQty: { type: Number },
    price: { type: Number },
    deliveryDate: { type: Date },
    sampleAvailable: { type: Boolean, default: false },
    items: [{ name: String, description: String }],
    packagingDetails: { type: String },
    boxImage: { type: String }, // Cloudinary URL
    actualImage: { type: String }, // Cloudinary URL
    categories: [{
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      name: String,
      image: String
    }],
    subCategories: [{
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
      name: String,
      image: String
    }]
  },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  cancelReason: { type: String },
  deliveryAddress: { type: String }
}, { timestamps: true });


module.exports = mongoose.model('Order', orderSchema);
