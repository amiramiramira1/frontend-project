const express = require('express');
const router = express.Router();
const {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require('../controllers/ingredientController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { createIngredientValidator, updateIngredientValidator } = require('../validators/ingredientValidator');


router.route('/')
  .get(protect, adminOnly, getIngredients)                     // Public: anyone can see ingredients
  .post(protect, adminOnly, createIngredientValidator, validate, createIngredient); // Admin only: create

router.route('/:id')
  .get(protect, adminOnly, getIngredient)                                     // Public
  .put(protect, adminOnly, updateIngredientValidator, validate, updateIngredient)              // Admin only
  .delete(protect, adminOnly, deleteIngredient);           // Admin only

module.exports = router;