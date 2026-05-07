const { body } = require('express-validator');

const VALID_SERVING_SIZES = [1, 2, 4, 6];
const VALID_FREQUENCIES = ['weekly', 'monthly'];

// --- Create Subscription ---
exports.createSubscriptionValidator = [
  body('boxId')
    .notEmpty().withMessage('Box ID is required')
    .isMongoId().withMessage('Invalid box ID — must be a valid MongoDB ObjectId'),

  body('servingSize')
    .notEmpty().withMessage('Serving size is required')
    .isInt().withMessage('Serving size must be a whole number')
    .isIn(VALID_SERVING_SIZES).withMessage(`Serving size must be one of: ${VALID_SERVING_SIZES.join(', ')}`),

  body('frequency')
    .notEmpty().withMessage('Frequency is required')
    .isIn(VALID_FREQUENCIES).withMessage(`Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`),
];

// --- Update Subscription Serving Size ---
// Allows users to change their serving size without cancelling
exports.updateSubscriptionValidator = [
  body('servingSize')
    .optional()
    .isInt().withMessage('Serving size must be a whole number')
    .isIn(VALID_SERVING_SIZES).withMessage(`Serving size must be one of: ${VALID_SERVING_SIZES.join(', ')}`),

  body('frequency')
    .optional()
    .isIn(VALID_FREQUENCIES).withMessage(`Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`),
];

// --- Admin: Manually Generate Subscription Order ---
exports.generateSubscriptionOrderValidator = [
  body('subscriptionId')
    .notEmpty().withMessage('Subscription ID is required')
    .isMongoId().withMessage('Invalid subscription ID — must be a valid MongoDB ObjectId'),
];