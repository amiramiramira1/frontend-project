const Ingredient = require('../models/Ingredient');

// @route   GET /api/ingredients
// @access  Private/Admin
const getIngredients = async (req, res) => {
  try {
    const filter = {};
    if (req.query.unit) filter.unit = req.query.unit;
    if (req.query.maxCost) filter.costPerUnit = { $lte: Number(req.query.maxCost) };

    const result = await paginate(
      Ingredient,
      filter,
      { page: req.query.page, limit: req.query.limit, sort: req.query.sort || 'name' }
    );

    res.status(200).json({
      ingredients: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/ingredients/:id
// @access  Private/Admin
const getIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    res.status(200).json({ ingredient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/ingredients
// @access  Private/Admin
const createIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.create(req.body);
    res.status(201).json({ message: 'Ingredient created', ingredient });
  } catch (error) {
    // Handle the 'duplicate key' error (unique name constraint)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An ingredient with this name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @route   PUT /api/ingredients/:id
// @access  Private/Admin
const updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // new: return updated doc; runValidators: re-run schema validation
    );
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    res.status(200).json({ message: 'Ingredient updated', ingredient });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/ingredients/:id
// @access  Private/Admin
const deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });
    res.status(200).json({ message: 'Ingredient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getIngredients, getIngredient, createIngredient, updateIngredient, deleteIngredient };