const MealBox = require('../models/MealBox');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Create a mealbox (fetches category/subcategory name and image by ID, filters by vendor)
exports.createMealBox = async (req, res) => {
	try {
			// Accept categories/subCategories either inside or outside mealBox
			let mealBox = typeof req.body.mealBox === 'object' && req.body.mealBox !== null ? req.body.mealBox : {};
			const vendorId = req.vendorId || req.user?.id;
			// If categories/subCategories are outside mealBox, merge them in
			if (Array.isArray(req.body.categories)) mealBox.categories = req.body.categories;
			if (Array.isArray(req.body.subCategories)) mealBox.subCategories = req.body.subCategories;
			// Ensure categories and subCategories are arrays
			mealBox.categories = Array.isArray(mealBox.categories) ? mealBox.categories : [];
			mealBox.subCategories = Array.isArray(mealBox.subCategories) ? mealBox.subCategories : [];
			// Populate categories with name and image, try vendor filter, fallback to any
			if (mealBox.categories.length > 0) {
				mealBox.categories = await Promise.all(mealBox.categories.map(async (catId) => {
					let dbCat = await Category.findOne({ _id: catId, vendor: vendorId });
					if (!dbCat) dbCat = await Category.findOne({ _id: catId });
					return dbCat ? { _id: dbCat._id, name: dbCat.name, image: dbCat.imageUrl || dbCat.image } : null;
				}));
				mealBox.categories = mealBox.categories.filter(Boolean);
			}
			// Populate subCategories with name and image, try vendor filter, fallback to any
			if (mealBox.subCategories.length > 0) {
				mealBox.subCategories = await Promise.all(mealBox.subCategories.map(async (subId) => {
					let dbSub = await SubCategory.findOne({ _id: subId, vendor: vendorId });
					if (!dbSub) dbSub = await SubCategory.findOne({ _id: subId });
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
