const mongoose = require('mongoose');

const mealBoxSchema = new mongoose.Schema({
	title: String,
	description: String,
	minQty: Number,
	price: Number,
	deliveryDate: Date,
	sampleAvailable: { type: Boolean, default: false },
	items: [{ name: String, description: String }],
	// customItems removed; will be added dynamically via add-items API
	packagingDetails: String,
	boxImage: String,      // Cloudinary URL
	actualImage: String,   // Cloudinary URL
	vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
}, { timestamps: true });

module.exports = mongoose.model('MealBox', mealBoxSchema);
