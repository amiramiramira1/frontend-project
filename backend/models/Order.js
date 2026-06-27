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
        "out_for_delivery",
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
    phone: {
      type: String,
      default: null,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
    timeSlot: {
      type: String,
      enum: ['9AM–12PM', '12PM–3PM', '3PM–6PM', '6PM–9PM'],
      default: null,
    },
    promoCode: {
      type: String,
      default: null,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountedTotal: {
      type: Number,
      default: null, // null means no discount was applied
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
