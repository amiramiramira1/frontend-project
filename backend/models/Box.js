const mongoose = require('mongoose');

const boxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    image: String,
    type: {
      type: String,
      enum: ['pre-made', 'custom'],
      default: 'pre-made',
    },
    meals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meal',
      },
    ],
    dietType: {
      type: String,
      enum: ['vegan', 'vegetarian', 'keto', 'paleo', 'standard', 'mixed'],
      default: 'mixed',
    },
    basePrice: {
      type: Number,
      default: 0, // Calculated from meals' pricePerServing sum
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate boxes without deleting them
    },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Box', boxSchema);