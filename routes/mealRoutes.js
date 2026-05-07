const express = require('express');
const router = express.Router();
const { getMeals, getMeal, createMeal, updateMeal, deleteMeal } = require('../controllers/mealController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { createMealValidator, updateMealValidator } = require('../validators/mealValidator');




router.route('/')
  .get(getMeals)
  .post(protect, adminOnly, createMealValidator, validate, createMeal);

router.route('/:id')
  .get(getMeal)
  .put(protect, adminOnly, updateMealValidator, validate, updateMeal)
  .delete(protect, adminOnly, deleteMeal);

module.exports = router;