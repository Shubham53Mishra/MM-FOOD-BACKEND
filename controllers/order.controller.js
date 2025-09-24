// Mark order as delivered and update tracking
exports.markOrderDelivered = async (req, res) => {
	try {
		const Order = require('../models/Order');
		const { id } = req.params;
		const order = await Order.findById(id);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found' });
		}
			order.status = 'delivered';
			// Accept deliveryDate and deliveryTime from request body, fallback to now if not provided
			order.deliveryDate = req.body.deliveryDate || new Date().toISOString().slice(0, 10);
			order.deliveryTime = req.body.deliveryTime || new Date().toTimeString().slice(0, 5);
			order.updatedAt = new Date();
			await order.save();
			// Emit socket event for real-time update
			const io = req.app && req.app.get('io');
			if (io) io.emit('orderUpdated', { action: 'delivered', order });
			res.status(200).json({
				success: true,
				message: 'Order marked as delivered',
				order: {
					_id: order._id,
					status: order.status,
					deliveryDate: order.deliveryDate,
					deliveryTime: order.deliveryTime,
					updatedAt: order.updatedAt
				}
			});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
exports.getOrderTracking = async (req, res) => {
	try {
		const Order = require('../models/Order');
		const order = await Order.findById(req.params.id);
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
				items: order.items,
				vendor: order.vendor,
				status: order.status,
				orderId: order.orderId,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				deliveryTime: order.deliveryTime || null,
				deliveryDate: order.deliveryDate || null
			}
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
// Get all mealbox orders
exports.getMealBoxOrders = async (req, res) => {
	try {
		const orders = await require('../models/Order').find({ orderType: 'mealbox' })
			.populate('mealBox')
			.populate('vendor');
		res.json({ orders });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealbox orders', error: err.message });
	}
};
// Update a mealbox order
exports.updateMealBoxOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const update = req.body;
		const order = await require('../models/Order').findByIdAndUpdate(id, update, { new: true });
		if (!order) return res.status(404).json({ message: 'Order not found' });
		res.json({ order });
	} catch (err) {
		res.status(500).json({ message: 'Error updating mealbox order', error: err.message });
	}
};
// Create a mealbox order
exports.createMealBoxOrder = async (req, res) => {
	try {
		const { customerName, customerEmail, customerMobile, items, mealBoxId, quantity, vendorId, deliveryAddress } = req.body;
		if (!mealBoxId || !quantity || !vendorId || !items) {
			return res.status(400).json({ message: 'Missing required fields' });
		}
		// Find mealbox and vendor
		const mealBox = await require('../models/MealBox').findById(mealBoxId);
		if (!mealBox) return res.status(404).json({ message: 'MealBox not found' });
		// Create order
		const order = new (require('../models/Order'))({
			customerName,
			customerEmail,
			customerMobile,
			items,
			mealBox: mealBoxId,
			quantity,
			vendor: vendorId,
			deliveryAddress,
			orderType: 'mealbox',
			status: 'pending'
		});
		await order.save();
		res.status(201).json({ order });
	} catch (err) {
		res.status(500).json({ message: 'Error creating mealbox order', error: err.message });
	}
};
// Confirm an order
exports.confirmOrder = async (req, res) => {
	console.log('ConfirmOrder received body:', req.body);
	try {
		const orderId = req.params.id;
		const { deliveryTime, deliveryDate } = req.body;
		if (!orderId) {
			return res.status(400).json({ success: false, message: 'Order ID required.' });
		}
		const Order = require('../models/Order');
		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found.' });
		}
		if (order.status !== 'pending') {
			return res.status(400).json({ success: false, message: 'Order cannot be confirmed. Status is not pending.' });
		}
		// Set delivery time and date (Indian time)
		if (req.body.deliveryTime !== undefined) order.deliveryTime = String(req.body.deliveryTime);
		if (req.body.deliveryDate !== undefined) order.deliveryDate = String(req.body.deliveryDate);
		order.markModified('deliveryTime');
		order.markModified('deliveryDate');
		order.status = 'confirmed';
		await order.save();

		// Emit socket event for real-time update
		const io = req.app && req.app.get('io');
		if (io) io.emit('orderUpdated', { action: 'confirmed', order });

		res.status(200).json({
			success: true,
			message: 'Order confirmed',
			order: {
				_id: order._id,
				customerName: order.customerName,
				customerEmail: order.customerEmail,
				customerMobile: order.customerMobile,
				items: order.items,
				vendor: order.vendor,
				status: order.status,
				orderId: order.orderId,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				deliveryTime: order.deliveryTime,
				deliveryDate: order.deliveryDate
			}
		});
	// Add similar socket emit for cancel order if not present
	// If you have a cancel order function, add:
	// const io = req.app && req.app.get('io');
	// if (io) io.emit('orderUpdated', { action: 'cancelled', order });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
// Get confirmed orders with tracking information
exports.getConfirmedOrdersWithTracking = async (req, res) => {
	try {
		const Order = require('../models/Order');
		let query = { status: 'confirmed' };
		if (req.user && req.user.email) {
			query.customerEmail = req.user.email;
		}
		const orders = await Order.find(query).lean();
		const result = orders.map(order => ({
			status: order.status,
			deliveryTime: order.deliveryTime || null,
			deliveryDate: order.deliveryDate || null
		}));
		res.status(200).json({ success: true, orders: result });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
