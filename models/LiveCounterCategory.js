const mongoose = require('mongoose');

const liveCounterCategorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. Pizza Station
  options: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LiveCounterOption' }]
});

module.exports = mongoose.model('LiveCounterCategory', liveCounterCategorySchema);
