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
			const mealBox = {
				title: req.body.title,
				description: req.body.description,
				minQty: req.body.minQty,
				price: req.body.price,
				deliveryDate: req.body.deliveryDate,
				sampleAvailable: req.body.sampleAvailable,
				packagingDetails: req.body.packagingDetails,
				items: Array.isArray(req.body.items) ? req.body.items : [],
				vendor: req.vendorId || (req.user && req.user.id)
			};
			// Handle images from form-data
			mealBox.boxImage = req.files && req.files.boxImage ? req.files.boxImage[0].originalname : '';
			mealBox.actualImage = req.files && req.files.actualImage ? req.files.actualImage[0].originalname : '';
			const savedMealBox = await new MealBox(mealBox).save();
			res.status(201).json({ mealBox: savedMealBox });
		} catch (err) {
			res.status(500).json({ message: 'Error creating mealbox', error: err.message });
		}
	}
];
