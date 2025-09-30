// Create a simple (sample) meal box order with minimal fields
exports.createSimpleMealBoxOrder = async (req, res) => {
			try {
				const { mealBoxId, quantity, deliveryDays: reqDeliveryDays, deliveryDate: reqDeliveryDate } = req.body;
				if (!mealBoxId || !quantity) {
					return res.status(400).json({ success: false, message: 'mealBoxId and quantity are required.' });
				}
				const mealBox = await require('../models/MealBox').findById(mealBoxId);
				if (!mealBox) {
					return res.status(404).json({ success: false, message: 'MealBox not found.' });
				}
				if (!mealBox.sampleAvailable) {
					return res.status(400).json({ success: false, message: 'This meal box is not a sample/simple product.' });
				}
				// Get user info from token (auth middleware)
				const customerName = req.user && req.user.name;
				const customerEmail = req.user && req.user.email;
				const customerMobile = req.user && req.user.mobile;
				// Allow user to send deliveryDays or deliveryDate, fallback to minPrepareOrderDays
				let deliveryDays = null;
				let deliveryDate = null;
				if (typeof reqDeliveryDays === 'number' && !isNaN(reqDeliveryDays)) {
					deliveryDays = reqDeliveryDays;
				} else if (reqDeliveryDate) {
					// If deliveryDate is sent, calculate deliveryDays from today
					const today = new Date();
					const userDate = new Date(reqDeliveryDate);
					if (isNaN(userDate.getTime())) {
						return res.status(400).json({ success: false, message: 'Invalid deliveryDate format.' });
					}
					const diffTime = userDate.getTime() - today.getTime();
					deliveryDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				} else if (typeof mealBox.minPrepareOrderDays === 'number' && !isNaN(mealBox.minPrepareOrderDays)) {
					deliveryDays = mealBox.minPrepareOrderDays;
				} else {
					deliveryDays = 1;
				}
				// Calculate deliveryDate from deliveryDays
				const today = new Date();
				deliveryDate = new Date(today.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
				if (isNaN(deliveryDate.getTime())) {
					return res.status(400).json({ success: false, message: 'Invalid time value for deliveryDate.' });
				}
				deliveryDate = deliveryDate.toISOString().slice(0,10);
				// Save MealBoxOrder to DB
				const mealBoxOrder = new (require('../models/MealBoxOrder'))({
					customerName,
					customerEmail,
					customerMobile,
					mealBox: mealBox._id,
					quantity,
					vendor: mealBox.vendor,
					status: 'pending',
					deliveryDays,
					deliveryDate,
					isSampleOrder: true
				});
				await mealBoxOrder.save();
				res.status(201).json({
					success: true,
					message: 'Simple meal box order created',
					mealBoxOrder
				});
			} catch (error) {
				res.status(500).json({ success: false, message: error.message });
			}
};
// Get all meal boxes with sampleAvailable: true
exports.getSampleMealBoxes = async (req, res) => {
	try {
		const MealBox = require('../models/MealBox');
		const boxes = await MealBox.find({ sampleAvailable: true });
		res.status(200).json({ success: true, mealBoxes: boxes });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
// Get tracking info for a specific mealbox order by ID
exports.getMealBoxOrderTracking = async (req, res) => {
	try {
		const MealBoxOrder = require('../models/MealBoxOrder');
		const order = await MealBoxOrder.findById(req.params.id);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found' });
		}
		res.status(200).json({
			success: true,
			order: {
				_id: order._id,
				customerName: order.customerName,
				customerEmail: order.customerEmail,
				customerMobile: order.customerMobile,
				mealBox: order.mealBox,
				quantity: order.quantity,
				vendor: order.vendor,
				type: order.type,
				status: order.status,
				deliveryTime: order.deliveryTime || null,
				deliveryDate: order.deliveryDate || null,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt
			}
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
// Mark mealbox order as delivered (tracking update)
exports.markMealBoxOrderDelivered = async (req, res) => {
	try {
		const orderId = req.params.id;
		const { deliveryDate, deliveryTime } = req.body;
		if (!orderId) {
			return res.status(400).json({ success: false, message: 'Order ID required.' });
		}
		const MealBoxOrder = require('../models/MealBoxOrder');
		const order = await MealBoxOrder.findById(orderId);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found.' });
		}
		// Update delivery fields and status
		order.deliveryDate = deliveryDate || order.deliveryDate;
		order.deliveryTime = deliveryTime || order.deliveryTime;
		order.status = 'delivered';
		await order.save();
	// Emit socket event for real-time update (all clients tracking this mealbox order)
	const { updateMealBoxOrderTracking } = require('../server');
	updateMealBoxOrderTracking(order, 'delivered');
		res.status(200).json({
			success: true,
			message: 'MealBox order marked as delivered',
			order: {
				_id: order._id,
				customerName: order.customerName,
				customerEmail: order.customerEmail,
				customerMobile: order.customerMobile,
				mealBox: order.mealBox,
				quantity: order.quantity,
				vendor: order.vendor,
				type: order.type,
				status: order.status,
				deliveryTime: order.deliveryTime || null,
				deliveryDate: order.deliveryDate || null,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt
			}
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
// Cancel mealbox order by mealbox_id and vendor, with reason
exports.cancelMealBoxOrder = async (req, res) => {
		console.log('cancelMealBoxOrder called', {
			params: req.params,
			body: req.body,
			user: req.user
		});
		// Helper to send detailed error
		function sendError(status, message, extra = {}) {
			console.log('CancelMealBoxOrder Error:', message, extra);
			return res.status(status).json({ success: false, message, ...extra });
		}
		try {
			const orderId = req.params.orderId;
			const vendorId = req.user && req.user._id;
			const { reason } = req.body || {};
			if (!orderId) {
				return sendError(400, 'Order ID required.', { params: req.params });
			}
			if (!vendorId) {
				return sendError(401, 'Vendor authentication required.', { user: req.user });
			}
			const MealBoxOrder = require('../models/MealBoxOrder');
			const order = await MealBoxOrder.findById(orderId);
			if (!order) {
				return sendError(404, 'Order not found.', { orderId });
			}
			if (!reason) {
				return sendError(400, 'Cancel reason required.', { body: req.body });
			}
			if (!['pending', 'confirmed'].includes(order.status)) {
				return sendError(400, 'Order cannot be cancelled. Status must be pending or confirmed.', { status: order.status });
			}
			order.status = 'cancelled';
			order.cancelReason = reason;
			await order.save();
			// Emit socket event for real-time update (all clients tracking this mealbox order)
			const { updateMealBoxOrderTracking } = require('../server');
			updateMealBoxOrderTracking(order, 'cancelled');
			res.status(200).json({ success: true, message: 'Order cancelled.', order });
		} catch (error) {
			sendError(500, error.message, { error });
		}
};
// Confirm a mealbox order (vendor only, single definition, sets deliveryTime and deliveryDate)
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
		// Find order without populate for update check
		const order = await MealBoxOrder.findById(orderId);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found' });
		}
		// Check vendor ownership: allow if vendor matches either order.vendor or mealBox.vendor
		const orderVendorId = String(order.vendor);
		// To check mealBox.vendor, need to fetch mealBox
		const mealBox = await MealBox.findById(order.mealBox);
		const mealBoxVendorId = mealBox ? String(mealBox.vendor) : '';
		const tokenVendorId = String(vendorId);
		if (orderVendorId !== tokenVendorId && mealBoxVendorId !== tokenVendorId) {
			return res.status(403).json({ success: false, message: 'Unauthorized: You can only confirm your own mealbox orders.' });
		}
		// Allow updating deliveryTime and deliveryDate even if already confirmed
		const updateFields = {};
		if (order.status === 'pending') {
			updateFields.status = 'confirmed';
		}
			// Support deliveryDays: if provided, calculate deliveryDate
			if (typeof req.body.deliveryDays === 'number') {
				const today = new Date();
				const selectedDate = new Date(today.getTime() + req.body.deliveryDays * 24 * 60 * 60 * 1000);
				updateFields.deliveryDays = req.body.deliveryDays;
				updateFields.deliveryDate = selectedDate.toISOString().slice(0,10);
			} else {
				updateFields.deliveryDays = null;
				updateFields.deliveryDate = req.body.deliveryDate !== undefined ? String(req.body.deliveryDate) : null;
			}
			updateFields.deliveryTime = req.body.deliveryTime !== undefined ? String(req.body.deliveryTime) : null;
		console.log('DEBUG confirmMealBoxOrder:');
		console.log('Request body:', req.body);
		console.log('Update fields:', updateFields);
		if (Object.keys(updateFields).length === 0) {
			return res.status(400).json({ success: false, message: 'No fields to update.' });
		}
		// Debug logging
		console.log('DEBUG confirmMealBoxOrder:');
		console.log('Request body:', req.body);
		console.log('Update fields:', updateFields);
		// Update and return new document with populated fields
		const updatedOrder = await MealBoxOrder.findByIdAndUpdate(
			orderId,
			{ $set: updateFields },
			{ new: true }
		).populate('mealBox vendor');
		console.log('Updated order:', updatedOrder);
	// Emit socket event for real-time update (all clients tracking this mealbox order)
	const { updateMealBoxOrderTracking } = require('../server');
	updateMealBoxOrderTracking(updatedOrder, 'confirmed');
		res.status(200).json({
			success: true,
			message: 'Order confirmed',
				order: {
					_id: updatedOrder._id,
					customerName: updatedOrder.customerName,
					customerEmail: updatedOrder.customerEmail,
					customerMobile: updatedOrder.customerMobile,
					mealBox: updatedOrder.mealBox,
					quantity: updatedOrder.quantity,
					vendor: updatedOrder.vendor,
					type: updatedOrder.type,
					status: updatedOrder.status,
					deliveryTime: updatedOrder.deliveryTime || null,
					deliveryDate: updatedOrder.deliveryDate || null,
					deliveryDays: updatedOrder.deliveryDays,
					createdAt: updatedOrder.createdAt,
					updatedAt: updatedOrder.updatedAt
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
		// Handle deliveryDays: if provided, validate and calculate deliveryDate
		let deliveryDays = req.body.deliveryDays;
		if (typeof deliveryDays !== 'number') {
			deliveryDays = mealBox.minPrepareOrderDays;
		}
		if (deliveryDays < mealBox.minPrepareOrderDays || deliveryDays > mealBox.maxPrepareOrderDays) {
			return res.status(400).json({ success: false, message: `deliveryDays must be between ${mealBox.minPrepareOrderDays} and ${mealBox.maxPrepareOrderDays}` });
		}
		const today = new Date();
		const deliveryDate = new Date(today.getTime() + deliveryDays * 24 * 60 * 60 * 1000).toISOString().slice(0,10);
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
			status: status || 'pending',
			deliveryDays,
			deliveryDate,
			isSampleOrder: mealBox.sampleAvailable === true
		});
		await mealBoxOrder.save();
		// Emit socket event for real-time update
		const io = req.app.get('io');
		if (io) io.emit('mealboxOrderUpdated', { action: 'created', order: mealBoxOrder });
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

// Confirm a mealbox order (vendor only, emits socket event, returns updated order)
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
		// Allow if vendor matches either order.vendor or mealBox.vendor
		const orderVendorId = String(order.vendor && order.vendor._id ? order.vendor._id : order.vendor);
		const mealBoxVendorId = String(order.mealBox && order.mealBox.vendor ? order.mealBox.vendor : '');
		const tokenVendorId = String(vendorId);
		if (orderVendorId !== tokenVendorId && mealBoxVendorId !== tokenVendorId) {
			return res.status(403).json({ success: false, message: 'Unauthorized: You can only confirm your own mealbox orders.' });
		}
		// Allow updating deliveryTime and deliveryDate even if already confirmed
		if (order.status === 'pending') {
			order.status = 'confirmed';
		}
		order.deliveryTime = req.body.deliveryTime !== undefined ? String(req.body.deliveryTime) : order.deliveryTime || null;
		order.deliveryDate = req.body.deliveryDate !== undefined ? String(req.body.deliveryDate) : order.deliveryDate || null;
		await order.save();
		// Emit socket event for real-time update (all clients tracking this mealbox order)
		const { updateMealBoxOrderTracking } = require('../server');
		updateMealBoxOrderTracking(order, 'confirmed');
		res.status(200).json({
			success: true,
			message: 'Order confirmed',
			order: {
				_id: order._id,
				customerName: order.customerName,
				customerEmail: order.customerEmail,
				customerMobile: order.customerMobile,
				mealBox: order.mealBox,
				quantity: order.quantity,
				vendor: order.vendor,
				type: order.type,
				status: order.status,
				deliveryTime: order.deliveryTime || null,
				deliveryDate: order.deliveryDate || null,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt
			}
		});
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
										if (!title || !description || !minQty || !price || !req.body.minPrepareOrderDays || !req.body.maxPrepareOrderDays || !packagingDetails || typeof sampleAvailable === 'undefined' || !items || !vendor) {
											return res.status(400).json({
												success: false,
												message: 'Missing required fields. Make sure you are sending all fields as form-data.',
												received: req.body
											});
										}
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
			minPrepareOrderDays: Number(req.body.minPrepareOrderDays),
			maxPrepareOrderDays: Number(req.body.maxPrepareOrderDays),
			packagingDetails,
			sampleAvailable: sampleAvailable === 'true' || sampleAvailable === true,
			boxImage: boxImageUrl,
			actualImage: actualImageUrl,
			vendor,
			items: itemsArr
		});
		await mealBox.save();
		// Build image URLs for response
		const baseUrl = req.protocol + '://' + req.get('host');
		const boxImageUrlRes = mealBox.boxImage ? baseUrl + '/uploads/' + mealBox.boxImage : null;
		const actualImageUrlRes = mealBox.actualImage ? baseUrl + '/uploads/' + mealBox.actualImage : null;
		res.status(201).json({
			success: true,
			message: 'Meal box created successfully',
			mealBox,
			boxImageUrl: boxImageUrlRes,
			actualImageUrl: actualImageUrlRes
		});
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
		console.error('confirmMealBoxOrder error:', error);
		res.status(500).json({ success: false, message: error.message });
	}
};
exports.updateMealBox = async (req, res) => {
	try {
		const mealBoxId = req.params.id;
		if (!mealBoxId) {
			return res.status(400).json({ success: false, message: 'MealBox ID required.' });
		}

		// Defensive: check req.body is present and is an object
		if (!req.body || typeof req.body !== 'object') {
			return res.status(400).json({ success: false, message: 'No data provided for update.' });
		}

		// Build update object from allowed fields
		const allowedFields = [
			'title', 'description', 'minQty', 'price', 'prepareOrderDays',
			'sampleAvailable', 'items', 'packagingDetails', 'vendor'
		];
		const updateData = {};
		for (const field of allowedFields) {
			if (Object.prototype.hasOwnProperty.call(req.body, field) && req.body[field] !== undefined) {
				updateData[field] = req.body[field];
			}
		}

		// Parse minQty and price as numbers if present
		if (updateData.minQty !== undefined) updateData.minQty = Number(updateData.minQty);
		if (updateData.price !== undefined) updateData.price = Number(updateData.price);

		// Parse sampleAvailable as boolean if present
		if (updateData.sampleAvailable !== undefined) {
			updateData.sampleAvailable = (updateData.sampleAvailable === 'true' || updateData.sampleAvailable === true);
		}

		// If items is a string, try to parse it as JSON or comma-separated
		if (updateData.items && typeof updateData.items === 'string') {
			try {
				updateData.items = JSON.parse(updateData.items);
			} catch {
				updateData.items = updateData.items.split(',').map(i => i.trim());
			}
		}

		// Handle file uploads for boxImage and actualImage
		const cloudinaryUpload = async (file) => {
			if (!file) return null;
			const result = await cloudinary.uploader.upload(file.path, { folder: 'mealbox' });
			return result.secure_url;
		};
		if (req.files && req.files.boxImage && req.files.boxImage[0]) {
			updateData.boxImage = await cloudinaryUpload(req.files.boxImage[0]);
		}
		if (req.files && req.files.actualImage && req.files.actualImage[0]) {
			updateData.actualImage = await cloudinaryUpload(req.files.actualImage[0]);
		}

		// If no fields to update, return error
		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
		}

		// Update the MealBox
		const updatedMealBox = await MealBox.findByIdAndUpdate(
			mealBoxId,
			{ $set: updateData },
			{ new: true }
		).populate({ path: 'vendor', select: '_id name email mobile' });

		if (!updatedMealBox) {
			return res.status(404).json({ success: false, message: 'MealBox not found.' });
		}

		// Always return the latest boxImage and actualImage URLs
		const responseMealBox = updatedMealBox.toObject();
		if (updateData.boxImage) responseMealBox.boxImage = updateData.boxImage;
		if (updateData.actualImage) responseMealBox.actualImage = updateData.actualImage;

		res.status(200).json({
			success: true,
			message: 'MealBox updated successfully.',
			mealBox: responseMealBox
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
	}

exports.addCustomItemToMealBox = async (req, res) => {
	res.status(200).json({ success: true, message: 'addCustomItemToMealBox placeholder' });
};

exports.getConfirmedMealBoxOrdersWithTracking = async (req, res) => {
	try {
		const MealBoxOrder = require('../models/MealBoxOrder');
		let filter = { status: 'confirmed' };
		// If user is logged in, filter by customerEmail
		if (req.user && req.user.email) {
			filter.customerEmail = req.user.email;
		}
		const orders = await MealBoxOrder.find(filter, 'deliveryTime deliveryDate status').lean();
		res.status(200).json({ success: true, orders });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Fix for destructuring import in routes
//# sourceMappingURL=mealboxController.js.map