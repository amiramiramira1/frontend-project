const mongoose = require('mongoose');

const mealIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient', // Reference to the Ingredient collection
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
});

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    ingredients: [mealIngredientSchema], // Array of ingredient + quantity pairs
    dietType: {
      type: String,
      enum: ['vegan', 'vegetarian', 'keto', 'paleo', 'standard'],
      default: 'standard',
    },
    cuisine: {
      type: String,
      default: 'International',
    },
    image: {
      type: String,
      default: '',
    },
    // These are calculated automatically — do NOT set them manually
    pricePerServing: {
      type: Number,
      default: 0,
    },
    caloriesPerServing: {
      type: Number,
      default: 0,
    },
    allergens: {
      type: [String],
      enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish'],
      default: [],
    },
  // TODO: Add these fields for Inventory Management feature
  // inStock: {
  //   type: Boolean,
  //   default: true,
  // },
  // stockQuantity: {
  //   type: Number,
  //   default: 0,
  // },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meal', mealSchema);