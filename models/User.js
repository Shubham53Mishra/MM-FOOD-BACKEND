const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  company: { type: String },
  image: { type: String }, // Cloudinary image URL
  deliveryAddresses: [
    {
      addressLine: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      label: { type: String } // e.g. Home, Work
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
