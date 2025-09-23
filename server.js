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
	}
});

// Socket.io connection
io.on('connection', (socket) => {
	console.log('Client connected:', socket.id);
	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id);
	});
});

// Make io accessible in routes/controllers
app.set('io', io);

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (WebSocket enabled)`));
