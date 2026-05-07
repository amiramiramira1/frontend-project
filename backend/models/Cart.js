const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  box: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Box',
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
    min: 1,
  },
  pricePerItem: {
    type: Number,
    required: true, // Calculated at the time of adding to cart
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
    cartTotal: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// --- Cart Method: Recalculate Total ---
// Call this every time items are added, updated, or removed
cartSchema.methods.recalculateTotal = function () {
  this.cartTotal = this.items.reduce((sum, item) => {
    return sum + item.pricePerItem * item.quantity;
  }, 0);
  this.cartTotal = parseFloat(this.cartTotal.toFixed(2));
};

module.exports = mongoose.model('Cart', cartSchema);