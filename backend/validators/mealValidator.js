const { body } = require('express-validator');

const VALID_DIET_TYPES = ['vegan', 'vegetarian', 'keto', 'paleo', 'standard'];
const VALID_ALLERGENS = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish'];

// --- Create Meal ---
exports.createMealValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Meal name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Meal name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('ingredients')
    .notEmpty().withMessage('Ingredients are required')
    .isArray({ min: 1 }).withMessage('A meal must have at least one ingredient')
    .custom((ingredients) => {
      // Custom rule: reject duplicate ingredient IDs in the same meal
      const ids = ingredients.map((i) => i.ingredient);
      const uniqueIds = new Set(ids);
      if (uniqueIds.size !== ids.length) {
        throw new Error('Duplicate ingredients are not allowed in the same meal');
      }
      return true;
    }),

  body('ingredients.*.ingredient')
    .notEmpty().withMessage('Each ingredient entry must have an ingredient ID')
    .isMongoId().withMessage('Invalid ingredient ID — must be a valid MongoDB ObjectId'),

  body('ingredients.*.quantity')
    .notEmpty().withMessage('Each ingredient must have a quantity')
    .isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0')
    .custom((value) => {
      if (value > 100000) throw new Error('Quantity seems unrealistically large');
      return true;
    }),

  body('dietType')
    .optional()
    .isIn(VALID_DIET_TYPES).withMessage(`Diet type must be one of: ${VALID_DIET_TYPES.join(', ')}`),

  body('cuisine')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Cuisine name cannot exceed 50 characters'),

  body('allergens')
    .optional()
    .isArray().withMessage('Allergens must be an array'),

  body('allergens.*')
    .isIn(VALID_ALLERGENS).withMessage(`Each allergen must be one of: ${VALID_ALLERGENS.join(', ')}`),

  body('image')
    .optional()
    .trim()
    .isURL().withMessage('Image must be a valid URL'),
];

// --- Update Meal ---
// Same rules but everything is optional
exports.updateMealValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Meal name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('ingredients')
    .optional()
    .isArray({ min: 1 }).withMessage('If provided, ingredients must have at least one entry')
    .custom((ingredients) => {
      const ids = ingredients.map((i) => i.ingredient);
      const uniqueIds = new Set(ids);
      if (uniqueIds.size !== ids.length) {
        throw new Error('Duplicate ingredients are not allowed in the same meal');
      }
      return true;
    }),

  body('ingredients.*.ingredient')
    .optional()
    .isMongoId().withMessage('Invalid ingredient ID'),

  body('ingredients.*.quantity')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),

  body('dietType')
    .optional()
    .isIn(VALID_DIET_TYPES).withMessage(`Diet type must be one of: ${VALID_DIET_TYPES.join(', ')}`),

  body('cuisine')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Cuisine name cannot exceed 50 characters'),

  body('allergens')
    .optional()
    .isArray().withMessage('Allergens must be an array'),

  body('allergens.*')
    .isIn(VALID_ALLERGENS).withMessage(`Each allergen must be one of: ${VALID_ALLERGENS.join(', ')}`),

  body('image')
    .optional()
    .trim()
    .isURL().withMessage('Image must be a valid URL'),
];