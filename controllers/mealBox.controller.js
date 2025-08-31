const Order = require('../models/Order');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Create a mealbox (fetches category/subcategory name and image by ID)
exports.createMealBox = async (req, res) => {
	try {
		let mealBox = req.body;
		// Populate categories with name and image
		if (Array.isArray(mealBox.categories)) {
			mealBox.categories = await Promise.all(mealBox.categories.map(async (cat) => {
				const dbCat = await Category.findById(cat._id || cat);
				return dbCat ? { _id: dbCat._id, name: dbCat.name, image: dbCat.imageUrl || dbCat.image } : null;
			}));
			mealBox.categories = mealBox.categories.filter(Boolean);
		}
		// Populate subCategories with name and image
		if (Array.isArray(mealBox.subCategories)) {
			mealBox.subCategories = await Promise.all(mealBox.subCategories.map(async (sub) => {
				const dbSub = await SubCategory.findById(sub._id || sub);
				return dbSub ? { _id: dbSub._id, name: dbSub.name, image: dbSub.imageUrl } : null;
			}));
			mealBox.subCategories = mealBox.subCategories.filter(Boolean);
		}
		const order = new Order({ mealBox });
		await order.save();
		res.status(201).json({ message: 'MealBox created and saved in Order', order });
	} catch (err) {
		res.status(500).json({ message: 'Error creating mealbox', error: err.message });
	}
};
