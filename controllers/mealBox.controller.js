// Delete meal box by ID
exports.deleteMealBox = async (req, res) => {
  try {
    const deleted = await MealBox.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'MealBox not found' });
    }
    res.json({ message: 'MealBox deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting meal box', error: err.message });
  }
};
const MealBox = require('../models/MealBox');
const fs = require('fs');
const { uploadImage } = require('../services/cloudinaryService');

// Create meal box
exports.createMealBox = async (req, res) => {
  try {
  let { title, description, minQty, price, deliveryDate, sampleAvailable, items, packagingDetails, categories, subCategories, email } = req.body;
  // Parse categories and subCategories if sent as JSON strings (form-data)
  if (typeof categories === 'string') {
    try {
      categories = JSON.parse(categories);
    } catch (e) {
      return res.status(400).json({ message: 'categories must be a valid JSON array.' });
    }
  }
  if (!Array.isArray(categories)) {
    categories = [];
  }
  if (typeof subCategories === 'string') {
    try {
      subCategories = JSON.parse(subCategories);
    } catch (e) {
      return res.status(400).json({ message: 'subCategories must be a valid JSON array.' });
    }
  }
  if (!Array.isArray(subCategories)) {
    subCategories = [];
  }
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
      categories,
      subCategories,
      email,
      vendor: req.user.id
    });
    res.status(201).json(mealBox);
  } catch (err) {
    res.status(500).json({ message: 'Error creating meal box', error: err.message });
  }
}; 

// Get all meal boxes
exports.getMealBoxes = async (req, res) => {
  try {
      const boxes = await MealBox.find({ vendor: req.user.id })
        .populate({
          path: 'categories',
          select: 'name image'
        })
        .populate({
          path: 'subCategories',
          select: 'name imageUrl category',
          populate: { path: 'category', select: 'name image' }
        });
    res.json(boxes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching meal boxes', error: err.message });
  }
};
