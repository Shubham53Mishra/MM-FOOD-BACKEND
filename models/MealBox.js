const mongoose = require('mongoose');

const mealBoxSchema = new mongoose.Schema({
	title: String,
	description: String,
	minQty: Number,
	price: Number,
	minPrepareOrderDays: { type: Number, required: true },
	maxPrepareOrderDays: { type: Number, required: true },
	sampleAvailable: { type: Boolean, default: false },
	items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
	packagingDetails: String,
	boxImage: String,      // Cloudinary URL
	actualImage: String,   // Cloudinary URL
	vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
	favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('MealBox', mealBoxSchema);
