const mongoose = require('mongoose');

const mealBoxSchema = new mongoose.Schema({
	title: String,
	description: String,
	minQty: Number,
	price: Number,
	deliveryDate: Date,
	sampleAvailable: { type: Boolean, default: false },
	items: [{ name: String, description: String }],
	packagingDetails: String,
	boxImage: String,      // Cloudinary URL
	actualImage: String,   // Cloudinary URL
	categories: [{
		_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
		name: String,
		image: String
	}],
	subCategories: [{
		_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
		name: String,
		image: String
	}],
	vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
}, { timestamps: true });

module.exports = mongoose.model('MealBox', mealBoxSchema);
