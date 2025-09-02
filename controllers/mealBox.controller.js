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
exports.createMealBox = async (req, res) => {
	try {
		let mealBox = {};
		if (typeof req.body.mealBox === 'object' && req.body.mealBox !== null) {
			mealBox = req.body.mealBox;
		} else if (typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0) {
			mealBox = req.body;
		}
		const vendorId = req.vendorId || req.user?.id;
		// Remove categories/subCategories if present
		delete mealBox.categories;
		delete mealBox.subCategories;
		mealBox.boxImage = typeof mealBox.boxImage === 'string' ? mealBox.boxImage : '';
		mealBox.actualImage = typeof mealBox.actualImage === 'string' ? mealBox.actualImage : '';
		mealBox.vendor = vendorId;
		const savedMealBox = await new MealBox(mealBox).save();
		res.status(201).json({ mealBox: savedMealBox });
	} catch (err) {
		res.status(500).json({ message: 'Error creating mealbox', error: err.message });
	}
};
