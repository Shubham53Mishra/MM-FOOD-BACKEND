const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
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
