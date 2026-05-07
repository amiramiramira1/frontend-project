const Meal = require('../models/Meal');
const Ingredient = require('../models/Ingredient');
const paginate = require('../utils/paginate');


// Helper function: populate ingredient details and calculate totals
const calculateMealTotals = async (ingredients) => {
  let totalCost = 0;
  let totalCalories = 0;

  for (const item of ingredients) {
    const ingredient = await Ingredient.findById(item.ingredient);
    if (!ingredient) throw new Error(`Ingredient with ID ${item.ingredient} not found`);
    totalCost += ingredient.costPerUnit * item.quantity;
    totalCalories += ingredient.caloriesPerUnit * item.quantity;
  }

  return {
    pricePerServing: parseFloat(totalCost.toFixed(2)),
    caloriesPerServing: Math.round(totalCalories),
  };
};

// @route   GET /api/meals
// @access  Public
const getMeals = async (req, res) => {
  try {
    // Build filter from query params
    const filter = {};
    if (req.query.dietType) filter.dietType = req.query.dietType;
    if (req.query.cuisine) filter.cuisine = req.query.cuisine;
    if (req.query.maxPrice) filter.pricePerServing = { $lte: Number(req.query.maxPrice) };

    const result = await paginate(
      Meal,
      filter,
      { page: req.query.page, limit: req.query.limit, sort: req.query.sort },
      'ingredients.ingredient' // populate
    );

    res.status(200).json({
      meals: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/meals/:id
// @access  Public
const getMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id).populate('ingredients.ingredient');
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    res.status(200).json({ meal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/meals
// @access  Private/Admin
const createMeal = async (req, res) => {
  try {
    const { name, description, ingredients, dietType, cuisine, image } = req.body;

    // Auto-calculate price and calories before saving
    const { pricePerServing, caloriesPerServing } = await calculateMealTotals(ingredients);

    const meal = await Meal.create({
      name,
      description,
      ingredients,
      dietType,
      cuisine,
      image,
      pricePerServing,
      caloriesPerServing,
    });

    res.status(201).json({ message: 'Meal created', meal });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   PUT /api/meals/:id
// @access  Private/Admin
const updateMeal = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If ingredients are being updated, recalculate price and calories
    if (req.body.ingredients) {
      const { pricePerServing, caloriesPerServing } = await calculateMealTotals(req.body.ingredients);
      updateData.pricePerServing = pricePerServing;
      updateData.caloriesPerServing = caloriesPerServing;
    }

    const meal = await Meal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('ingredients.ingredient');

    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    res.status(200).json({ message: 'Meal updated', meal });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/meals/:id
// @access  Private/Admin
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    res.status(200).json({ message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMeals, getMeal, createMeal, updateMeal, deleteMeal };