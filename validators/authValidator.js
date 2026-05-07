const { body } = require('express-validator');

// Reusable rule: used in both register and profile update
const nameRule = body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
  .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes');

// Reusable rule: used in both register and login
const emailRule = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Please provide a valid email address')
  .normalizeEmail(); // Lowercases, removes dots in Gmail, etc.

// Reusable rule: used in register
const passwordRule = body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters')
  .matches(/\d/).withMessage('Password must contain at least one number')
  .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter');

// --- Register ---
// Full validation: name + email + password
exports.registerValidator = [
  nameRule,
  emailRule,
  passwordRule,
];

// --- Login ---
// Only email and password — no name needed
exports.loginValidator = [
  emailRule,
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// --- Update Profile ---
// All fields are optional since user may update only one thing at a time
exports.updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  // Validate each address in the array if provided
  body('addresses')
    .optional()
    .isArray().withMessage('Addresses must be an array'),

  body('addresses.*.street')
    .optional()
    .trim()
    .notEmpty().withMessage('Street cannot be empty')
    .isLength({ max: 100 }).withMessage('Street is too long'),

  body('addresses.*.city')
    .optional()
    .trim()
    .notEmpty().withMessage('City cannot be empty')
    .isLength({ max: 50 }).withMessage('City name is too long'),

  body('addresses.*.country')
    .optional()
    .trim()
    .notEmpty().withMessage('Country cannot be empty'),

  body('addresses.*.postalCode')
    .optional()
    .trim()
    .isPostalCode('any').withMessage('Please provide a valid postal code'),

  body('dietPreferences')
    .optional()
    .isArray().withMessage('Diet preferences must be an array'),

  body('dietPreferences.*')
    .isIn(['vegan', 'vegetarian', 'keto', 'paleo', 'standard'])
    .withMessage('Each diet preference must be one of: vegan, vegetarian, keto, paleo, standard'),
];

// --- Change Password ---
exports.changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6, max: 100 }).withMessage('New password must be between 6 and 100 characters')
    .matches(/\d/).withMessage('New password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('New password must contain at least one letter')
    .custom((value, { req }) => {
      // Custom rule: new password must be different from current password
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];