// Emit mealbox order tracking update to order-specific room
const updateMealBoxOrderTracking = (order, action) => {
	if (!order) return;
	io.to(`mealbox_order_${order._id}`).emit('mealboxOrderTrackingUpdated', { action, order });
	console.log(`[SOCKET] Emitting mealboxOrderTrackingUpdated:${action} to mealbox_order_${order._id}`);
};

// Export for use in controllers
module.exports.updateMealBoxOrderTracking = updateMealBoxOrderTracking;
// Use custom .env file path if needed
require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <-- Add this line to support form-data/urlencoded bodies



app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/mealbox', require('./routes/mealBoxRoutes'));
app.use('/api/item', require('./routes/item.routes'));



const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	},
	pingInterval: 25000, // 25 seconds
	pingTimeout: 60000   // 60 seconds
});

// Helper to fetch all orders and emit to all clients
const emitAllOrders = async () => {
  const Order = require('./models/Order');
  const orders = await Order.find().populate('items.category items.subCategory vendor');
  io.emit('ordersUpdated', orders);
};


// Example: emit after updating meal order (modify as per your real update logic)
const updateMealOrder = (updatedOrderData) => {
	// This sends new data to all connected clients!
	io.emit('mealOrderUpdated', updatedOrderData);
};


const updateOrder = (order, action) => {
	   if (!order) return;
	   // Emit to vendor room (for vendor dashboard)
	   if (order.vendor) {
		   const vendorRoom = order.vendor.toString();
		   io.to(vendorRoom).emit('orderUpdated', { action, order });
		   console.log(`[SOCKET] Emitting orderUpdated:${action} to vendor room`, vendorRoom, order._id);
	   }
	   // Emit to order-specific room (for tracking)
	   io.to(`order_${order._id}`).emit('orderTrackingUpdated', { action, order });
	   console.log(`[SOCKET] Emitting orderTrackingUpdated:${action} to order room`, `order_${order._id}`, 'Order status:', order.status, 'UpdatedAt:', order.updatedAt);
};

// Export updateOrder for use in controllers
module.exports.updateOrder = updateOrder;
// Socket.io connection
io.on('connection', (socket) => {
	// Join mealbox order-specific room for tracking
	socket.on('joinMealBoxOrderRoom', (orderId) => {
		socket.join(`mealbox_order_${orderId}`);
		console.log(`Socket ${socket.id} joined mealbox order room: mealbox_order_${orderId}`);
	});
	console.log('Client connected:', socket.id);

	// Join order-specific room for tracking
	socket.on('joinOrderRoom', (orderId) => {
		socket.join(`order_${orderId}`);
		console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
	});

	// Sample: On admin confirms order, broadcast update
	socket.on('orderConfirmed', (data) => {
		// Update DB, etc...
		updateMealOrder(data); // Broadcast to all clients!
	});

	// Client can request all orders for real-time sync
	socket.on('getAllOrders', async () => {
		const Order = require('./models/Order');
		const orders = await Order.find().populate('items.category items.subCategory vendor');
		socket.emit('ordersUpdated', orders);
	});

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id);
	});
});

// Make io accessible in routes/controllers
app.set('io', io);

// Export emitAllOrders for use in routes
module.exports.emitAllOrders = emitAllOrders;


const PORT = process.env.PORT || 5000;
http.listen(PORT)
	.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			console.error(`Port ${PORT} in use, trying next port...`);
			http.listen(0); // 0 means random free port
		} else {
			throw err;
		}
	})
	.on('listening', () => {
		const address = http.address();
		const actualPort = typeof address === 'string' ? address : address.port;
		console.log(`🚀 Server running on port ${actualPort} (WebSocket enabled)`);
	});
