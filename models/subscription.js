const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    box: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Box",
      required: true,
    },
    servingSize: {
      type: Number,
      enum: [1, 2, 4, 6],
      required: true,
    },
    frequency: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
    },
    nextDeliveryDate: {
      type: Date,
      required: true,
    },
    // Tracks which meals will be in the next delivery for this subscription
    mealRotation: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meal",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
