const { body } = require('express-validator');

const VALID_DIET_TYPES = ['vegan', 'vegetarian', 'keto', 'paleo', 'standard', 'mixed'];
const VALID_SERVING_SIZES = [1, 2, 4, 6];

// --- Create Pre-Made Box (Admin) ---
exports.createBoxValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Box name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Box name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('meals')
    .notEmpty().withMessage('Meals are required')
    .isArray({ min: 1, max: 10 }).withMessage('A box must have between 1 and 10 meals')
    .custom((meals) => {
      // Custom rule: reject duplicate meal IDs in the same box
      const uniqueMeals = new Set(meals);
      if (uniqueMeals.size !== meals.length) {
        throw new Error('A box cannot contain duplicate meals');
      }
      return true;
    }),

  body('meals.*')
    .isMongoId().withMessage('Each meal must be a valid MongoDB ID'),

  body('type')
    .optional()
    .isIn(['pre-made', 'custom']).withMessage('Box type must be pre-made or custom'),

  body('dietType')
    .optional()
    .isIn(VALID_DIET_TYPES).withMessage(`Diet type must be one of: ${VALID_DIET_TYPES.join(', ')}`),

  body('image')
    .optional()
    .trim()
    .isURL().withMessage('Image must be a valid URL'),
];

// --- Update Box (Admin) ---
exports.updateBoxValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Box name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('meals')
    .optional()
    .isArray({ min: 1, max: 10 }).withMessage('A box must have between 1 and 10 meals')
    .custom((meals) => {
      const uniqueMeals = new Set(meals);
      if (uniqueMeals.size !== meals.length) {
        throw new Error('A box cannot contain duplicate meals');
      }
      return true;
    }),

  body('meals.*')
    .optional()
    .isMongoId().withMessage('Each meal must be a valid MongoDB ID'),

  body('dietType')
    .optional()
    .isIn(VALID_DIET_TYPES).withMessage(`Diet type must be one of: ${VALID_DIET_TYPES.join(', ')}`),

  body('image')
    .optional()
    .trim()
    .isURL().withMessage('Image must be a valid URL'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be true or false'),
];

// --- Create Custom Box (Customer) ---
exports.createCustomBoxValidator = [
  body('meals')
    .notEmpty().withMessage('Please select at least one meal')
    .isArray({ min: 1, max: 10 }).withMessage('A custom box can have between 1 and 10 meals')
    .custom((meals) => {
      const uniqueMeals = new Set(meals);
      if (uniqueMeals.size !== meals.length) {
        throw new Error('A box cannot contain duplicate meals');
      }
      return true;
    }),

  body('meals.*')
    .isMongoId().withMessage('Each meal must be a valid MongoDB ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Box name must be between 2 and 100 characters'),

  body('servingSize')
    .notEmpty().withMessage('Serving size is required')
    .isInt().withMessage('Serving size must be a number')
    .isIn(VALID_SERVING_SIZES).withMessage(`Serving size must be one of: ${VALID_SERVING_SIZES.join(', ')}`),
];

// --- Calculate Custom Box Preview ---
exports.calculateCustomBoxValidator = [
  body('mealIds')
    .notEmpty().withMessage('Please provide meal IDs')
    .isArray({ min: 1, max: 10 }).withMessage('Please select between 1 and 10 meals')
    .custom((mealIds) => {
      const unique = new Set(mealIds);
      if (unique.size !== mealIds.length) {
        throw new Error('Duplicate meal IDs are not allowed');
      }
      return true;
    }),

  body('mealIds.*')
    .isMongoId().withMessage('Each meal ID must be a valid MongoDB ID'),

  body('servingSize')
    .optional()
    .isInt().withMessage('Serving size must be a number')
    .isIn(VALID_SERVING_SIZES).withMessage(`Serving size must be one of: ${VALID_SERVING_SIZES.join(', ')}`),
];