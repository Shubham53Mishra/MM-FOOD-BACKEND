// Cancel mealbox order by mealbox_id and vendor, with reason
exports.cancelMealBoxOrder = async (req, res) => {
	try {
		const vendorId = req.user && req.user._id;
		const mealBoxId = req.params.id;
		const { reason } = req.body;
		if (!vendorId) {
			return res.status(401).json({ success: false, message: 'Vendor authentication required.' });
		}
		if (!mealBoxId) {
			return res.status(400).json({ success: false, message: 'MealBox ID required.' });
		}
		if (!reason) {
			return res.status(400).json({ success: false, message: 'Cancel reason required.' });
		}
		// Find the order for this mealbox and vendor with status 'pending' or 'confirmed'
		const order = await MealBoxOrder.findOne({ mealBox: mealBoxId, vendor: vendorId, status: { $in: ['pending', 'confirmed'] } });
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found for this mealbox and vendor.' });
		}
		order.status = 'cancelled';
		order.cancelReason = reason;
		await order.save();
		res.status(200).json({ success: true, message: 'Order cancelled.', order });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
// Confirm mealbox order by mealbox_id and vendor
exports.confirmMealBoxOrder = async (req, res) => {
	try {
	const vendorId = req.user && (req.user.id || req.user._id);
		const mealBoxId = req.params.id;
		if (!vendorId) {
			return res.status(401).json({ success: false, message: 'Vendor authentication required.' });
		}
		if (!mealBoxId) {
			return res.status(400).json({ success: false, message: 'MealBox ID required.' });
		}
		// Find the order for this mealbox and vendor with status 'pending'
		const order = await MealBoxOrder.findOne({ mealBox: mealBoxId, vendor: vendorId, status: 'pending' });
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found for this mealbox and vendor.' });
		}
		order.status = 'confirmed';
		await order.save();
		res.status(200).json({ success: true, message: 'Order confirmed.', order });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
exports.getMealBoxes = async (req, res) => {

	try {
		let mealBoxes;
		if (req.user && req.user._id) {
			// Vendor token present, show only their mealboxes
			const vendorId = req.user._id;
			console.log('GET /api/mealbox for vendorId:', vendorId);
			mealBoxes = await MealBox.find({ vendor: vendorId }).populate({ path: 'items', model: 'Item' });
			console.log('Mealboxes found:', mealBoxes.length);
		} else {
			// No token, show all mealboxes
			mealBoxes = await MealBox.find().populate({ path: 'items', model: 'Item' });
			console.log('GET /api/mealbox for all users. Mealboxes found:', mealBoxes.length);
		}
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
		const { mealBoxId, quantity, customerName, customerEmail, customerMobile, deliveryAddress, type, vendorId: vendorIdFromBody } = req.body;
		const mealBox = await MealBox.findById(mealBoxId).populate({ path: 'vendor', select: '_id name email mobile' });
		if (!mealBox) {
			return res.status(404).json({ success: false, message: 'MealBox not found' });
		}
		// Use vendor from mealBox, ignore vendorId from body for safety
		let vendorId = null;
		if (mealBox.vendor) {
			if (typeof mealBox.vendor === 'object' && mealBox.vendor._id) {
				vendorId = mealBox.vendor._id;
			} else {
				vendorId = mealBox.vendor;
			}
		}
		// Save MealBoxOrder to DB
		const order = new MealBoxOrder({
			customerName,
			customerEmail,
			customerMobile,
			mealBox: mealBox._id,
			quantity,
			vendor: vendorId, // always from mealBox, ignore vendorId from body
			type: type || 'mealbox',
			deliveryAddress,
			status: 'pending'
		});
		await order.save();
		res.status(201).json({
			success: true,
			message: 'MealBox order created',
			order
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
			const tokenVendorId = req.user._id;
			// Find only orders for this vendor and type 'mealbox'
			orders = await MealBoxOrder.find({
				vendor: tokenVendorId,
				type: 'mealbox'
			}).populate('mealBox vendor');
			// Final strict filter: only orders where both order.vendor and mealBox.vendor match token
			orders = orders.filter(order => {
				function normalizeVendor(vendorField) {
					if (!vendorField) return null;
					if (typeof vendorField === 'object') {
						if (vendorField._id) return String(vendorField._id);
						if (vendorField.toHexString) return vendorField.toHexString();
						return String(vendorField);
					}
					return String(vendorField);
				}
				const tokenVendorIdStr = String(tokenVendorId);
				const orderVendorId = normalizeVendor(order.vendor);
				const mealBoxVendorId = normalizeVendor(order.mealBox && order.mealBox.vendor);
				return orderVendorId === tokenVendorIdStr && mealBoxVendorId === tokenVendorIdStr;
			});
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

// Confirm a mealbox order (vendor only)
exports.confirmMealBoxOrder = async (req, res) => {
	try {
		const orderId = req.params.id;
		const vendorId = req.user._id;
		// Find the order and ensure it belongs to this vendor
		const order = await MealBoxOrder.findById(orderId).populate('mealBox vendor');
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found' });
		}
		// Check vendor matches
		const orderVendorId = String(order.vendor && order.vendor._id ? order.vendor._id : order.vendor);
		const mealBoxVendorId = String(order.mealBox && order.mealBox.vendor ? order.mealBox.vendor : '');
		const tokenVendorId = String(vendorId);
		if (orderVendorId !== tokenVendorId || mealBoxVendorId !== tokenVendorId) {
			return res.status(403).json({ success: false, message: 'Unauthorized: You can only confirm your own mealbox orders.' });
		}
		// Update status to confirmed
		order.status = 'confirmed';
		await order.save();
		res.status(200).json({ success: true, message: 'Order confirmed', order });
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

		console.log('Authenticated user:', req.user);
		let vendorId;
		let vendorObj = null;
		if (req.user && req.user._id) {
			vendorId = req.user._id;
		} else if (req.user && req.user.email) {
			const vendor = await Vendor.findOne({ email: req.user.email });
			vendorId = vendor ? vendor._id : null;
			vendorObj = vendor ? vendor : null;
			if (!vendor) {
				console.log('No vendor found for email:', req.user.email);
			}
		}
		if (!vendorId) {
			console.log('Vendor not found for user:', req.user);
			return res.status(400).json({ success: false, message: 'Vendor not found or not authenticated.' });
		}
		console.log('Creating mealbox with vendor:', vendorId);
		try {
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
					items = JSON.parse(items);
				} catch {
					items = items.split(',').map(i => i.trim());
				}
			}
			if (!Array.isArray(items)) {
				items = [items];
			}

			let boxImageUrl = null;
			let actualImageUrl = null;

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

			// Always save vendor info in mealbox
			const mongoose = require('mongoose');
			let vendorObjId = vendorId;
			if (typeof vendorId === 'string') {
				vendorObjId = new mongoose.Types.ObjectId(vendorId);
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
				vendor: vendorObjId
			});
			await mealBox.save();

			// Populate vendor details for response
			const populatedMealBox = await MealBox.findById(mealBox._id).populate({ path: 'vendor', select: '_id name email mobile' });
			const mealBoxObj = populatedMealBox.toObject();
			console.log('Populated vendor:', mealBoxObj.vendor);

			// Always include vendor info in response
			if (!mealBoxObj.vendor || Object.keys(mealBoxObj.vendor).length === 0) {
				console.log('Vendor not populated, using ObjectId:', vendorId);
				if (vendorObj) {
					mealBoxObj.vendor = {
						_id: vendorObj._id,
						name: vendorObj.name,
						email: vendorObj.email,
						mobile: vendorObj.mobile
					};
				} else {
					mealBoxObj.vendor = { _id: vendorId };
				}
			}

			res.status(201).json({
				success: true,
				mealBox: mealBoxObj,
				boxImageUrl,
				actualImageUrl,
				warning: (!boxImageUrl || !actualImageUrl) ? 'One or more images were not uploaded.' : undefined
			});
		} catch (error) {
			res.status(500).json({ success: false, message: error.message });
		}
	};
 