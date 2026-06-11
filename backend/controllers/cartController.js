const Cart = require('../models/Cart');
const Box = require('../models/Box');
const Order = require('../models/Order');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { decrementIngredientsForOrder } = require('../utils/inventoryHelper');

const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

// Helper: get or create a cart for the logged-in user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.box', 'name image basePrice');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], cartTotal: 0 });
  }
  return cart;
};

// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/cart/items
// @access  Private
const addItemToCart = async (req, res) => {
  try {
    const { boxId, servingSize, quantity = 1 } = req.body;

    const box = await Box.findById(boxId);
    if (!box) return res.status(404).json({ message: 'Box not found' });
    if (!box.isActive) return res.status(400).json({ message: 'This box is no longer available' });

    const multiplier = SERVING_MULTIPLIERS[servingSize] || 1;
    const pricePerItem = parseFloat((box.basePrice * multiplier).toFixed(2));

    const cart = await getOrCreateCart(req.user.id);

    // Check if this exact box + servingSize combo already exists in the cart
    // NOTE: item.box may be a populated object (from getOrCreateCart), so use _id if present
    const existingItemIndex = cart.items.findIndex(
      (item) => {
        const itemBoxId = item.box?._id ? item.box._id.toString() : item.box.toString();
        return itemBoxId === boxId && item.servingSize === servingSize;
      }
    );

    if (existingItemIndex >= 0) {
      // Item already in cart — just increase quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // New item — add to cart
      cart.items.push({ box: boxId, servingSize, quantity, pricePerItem });
    }

    cart.recalculateTotal();
    await cart.save();

    await cart.populate('items.box', 'name image basePrice');
    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/cart/items/:itemId
// @access  Private
// Update quantity or serving size of a specific cart item
const updateCartItem = async (req, res) => {
  try {
    const { quantity, servingSize } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId); // .id() finds a subdocument by _id
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    // If serving size changed, recalculate pricePerItem
    if (servingSize && servingSize !== item.servingSize) {
      const box = await Box.findById(item.box);
      const multiplier = SERVING_MULTIPLIERS[servingSize] || 1;
      item.pricePerItem = parseFloat((box.basePrice * multiplier).toFixed(2));
      item.servingSize = servingSize;
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        // If quantity is set to 0 or below, remove the item
        item.deleteOne();
      } else {
        item.quantity = quantity;
      }
    }

    cart.recalculateTotal();
    await cart.save();

    await cart.populate('items.box', 'name image basePrice');
    res.status(200).json({ message: 'Cart updated', cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/cart/items/:itemId
// @access  Private
const removeItemFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    item.deleteOne(); // Remove the subdocument
    cart.recalculateTotal();
    await cart.save();

    res.status(200).json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = [];
    cart.cartTotal = 0;
    await cart.save();

    res.status(200).json({ message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/cart/checkout
// @access  Private
// Converts the cart into an Order, then clears the cart
const checkout = async (req, res) => {
  try {
    const { deliveryAddress } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.box');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Build order items from cart items
    const orderItems = cart.items.map((item) => ({
      box: item.box._id,
      servingSize: item.servingSize,
      quantity: item.quantity,
      priceAtPurchase: item.pricePerItem,
    }));

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice: cart.cartTotal,
      deliveryAddress,
      orderType: 'one-time',
    });

    // Decrement ingredient stocks proportionally
    await decrementIngredientsForOrder(order);

    // Clear the cart after successful checkout
    cart.items = [];
    cart.cartTotal = 0;
    await cart.save();

    // Fire-and-forget order placed email (never blocks the API response)
    User.findById(req.user.id).then((user) => {
      if (user) {
        const populatedOrder = { ...order.toObject(), items: cart.items };
        emailService.sendOrderPlacedEmail(
          { ...order.toObject(), items: orderItems.map((i, idx) => ({ ...i, box: cart.items[idx]?.box })) },
          user
        ).catch((err) => console.error('📧 Order placed email failed:', err.message));
      }
    }).catch(() => {});

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCart, addItemToCart, updateCartItem, removeItemFromCart, clearCart, checkout };