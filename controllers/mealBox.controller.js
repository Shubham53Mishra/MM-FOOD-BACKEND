const MealBox = require('../models/MealBox');

// Create meal box
exports.createMealBox = async (req, res) => {
  try {
    let { title, description, minQty, price, deliveryDate, sampleAvailable, items, packagingDetails, category } = req.body;
    sampleAvailable = sampleAvailable === 'true' || sampleAvailable === true;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({ message: 'Items must be a valid JSON array.' });
      }
    }
    let boxImage, actualImage;
    if (req.files && req.files.boxImage) boxImage = req.files.boxImage[0].path;
    if (req.files && req.files.actualImage) actualImage = req.files.actualImage[0].path;
    const mealBox = await MealBox.create({
      title, description, minQty, price, deliveryDate, sampleAvailable, items, packagingDetails, boxImage, actualImage, category
    });
    res.status(201).json(mealBox);
  } catch (err) {
    res.status(500).json({ message: 'Error creating meal box', error: err.message });
  }
};

// Get all meal boxes
exports.getMealBoxes = async (req, res) => {
  try {
    const boxes = await MealBox.find().populate('category');
    res.json(boxes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching meal boxes', error: err.message });
  }
};
