const Box = require('../models/Box');
const Meal = require('../models/Meal');
const paginate = require('../utils/paginate');

// Helper: calculate box base price from its meals
const calculateBoxPrice = async (mealIds) => {
  const meals = await Meal.find({ _id: { $in: mealIds } });
  const total = meals.reduce((sum, meal) => sum + meal.pricePerServing, 0);
  return parseFloat(total.toFixed(2));
};

// Serving size multipliers
const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

// @route   GET /api/boxes
// @access  Public
const getBoxes = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.dietType) filter.dietType = req.query.dietType;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.maxPrice) filter.basePrice = { $lte: Number(req.query.maxPrice) };

    const servingSize = parseInt(req.query.servingSize) || 2;
    const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };
    const multiplier = SERVING_MULTIPLIERS[servingSize] || 1;

    const result = await paginate(
      Box,
      filter,
      { page: req.query.page, limit: req.query.limit, sort: req.query.sort },
      { path: 'meals', populate: { path: 'ingredients.ingredient' } }
    );

    // Add computed price for the requested serving size to each box
    const boxes = result.data.map((box) => ({
      ...box.toObject(),
      priceForServing: parseFloat((box.basePrice * multiplier).toFixed(2)),
      requestedServingSize: servingSize,
    }));

    res.status(200).json({
      boxes,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/boxes/:id
// @access  Public
const getBox = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id).populate({
      path: 'meals',
      populate: { path: 'ingredients.ingredient' },
    });
    if (!box) return res.status(404).json({ message: 'Box not found' });
    res.status(200).json({ box });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/boxes
// @access  Private/Admin
const createBox = async (req, res) => {
  try {
    const { name, description, image, type, meals, dietType } = req.body;
    const basePrice = await calculateBoxPrice(meals);

    const box = await Box.create({ name, description, image, type, meals, dietType, basePrice });
    res.status(201).json({ message: 'Box created', box });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   POST /api/boxes/custom
// @access  Private (any logged-in user)
// Allows a customer to build their own box from a list of meal IDs
const createCustomBox = async (req, res) => {
  try {
    const { meals, name, servingSize } = req.body;
    if (!meals || meals.length === 0) {
      return res.status(400).json({ message: 'Please select at least one meal' });
    }

    const basePrice = await calculateBoxPrice(meals);
    const multiplier = SERVING_MULTIPLIERS[servingSize] || 1;

    const customBox = await Box.create({
      name: name || `Custom Box by ${req.user.name}`,
      type: 'custom',
      meals,
      basePrice,
      dietType: 'mixed',
    });

    res.status(201).json({
      message: 'Custom box created',
      box: customBox,
      priceForServing: parseFloat((basePrice * multiplier).toFixed(2)),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   PUT /api/boxes/:id
// @access  Private/Admin
const updateBox = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.meals) {
      updateData.basePrice = await calculateBoxPrice(req.body.meals);
    }
    const box = await Box.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true,
    });
    if (!box) return res.status(404).json({ message: 'Box not found' });
    res.status(200).json({ message: 'Box updated', box });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/boxes/:id
// @access  Private/Admin
const deleteBox = async (req, res) => {
  try {
    // Soft delete: set isActive to false instead of really deleting
    const box = await Box.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!box) return res.status(404).json({ message: 'Box not found' });
    res.status(200).json({ message: 'Box deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/boxes/custom/calculate
// @access  Private
// Preview price, calories, and allergens WITHOUT saving anything to the database
const calculateCustomBox = async (req, res) => {
  try {
    const { mealIds, servingSize = 2 } = req.body;

    if (!mealIds || mealIds.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one meal ID' });
    }

    // Fetch all selected meals with their full ingredient details
    const meals = await Meal.find({ _id: { $in: mealIds } })
      .populate('ingredients.ingredient');

    if (meals.length === 0) {
      return res.status(404).json({ message: 'No valid meals found for the provided IDs' });
    }

    const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };
    const multiplier = SERVING_MULTIPLIERS[servingSize] || 1;

    // Calculate totals across all meals
    let totalBasePrice = 0;
    let totalCalories = 0;
    const allergenSet = new Set(); // Use a Set to automatically avoid duplicates

    for (const meal of meals) {
      totalBasePrice += meal.pricePerServing;
      totalCalories += meal.caloriesPerServing;

      // Collect all allergens from all meals
      meal.allergens.forEach((allergen) => allergenSet.add(allergen));
    }

    const priceForServingSize = parseFloat((totalBasePrice * multiplier).toFixed(2));

    res.status(200).json({
      preview: {
        selectedMeals: meals.map((m) => ({ id: m._id, name: m.name })),
        servingSize,
        basePrice: parseFloat(totalBasePrice.toFixed(2)),
        priceForServingSize,
        totalCalories: Math.round(totalCalories * multiplier),
        allergens: [...allergenSet], // Convert Set back to array
        mealCount: meals.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add to module.exports:
module.exports = { getBoxes, getBox, createBox, createCustomBox, updateBox, deleteBox, calculateCustomBox };