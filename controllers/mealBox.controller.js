const MealBox = require('../models/MealBox');
const fs = require('fs');
const { uploadImage } = require('../services/cloudinaryService');

// Create meal box
exports.createMealBox = async (req, res) => {
  try {
  let { title, description, minQty, price, deliveryDate, sampleAvailable, items, packagingDetails, category, subCategories, email } = req.body;
    sampleAvailable = sampleAvailable === 'true' || sampleAvailable === true;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({ message: 'Items must be a valid JSON array.' });
      }
    }
    let boxImage, actualImage;
    if (req.files && req.files.boxImage) {
      const buffer = req.files.boxImage[0].buffer || await fs.promises.readFile(req.files.boxImage[0].path);
      boxImage = await uploadImage(buffer);
    }
    if (req.files && req.files.actualImage) {
      const buffer = req.files.actualImage[0].buffer || await fs.promises.readFile(req.files.actualImage[0].path);
      actualImage = await uploadImage(buffer);
    }
    const mealBox = await MealBox.create({
      title,
      description,
      minQty,
      price,
      deliveryDate,
      sampleAvailable,
      items,
      packagingDetails,
      boxImage,
      actualImage,
      category,
      subCategories,
      email
    });
    res.status(201).json(mealBox);
  } catch (err) {
    res.status(500).json({ message: 'Error creating meal box', error: err.message });
  }
};

// Get all meal boxes
exports.getMealBoxes = async (req, res) => {
  try {
    const boxes = await MealBox.find()
      .populate('category')
      .populate({
        path: 'subCategories',
        select: 'name imageUrl category',
        populate: { path: 'category', select: 'name' }
      });
    res.json(boxes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching meal boxes', error: err.message });
  }
};
