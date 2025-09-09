const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
  customerName: { type: String },
  customerEmail: { type: String },
  customerMobile: { type: String },
  items: [
    {
      name: { type: String },
      quantity: { type: Number },
      cost: { type: Number },
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
      discountedPrice: { type: Number }
    }
  ],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  type: { type: String }, // e.g. 'mealbox'
  cancelReason: { type: String },
  deliveryAddress: { type: String }
}, { timestamps: true });


module.exports = mongoose.model('Order', orderSchema);
