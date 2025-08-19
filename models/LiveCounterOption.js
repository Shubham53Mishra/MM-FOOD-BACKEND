const mongoose = require('mongoose');

const liveCounterOptionSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveCounterCategory' },
  name: { type: String, required: true }, // e.g. Toppings, Spice Level
  choices: [String] // e.g. ["Paneer", "Chicken", "Extra Cheese"]
});

module.exports = mongoose.model('LiveCounterOption', liveCounterOptionSchema);
