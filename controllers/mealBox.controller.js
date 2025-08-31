const MealBox = require('../models/MealBox');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Create a mealbox (fetches category/subcategory name and image by ID, filters by vendor)
exports.createMealBox = async (req, res) => {
	try {
			let mealBox = typeof req.body === 'object' && req.body !== null ? req.body : {};
			const vendorId = req.vendorId || req.user?.id;
			// Ensure categories and subCategories are arrays
			mealBox.categories = Array.isArray(mealBox.categories) ? mealBox.categories : [];
			mealBox.subCategories = Array.isArray(mealBox.subCategories) ? mealBox.subCategories : [];
			// Populate categories with name and image, filter by vendor
			if (mealBox.categories.length > 0) {
				mealBox.categories = await Promise.all(mealBox.categories.map(async (catId) => {
					const dbCat = await Category.findOne({ _id: catId, vendor: vendorId });
					return dbCat ? { _id: dbCat._id, name: dbCat.name, image: dbCat.imageUrl || dbCat.image } : null;
				}));
				mealBox.categories = mealBox.categories.filter(Boolean);
			}
			// Populate subCategories with name and image, filter by vendor
			if (mealBox.subCategories.length > 0) {
				mealBox.subCategories = await Promise.all(mealBox.subCategories.map(async (subId) => {
					const dbSub = await SubCategory.findOne({ _id: subId, vendor: vendorId });
					return dbSub ? { _id: dbSub._id, name: dbSub.name, image: dbSub.imageUrl } : null;
				}));
				mealBox.subCategories = mealBox.subCategories.filter(Boolean);
			}
			// Save mealBox as a separate document
			mealBox.vendor = vendorId;
			const savedMealBox = await new MealBox(mealBox).save();
			res.status(201).json({ mealBox: savedMealBox });
	} catch (err) {
		res.status(500).json({ message: 'Error creating mealbox', error: err.message });
	}
};
