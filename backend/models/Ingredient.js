const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
      unique: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['g', 'kg', 'ml', 'L', 'piece', 'tbsp', 'tsp'],
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    caloriesPerUnit: {
      type: Number,
      required: true,
      min: 0,
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
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model('Ingredient', ingredientSchema);