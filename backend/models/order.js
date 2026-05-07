const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    default: 1,
  },
  priceAtPurchase: {
    type: Number,
    required: true, // Snapshot of the price at order time
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    orderType: {
      type: String,
      enum: ["one-time", "subscription"],
      default: "one-time",
    },
    deliveryAddress: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null, // Null for one-time orders
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
