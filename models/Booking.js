const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  counters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LiveCounterCategory' }],
  guestCount: Number,
  date: Date,
  time: String,
  venue: String,
  preferences: Object, // customization options
  status: { type: String, default: 'pending' },
  assignedVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
});

module.exports = mongoose.model('Booking', bookingSchema);
