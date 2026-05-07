const express = require('express');
const router = express.Router();
const {
  getCart, addItemToCart, updateCartItem,
  removeItemFromCart, clearCart, checkout,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { addToCartValidator, updateCartItemValidator, checkoutValidator } = require('../validators/cartValidator');


// All cart routes are private — user must be logged in
router.get('/', protect, getCart);
router.post('/items', protect, addToCartValidator, validate, addItemToCart);
router.put('/items/:itemId', protect, updateCartItemValidator, validate, updateCartItem);
router.delete('/items/:itemId', protect, removeItemFromCart);
router.delete('/', protect, clearCart);
router.post('/checkout', protect, checkoutValidator, validate, checkout);

module.exports = router;