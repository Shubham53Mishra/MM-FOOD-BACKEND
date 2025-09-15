exports.getOrderTracking = async (req, res) => {
	try {
		const Order = require('../models/Order');
		const order = await Order.findById(req.params.id);
		if (!order) {
			return res.status(404).json({ success: false, message: 'Order not found' });
		}
		res.status(200).json({
			success: true,
			deliveryTime: order.deliveryTime,
			deliveryDate: order.deliveryDate,
			status: order.status
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
		if (deliveryTime !== undefined) order.deliveryTime = String(deliveryTime);
		if (deliveryDate !== undefined) order.deliveryDate = String(deliveryDate);
		order.markModified('deliveryTime');
		order.markModified('deliveryDate');
		order.status = 'confirmed';
		await order.save();
		res.status(200).json({
			success: true,
			message: 'Order confirmed',
			deliveryTime: order.deliveryTime,
			deliveryDate: order.deliveryDate,
			status: order.status
		});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get confirmed orders with tracking information
exports.getConfirmedOrdersWithTracking = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const orders = await Order.find({ status: 'confirmed' }, 'deliveryTime deliveryDate status').lean();
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
