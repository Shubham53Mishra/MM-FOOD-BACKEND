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
		const { customerName, customerEmail, mealBoxId, quantity, vendorId } = req.body;
		if (!customerName || !customerEmail || !mealBoxId || !quantity || !vendorId) {
			return res.status(400).json({ message: 'Missing required fields' });
		}
		// Find mealbox and vendor
		const mealBox = await require('../models/MealBox').findById(mealBoxId);
		if (!mealBox) return res.status(404).json({ message: 'MealBox not found' });
		// Create order
		const order = new (require('../models/Order'))({
			customerName,
			customerEmail,
			mealBox: mealBoxId,
			quantity,
			vendor: vendorId,
			orderType: 'mealbox',
			status: 'pending'
		});
		await order.save();
		res.status(201).json({ order });
	} catch (err) {
		res.status(500).json({ message: 'Error creating mealbox order', error: err.message });
	}
};
