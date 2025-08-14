const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  image: { type: String }, // Cloudinary image URL
  city: { type: String },
  state: { type: String },
  address: { type: String }
});

module.exports = mongoose.model('Vendor', vendorSchema);
module.exports = mongoose.model('Vendor', vendorSchema);
