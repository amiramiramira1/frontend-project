const { body } = require('express-validator');

const VALID_SERVING_SIZES = [1, 2, 4, 6];

// --- Add Item to Cart ---
exports.addToCartValidator = [
  body('boxId')
    .notEmpty().withMessage('Box ID is required')
    .isMongoId().withMessage('Invalid box ID — must be a valid MongoDB ObjectId'),

  body('servingSize')
    .notEmpty().withMessage('Serving size is required')
    .isInt().withMessage('Serving size must be a whole number')
    .isIn(VALID_SERVING_SIZES).withMessage(`Serving size must be one of: ${VALID_SERVING_SIZES.join(', ')}`),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20'),
];

// --- Update Cart Item ---
exports.updateCartItemValidator = [
  body('quantity')
    .optional()
    .isInt({ min: 0, max: 20 }).withMessage('Quantity must be between 0 and 20'),
  // Note: 0 is allowed because setting quantity to 0 removes the item

  body('servingSize')
    .optional()
    .isInt().withMessage('Serving size must be a whole number')
    .isIn(VALID_SERVING_SIZES).withMessage(`Serving size must be one of: ${VALID_SERVING_SIZES.join(', ')}`),
];

// --- Checkout ---
exports.checkoutValidator = [
  body('deliveryAddress')
    .notEmpty().withMessage('Delivery address is required')
    .isObject().withMessage('Delivery address must be an object'),

  body('deliveryAddress.street')
    .trim()
    .notEmpty().withMessage('Street is required')
    .isLength({ max: 100 }).withMessage('Street is too long'),

  body('deliveryAddress.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 50 }).withMessage('City name is too long'),

  body('deliveryAddress.country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .isLength({ max: 50 }).withMessage('Country name is too long'),

  body('deliveryAddress.postalCode')
    .optional()
    .trim()
    .isPostalCode('any').withMessage('Please provide a valid postal code'),
];