// GET /api/mealbox/my - show only mealboxes added by logged-in vendor
exports.getMyMealBoxes = async (req, res) => {
	try {
		if (!req.user || !req.user.isVendor) {
			return res.status(403).json({ message: 'Only vendors can view their mealboxes.' });
		}
		const mealboxes = await require('../models/MealBox').find({ vendor: req.user.id })
			.populate('vendor', 'name email mobile image')
			.populate('items');
		res.json({ mealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching vendor mealboxes', error: err.message });
	}
};
// Get all mealboxes, or only vendor's mealboxes and orders if vendor token is present
exports.getMealBoxes = async (req, res) => {
	try {
		let query = {};
		let orders = [];
		// If vendor token, show only vendor's mealboxes and orders
		if (req.user && req.user.isVendor) {
			query.vendor = req.user.id;
			orders = await MealBoxOrder.find({ vendor: req.user.id })
				.populate('mealBox')
				.populate('vendor', 'name email');
		}
		const mealboxes = await MealBox.find(query)
			.populate('vendor', 'name email mobile image')
			.populate('items');
		res.json({ mealboxes, orders });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching mealboxes', error: err.message });
	}
};
// GET /api/mealbox/order
exports.getMealBoxOrders = async (req, res) => {
	try {
		const MealBoxOrder = require('../models/MealBoxOrder');
		let query = {};
		// If vendor token, show only vendor's orders. If no token, show all orders.
		if (req.user && req.user.isVendor) {
			query.vendor = req.user.id;
		}
		if (req.query.mealBoxId) {
			query.mealBox = req.query.mealBoxId;
		}
		const orders = await MealBoxOrder.find(query)
			.populate('mealBox')
			.populate('vendor', 'name email');
		const result = orders.map(order => ({
			orderId: order._id,
			customerName: order.customerName,
			customerEmail: order.customerEmail,
			customerMobile: order.customerMobile,
			quantity: order.quantity,
			status: order.status,
			vendor: order.vendor,
			mealBox: order.mealBox ? {
				_id: order.mealBox._id,
				title: order.mealBox.title,
				description: order.mealBox.description,
				minQty: order.mealBox.minQty,
				price: order.mealBox.price,
				packagingDetails: order.mealBox.packagingDetails,
				items: order.mealBox.items,
				boxImage: order.mealBox.boxImage,
				actualImage: order.mealBox.actualImage,
			} : null,
		}));
		return res.json({ orders: result });
	} catch (error) {
		return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST /api/mealbox/order
exports.createMealBoxOrder = async (req, res) => {
    try {
        const { mealBoxId, quantity } = req.body;
        // Get user info from token
        const customerName = req.user && req.user.name;
        const customerEmail = req.user && req.user.email;
        const customerMobile = req.user && req.user.mobile;
        if (!customerName || !customerEmail || !customerMobile) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        // Fetch mealbox info
        const MealBox = require('../models/MealBox');
        const MealBoxOrder = require('../models/MealBoxOrder');
        const mealBox = await MealBox.findById(mealBoxId);
        if (!mealBox) {
            return res.status(404).json({ message: 'MealBox not found' });
        }
        const vendorId = mealBox.vendor;
        // Generate MM format orderId
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const dayShortArr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const dayShort = dayShortArr[now.getDay()];
        const customOrderId = `MM${month}${date}${dayShort}${month}`;

        // Create order
        const order = new MealBoxOrder({
            customerName,
            customerEmail,
            customerMobile,
            mealBox: mealBoxId,
            quantity,
            vendor: vendorId,
            type: 'mealbox',
            status: 'pending',
            orderId: customOrderId
        });
        await order.save();
        // Respond with mealbox info and order details
        return res.status(201).json({
            orderId: order.orderId,
            customerName,
            customerEmail,
            customerMobile,
            quantity,
            status: order.status,
            mealBox: {
                _id: mealBox._id,
                title: mealBox.title,
                description: mealBox.description,
                minQty: mealBox.minQty,
                price: mealBox.price,
                packagingDetails: mealBox.packagingDetails,
                items: mealBox.items,
                boxImage: mealBox.boxImage,
                actualImage: mealBox.actualImage,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
const Order = require('../models/Order');
const MealBoxOrder = require('../models/MealBoxOrder');
// Favorite a mealbox
// Confirm a mealbox order
exports.confirmMealBoxOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const order = await MealBoxOrder.findById(id);
		if (!order) return res.status(404).json({ message: 'Order not found' });
		order.status = 'confirmed';
		await order.save();
		res.json({ message: 'Order confirmed', order });
	} catch (err) {
		res.status(500).json({ message: 'Error confirming mealbox order', error: err.message });
	}
};

// Cancel a mealbox order
exports.cancelMealBoxOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const order = await MealBoxOrder.findById(id);
		if (!order) return res.status(404).json({ message: 'Order not found' });
		order.status = 'cancelled';
		order.cancelReason = reason;
		await order.save();
		res.json({ message: 'Order cancelled', order });
	} catch (err) {
		res.status(500).json({ message: 'Error cancelling mealbox order', error: err.message });
	}
};
exports.favoriteMealBox = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user && req.user.id;
		if (!userId) return res.status(401).json({ message: 'User not authenticated' });
		const mealBox = await MealBox.findById(id);
		if (!mealBox) return res.status(404).json({ message: 'MealBox not found' });
		if (!mealBox.favoritedBy.includes(userId)) {
			mealBox.favoritedBy.push(userId);
			await mealBox.save();
		}
		res.json({ message: 'MealBox favorited', mealBox });
	} catch (err) {
		res.status(500).json({ message: 'Error favoriting mealbox', error: err.message });
	}
};

// Unfavorite a mealbox
exports.unfavoriteMealBox = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user && req.user.id;
		if (!userId) return res.status(401).json({ message: 'User not authenticated' });
		const mealBox = await MealBox.findById(id);
		if (!mealBox) return res.status(404).json({ message: 'MealBox not found' });
		mealBox.favoritedBy = mealBox.favoritedBy.filter(uid => uid.toString() !== userId);
		await mealBox.save();
		res.json({ message: 'MealBox unfavorited', mealBox });
	} catch (err) {
		res.status(500).json({ message: 'Error unfavoriting mealbox', error: err.message });
	}
};

// Get all favorite mealboxes for a user
exports.getFavoriteMealBoxes = async (req, res) => {
	try {
		const userId = req.user && req.user.id;
		if (!userId) return res.status(401).json({ message: 'User not authenticated' });
		const mealboxes = await MealBox.find({ favoritedBy: userId })
			.populate('vendor', 'name email mobile image')
			.populate('items');
		res.json({ mealboxes });
	} catch (err) {
		res.status(500).json({ message: 'Error fetching favorite mealboxes', error: err.message });
	}
};
const cloudinaryService = require('../services/cloudinaryService');
// Delete a mealbox by ID
exports.deleteMealBox = async (req, res) => {
	try {
		const { id } = req.params;
		const deleted = await MealBox.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ message: 'MealBox not found' });
		res.json({ message: 'MealBox deleted successfully' });
	} catch (err) {
		res.status(500).json({ message: 'Error deleting mealbox', error: err.message });
	}
};
// Update a mealbox
// ...existing code...
// Refactored: Single middleware function for routers that expect a function, not an array
const uploadMiddleware = require('../middlewares/upload').fields([
	{ name: 'boxImage', maxCount: 1 },
	{ name: 'actualImage', maxCount: 1 }
]);

exports.updateMealBox = async (req, res) => {
	uploadMiddleware(req, res, async (err) => {
		if (err) {
			return res.status(400).json({ message: 'File upload error', error: err.message });
		}
		try {
			const { id } = req.params;
			let update = req.body || {};
			if (update && typeof update.items === 'string') {
				try {
					update.items = JSON.parse(update.items);
				} catch {
					update.items = [];
				}
			}
			if (req.files && req.files.boxImage) {
				update.boxImage = await cloudinaryService.uploadImage(req.files.boxImage[0].buffer);
			}
			if (req.files && req.files.actualImage) {
				update.actualImage = await cloudinaryService.uploadImage(req.files.actualImage[0].buffer);
			}
			const mealBox = await MealBox.findByIdAndUpdate(id, update, { new: true });
			if (!mealBox) return res.status(404).json({ message: 'MealBox not found' });
			res.json({ mealBox });
		} catch (err) {
			res.status(500).json({ message: 'Error updating mealbox', error: err.message });
		}
	});
};
// Add multiple custom items to an existing MealBox
exports.addMultipleCustomItemsToMealBox = async (req, res) => {
	try {
		const { mealBoxId } = req.params;
		const { items } = req.body; // items should be an array of { name, description }
		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: 'Items array is required' });
		}
		const mealBox = await MealBox.findById(mealBoxId);
		if (!mealBox) {
			return res.status(404).json({ message: 'MealBox not found' });
		}
			items.forEach(item => {
				if (item.name) {
					mealBox.customItems.push({
						name: item.name,
						description: item.description,
						image: item.image || ''
					});
				}
			});
		await mealBox.save();
		res.json({ mealBox });
	} catch (err) {
		res.status(500).json({ message: 'Error adding items', error: err.message });
	}
};
// Add a custom item to an existing MealBox
exports.addCustomItemToMealBox = async (req, res) => {
	try {
		const { mealBoxId } = req.params;
		const { name, description } = req.body;
		if (!name) {
			return res.status(400).json({ message: 'Item name is required' });
		}
		const mealBox = await MealBox.findById(mealBoxId);
		if (!mealBox) {
			return res.status(404).json({ message: 'MealBox not found' });
		}
		mealBox.customItems.push({ name, description });
		await mealBox.save();
		res.json({ mealBox });
	} catch (err) {
		res.status(500).json({ message: 'Error adding item', error: err.message });
	}
};
const MealBox = require('../models/MealBox');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Create a mealbox (no categories/subcategories, but all other info)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

exports.createMealBox = [
	upload.fields([
		{ name: 'boxImage', maxCount: 1 },
		{ name: 'actualImage', maxCount: 1 }
	]),
	async (req, res) => {
		try {
			// Support form-data: req.body for text, req.files for images
			let items = req.body.items;
			// If items is a string (from form-data), parse it as JSON
			if (typeof items === 'string') {
				try {
					items = JSON.parse(items);
				} catch {
					items = [];
				}
			}
			// Force items to be ObjectIds
			if (Array.isArray(items)) {
				const mongoose = require('mongoose');
				items = items.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);
			}
			const mealBox = {
				title: req.body.title,
				description: req.body.description,
				minQty: req.body.minQty,
				price: req.body.price,
				deliveryDate: req.body.deliveryDate,
				sampleAvailable: req.body.sampleAvailable,
				packagingDetails: req.body.packagingDetails,
				items,
				vendor: req.user && req.user.id
			};
			// Handle images from form-data and upload to Cloudinary
			if (req.files && req.files.boxImage) {
				mealBox.boxImage = await cloudinaryService.uploadImage(req.files.boxImage[0].buffer);
			} else {
				mealBox.boxImage = '';
			}
			if (req.files && req.files.actualImage) {
				mealBox.actualImage = await cloudinaryService.uploadImage(req.files.actualImage[0].buffer);
			} else {
				mealBox.actualImage = '';
			}
			const savedMealBox = await new MealBox(mealBox).save();
			res.status(201).json({ mealBox: savedMealBox });
		} catch (err) {
			res.status(500).json({ message: 'Error creating mealbox', error: err.message });
		}
	}
];