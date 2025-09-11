exports.getMealBoxes = async (req, res) => {
	res.send('getMealBoxes');
};
exports.addMultipleCustomItemsToMealBox = async (req, res) => {
	res.send('addMultipleCustomItemsToMealBox');
};

exports.addCustomItemToMealBox = async (req, res) => {
	res.send('addCustomItemToMealBox');
};
exports.updateMealBox = async (req, res) => {
	res.send('updateMealBox');
};
exports.deleteMealBox = async (req, res) => {
	res.send('deleteMealBox');
};
exports.favoriteMealBox = async (req, res) => {
	res.send('favoriteMealBox');
};

exports.unfavoriteMealBox = async (req, res) => {
	res.send('unfavoriteMealBox');
};

exports.getFavoriteMealBoxes = async (req, res) => {
	res.send('getFavoriteMealBoxes');
};

exports.createMealBoxOrder = async (req, res) => {
	res.send('createMealBoxOrder');
};

exports.getMealBoxOrders = async (req, res) => {
	res.send('getMealBoxOrders');
};
// Get mealboxes added by logged-in vendor
exports.getMyMealBoxes = async (req, res) => {
	try {
		const vendorId = req.user._id;
		const mealBoxes = await MealBox.find({ vendor: vendorId });
		res.status(200).json({ success: true, mealBoxes });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
const MealBox = require('../models/MealBox');
const cloudinary = require('../config/cloudinary');

// Create MealBox Combo
exports.createMealBox = async (req, res) => {
		try {
			const vendorId = req.user._id; // vendor token from auth middleware
			const {
				title,
				description,
				minQty,
				price,
				packagingDetails,
				items
			} = req.body;

			// Upload images if provided
			let boxImageUrl = null;
			let actualImageUrl = null;
			let boxImageResult = null;
			let actualImageResult = null;

			if (req.files && req.files.boxImage && req.files.boxImage[0]) {
				boxImageResult = await cloudinary.uploader.upload(req.files.boxImage[0].path);
				boxImageUrl = boxImageResult.secure_url;
			}
			if (req.files && req.files.actualImage && req.files.actualImage[0]) {
				actualImageResult = await cloudinary.uploader.upload(req.files.actualImage[0].path);
				actualImageUrl = actualImageResult.secure_url;
			}

			const mealBox = new MealBox({
				title,
				description,
				minQty,
				price,
				packagingDetails,
				items,
				boxImage: boxImageUrl,
				actualImage: actualImageUrl,
				vendor: vendorId
			});

			await mealBox.save();
			res.status(201).json({
				success: true,
				mealBox,
				boxImageUrl,
				actualImageUrl
			});
		} catch (error) {
			res.status(500).json({ success: false, message: error.message });
		}
	};
 