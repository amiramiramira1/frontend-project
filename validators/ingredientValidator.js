const { body } = require('express-validator');

const VALID_UNITS = ['g', 'kg', 'ml', 'L', 'piece', 'tbsp', 'tsp'];

// --- Create Ingredient ---
exports.createIngredientValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ingredient name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'()]+$/).withMessage('Name contains invalid characters'),

  body('unit')
    .notEmpty().withMessage('Unit is required')
    .isIn(VALID_UNITS).withMessage(`Unit must be one of: ${VALID_UNITS.join(', ')}`),

  body('costPerUnit')
    .notEmpty().withMessage('Cost per unit is required')
    .isFloat({ min: 0.001 }).withMessage('Cost must be greater than 0')
    .custom((value) => {
      // Reject suspiciously high prices (likely a data entry mistake)
      if (value > 10000) throw new Error('Cost per unit seems unrealistically high');
      return true;
    }),

  body('caloriesPerUnit')
    .notEmpty().withMessage('Calories per unit is required')
    .isFloat({ min: 0 }).withMessage('Calories must be 0 or greater')
    .custom((value) => {
      if (value > 10000) throw new Error('Calories per unit seems unrealistically high');
      return true;
    }),
];

// --- Update Ingredient ---
// All fields are optional — admin may update just one field at a time
exports.updateIngredientValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'()]+$/).withMessage('Name contains invalid characters'),

  body('unit')
    .optional()
    .isIn(VALID_UNITS).withMessage(`Unit must be one of: ${VALID_UNITS.join(', ')}`),

  body('costPerUnit')
    .optional()
    .isFloat({ min: 0.001 }).withMessage('Cost must be greater than 0')
    .custom((value) => {
      if (value > 10000) throw new Error('Cost per unit seems unrealistically high');
      return true;
    }),

  body('caloriesPerUnit')
    .optional()
    .isFloat({ min: 0 }).withMessage('Calories must be 0 or greater')
    .custom((value) => {
      if (value > 10000) throw new Error('Calories per unit seems unrealistically high');
      return true;
    }),
];