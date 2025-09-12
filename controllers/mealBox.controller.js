exports.getMealBoxes = async (req, res) => {
	try {
			let query = {};
			// If vendor token is present, filter by vendor
			if (req.user && req.user._id) {
				query.vendor = req.user._id;
			}
			const mealBoxes = await MealBox.find(query);
			res.status(200).json({ success: true, mealBoxes });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
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
	try {
		const { mealBoxId, quantity } = req.body;
		// Ensure vendor is populated and returned
		const mealBox = await MealBox.findById(mealBoxId).populate({ path: 'vendor', select: '_id name email mobile' });
			console.log('mealBox.vendor:', mealBox ? mealBox.vendor : null);
		if (!mealBox) {
			return res.status(404).json({ success: false, message: 'MealBox not found' });
		}
				let vendorId = null;
				if (mealBox.vendor) {
					if (typeof mealBox.vendor === 'object' && mealBox.vendor._id) {
						vendorId = mealBox.vendor._id;
					} else {
						vendorId = mealBox.vendor;
					}
				}
		res.status(200).json({
			success: true,
			message: 'MealBox order received',
			mealBox,
			vendor: mealBox.vendor || null,
			quantity,
			user: req.user || null
		});
		} catch (error) {
			console.error('MealBoxOrder error:', error);
			res.status(500).json({ success: false, message: error.message, stack: error.stack });
		}
};

exports.getMealBoxOrders = async (req, res) => {
	try {
		const MealBoxOrder = require('../models/MealBoxOrder');
		let orders = [];
		if (req.user && req.user._id) {
			// Find all mealboxes owned by this vendor
			const mealBoxes = await MealBox.find({ vendor: req.user._id });
			const mealBoxIds = mealBoxes.map(mb => mb._id);
			if (mealBoxIds.length === 0) {
				// Vendor has no mealboxes, return empty array
				return res.status(200).json({ success: true, orders: [] });
			}
			// Find orders for those mealboxes only
			orders = await MealBoxOrder.find({ mealBox: { $in: mealBoxIds } }).populate('mealBox vendor');
		} else {
			// No vendor token, return all orders
			orders = await MealBoxOrder.find().populate('mealBox vendor');
		}
		res.status(200).json({ success: true, orders });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
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
const MealBoxOrder = require('../models/MealBoxOrder');
const Vendor = require('../models/Vendor');
const cloudinary = require('../config/cloudinary');

// Create MealBox Combo
exports.createMealBox = async (req, res) => {
			try {
				const vendorId = req.user._id; // vendor token from auth middleware
				let {
					title,
					description,
					minQty,
					price,
					packagingDetails,
					items
				} = req.body;

				// Ensure items is always an array of ObjectIds
				if (typeof items === 'string') {
					try {
						// Try to parse if sent as JSON string
						items = JSON.parse(items);
					} catch {
						// If comma separated, split
						items = items.split(',').map(i => i.trim());
					}
				}
				if (!Array.isArray(items)) {
					items = [items];
				}

				// Upload images if provided (using buffer for memory storage)
				let boxImageUrl = null;
				let actualImageUrl = null;

				// Helper to upload buffer to Cloudinary
				const uploadToCloudinary = (buffer) => {
					return new Promise((resolve, reject) => {
						const stream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
							if (error) return reject(error);
							resolve(result);
						});
						stream.end(buffer);
					});
				};

				if (req.files && req.files.boxImage && req.files.boxImage[0]) {
					const boxImageResult = await uploadToCloudinary(req.files.boxImage[0].buffer);
					boxImageUrl = boxImageResult.secure_url;
				}
				if (req.files && req.files.actualImage && req.files.actualImage[0]) {
					const actualImageResult = await uploadToCloudinary(req.files.actualImage[0].buffer);
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
					actualImageUrl,
					warning: (!boxImageUrl || !actualImageUrl) ? 'One or more images were not uploaded.' : undefined
				});
			} catch (error) {
				res.status(500).json({ success: false, message: error.message });
			}
		};
 