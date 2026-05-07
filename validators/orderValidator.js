const { body } = require('express-validator');

const VALID_SERVING_SIZES = [1, 2, 4, 6];
const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

// --- Place Order ---
exports.createOrderValidator = [
  body('items')
    .notEmpty().withMessage('Order items are required')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),

  body('items.*.boxId')
    .notEmpty().withMessage('Each item must have a box ID')
    .isMongoId().withMessage('Invalid box ID — must be a valid MongoDB ObjectId'),

  body('items.*.servingSize')
    .notEmpty().withMessage('Serving size is required for each item')
    .isInt().withMessage('Serving size must be a whole number')
    .isIn(VALID_SERVING_SIZES).withMessage(`Serving size must be one of: ${VALID_SERVING_SIZES.join(', ')}`),

  body('items.*.quantity')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20'),

  // Delivery address — all fields required
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

// --- Update Order Status (Admin) ---
exports.updateOrderStatusValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];