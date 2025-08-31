const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
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
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  status: { type: String, default: 'pending' },
  cancelReason: { type: String },
  deliveryAddress: { type: String }
}, { timestamps: true });

// Generate random orderId with global counter before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    function randomMix(len) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let str = '';
      for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return str;
    }
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth()+1).toString().padStart(2, '0');
    const year = now.getFullYear();
    // Get current order count
    const Order = mongoose.model('Order');
    const count = await Order.countDocuments();
    this.orderId = `MMORD${day}${month}${randomMix(4)}${year}${count+1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
