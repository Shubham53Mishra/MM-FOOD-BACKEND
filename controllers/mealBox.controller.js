// Cancel mealbox order by mealbox_id and vendor, with reason
exports.cancelMealBoxOrder = async (req, res) => {
	try {
	const orderId = req.params.orderId;
		const vendorId = req.user && req.user._id;
		const { reason } = req.body;
		if (!orderId) {
			return res.status(400).json({ success: false, message: 'Order ID required.' });
		}
		if (!vendorId) {
			return res.status(401).json({ success: false, message: 'Vendor authentication required.' });
		}
		if (!reason) {
			return res.status(400).json({ success: false, message: 'Cancel reason required.' });
		}
		const MealBoxOrder = require('../models/MealBoxOrder');
		const order = await MealBoxOrder.findById(orderId);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found.' });
		}
		if (String(order.vendor) !== String(vendorId)) {
			return res.status(403).json({ success: false, message: 'Unauthorized: You can only cancel your own mealbox orders.' });
		}
		if (!['pending', 'confirmed'].includes(order.status)) {
			return res.status(400).json({ success: false, message: 'Order cannot be cancelled. Status must be pending or confirmed.' });
		}
		order.status = 'cancelled';
		order.cancelReason = reason;
		await order.save();
		res.status(200).json({ success: true, message: 'Order cancelled.', order });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
// Confirm mealbox order by orderId
exports.confirmMealBoxOrder = async (req, res) => {
	console.log('--- DEBUG: confirmMealBoxOrder ---');
	console.log('Headers:', req.headers);
	console.log('Body:', req.body);
	console.log('ConfirmMealBoxOrder received body:', req.body);
	try {
		const orderId = req.params.orderId;
		if (!orderId) {
			return res.status(400).json({ success: false, message: 'Order ID required.' });
		}
		const MealBoxOrder = require('../models/MealBoxOrder');
		// Find order by ID
		const order = await MealBoxOrder.findById(orderId);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found.' });
		}
		// Only change status if currently pending
		if (order.status !== 'pending') {
			return res.status(400).json({ success: false, message: 'Order cannot be confirmed. Status is not pending.' });
		}
		// Set delivery time and date if provided
		if (req.body.deliveryTime !== undefined) order.deliveryTime = String(req.body.deliveryTime);
		if (req.body.deliveryDate !== undefined) order.deliveryDate = String(req.body.deliveryDate);
		order.status = 'confirmed';
		await order.save();
		res.status(200).json({
			success: true,
			message: 'Order confirmed successfully!',
			order: {
				_id: order._id,
				mealBox: order.mealBox,
				quantity: order.quantity,
				vendor: order.vendor,
				type: order.type,
				status: order.status,
				deliveryTime: order.deliveryTime,
				deliveryDate: order.deliveryDate,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt
			}
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
exports.getMealBoxes = async (req, res) => {

	try {
		// Always show all mealboxes, public endpoint
		const mealBoxes = await MealBox.find().populate({ path: 'items', model: 'Item' });
		res.status(200).json({ success: true, mealBoxes });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
exports.addMultipleCustomItemsToMealBox = async (req, res) => {
	res.send('addMultipleCustomItemsToMealBox');
};

exports.getFavoriteMealBoxes = async (req, res) => {
	res.send('getFavoriteMealBoxes');
};

exports.createMealBoxOrder = async (req, res) => {
	try {
		const { mealBoxId, quantity, customerName, customerEmail, customerMobile, deliveryAddress, type, vendorId: vendorIdFromBody, status } = req.body;
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
		const mealBoxOrder = new MealBoxOrder({
			customerName,
			customerEmail,
			customerMobile,
			mealBox: mealBox._id,
			quantity,
			deliveryAddress,
			type: type || 'mealbox',
			vendor: vendorId,
			status: status || 'pending'
		});
		await mealBoxOrder.save();
		res.status(201).json({
			success: true,
			message: 'MealBox order created',
			mealBoxOrder
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
		const orderId = req.params.orderId;
		const vendorId = req.user && req.user._id;
		if (!orderId) {
			return res.status(400).json({ success: false, message: 'Order ID required.' });
		}
		if (!vendorId) {
			return res.status(401).json({ success: false, message: 'Vendor authentication required.' });
		}
		const order = await MealBoxOrder.findById(orderId).populate('mealBox vendor');
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found' });
		}
		const orderVendorId = String(order.vendor && order.vendor._id ? order.vendor._id : order.vendor);
		const mealBoxVendorId = String(order.mealBox && order.mealBox.vendor ? order.mealBox.vendor : '');
		const tokenVendorId = String(vendorId);
		if (orderVendorId !== tokenVendorId || mealBoxVendorId !== tokenVendorId) {
			return res.status(403).json({ success: false, message: 'Unauthorized: You can only confirm your own mealbox orders.' });
		}
		if (order.status !== 'pending') {
			return res.status(400).json({ success: false, message: 'Order cannot be confirmed. Status is not pending.' });
		}
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
	try {
		// Accept form-data fields
	const { title, description, minQty, price, prepareOrderDays, packagingDetails, sampleAvailable, items } = req.body;
		// Accept images from upload.fields and upload to Cloudinary
		let boxImageUrl = null;
		let actualImageUrl = null;
		const cloudinaryUpload = async (file) => {
			if (!file) return null;
			const result = await cloudinary.uploader.upload(file.path, { folder: 'mealbox' });
			return result.secure_url;
		};
		if (req.files && req.files.boxImage && req.files.boxImage[0]) {
			boxImageUrl = await cloudinaryUpload(req.files.boxImage[0]);
		}
		if (req.files && req.files.actualImage && req.files.actualImage[0]) {
			actualImageUrl = await cloudinaryUpload(req.files.actualImage[0]);
		}
		// Accept vendor from auth
		const vendor = req.user && req.user._id;
		// Validate required fields (prepareOrderDays required, deliveryDate removed)
		if (!title || !minQty || !price || !prepareOrderDays || !vendor || !items || !packagingDetails || !(req.files && req.files.boxImage && req.files.actualImage)) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields. Make sure you are sending all fields as form-data and images as files.',
				received: {
					title,
					description,
					minQty,
					price,
					prepareOrderDays,
					sampleAvailable,
					items,
					packagingDetails,
					boxImage: req.files && req.files.boxImage,
					actualImage: req.files && req.files.actualImage,
					vendor
				}
			});
		}
		// No deliveryDate calculation, just use prepareOrderDays
		// Ensure items is always an array of ObjectIds
		let itemsArr = items;
		if (typeof itemsArr === 'string') {
			try {
				itemsArr = JSON.parse(itemsArr);
			} catch {
				itemsArr = itemsArr.split(',').map(i => i.trim());
			}
		}
		if (!Array.isArray(itemsArr)) {
			itemsArr = [itemsArr];
		}
		// Create new MealBox
		const mealBox = new MealBox({
			title,
			description,
			minQty: Number(minQty),
			price: Number(price),
			prepareOrderDays: typeof prepareOrderDays === 'string' ? prepareOrderDays : String(prepareOrderDays),
			packagingDetails,
			sampleAvailable: sampleAvailable === 'true' || sampleAvailable === true,
			boxImage: boxImageUrl,
			actualImage: actualImageUrl,
			vendor,
			items: itemsArr
		});
		await mealBox.save();
		// Populate vendor details for response
		const populatedMealBox = await MealBox.findById(mealBox._id).populate({ path: 'vendor', select: '_id name email mobile' });
		res.status(201).json({ success: true, message: 'MealBox created', mealBox: populatedMealBox });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};


// Placeholder implementations for missing handlers
exports.favoriteMealBox = async (req, res) => {
	res.status(200).json({ success: true, message: 'favoriteMealBox placeholder' });
};
exports.unfavoriteMealBox = async (req, res) => {
	res.status(200).json({ success: true, message: 'unfavoriteMealBox placeholder' });
};
exports.deleteMealBox = async (req, res) => {
    try {
        const mealBoxId = req.params.id || req.params.mealBoxId;
        if (!mealBoxId) {
            return res.status(400).json({ success: false, message: 'MealBox ID required.' });
        }
        const deleted = await MealBox.findByIdAndDelete(mealBoxId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'MealBox not found.' });
        }
        res.status(200).json({ success: true, message: 'MealBox deleted successfully.', mealBox: deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateMealBox = async (req, res) => {
	res.status(200).json({ success: true, message: 'updateMealBox placeholder' });
};
exports.addCustomItemToMealBox = async (req, res) => {
	res.status(200).json({ success: true, message: 'addCustomItemToMealBox placeholder' });
};

exports.getConfirmedMealBoxOrdersWithTracking = async (req, res) => {
	try {
		const MealBoxOrder = require('../models/MealBoxOrder');
		const orders = await MealBoxOrder.find({ status: 'confirmed' }, 'deliveryTime deliveryDate status').lean();
		res.status(200).json({ success: true, orders });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Fix for destructuring import in routes
module.exports = exports;
//# sourceMappingURL=mealboxController.js.map
