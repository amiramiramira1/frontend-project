const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('../config/googleStrategy');
const { register, login, getMe, updateProfile, updateSettings, changePassword, deleteAccount, forgotPassword, resetPassword, verifyEmail, resendVerification } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  updateSettingsValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');


// ── Standard auth ──────────────────────────────────────────────────────────────
router.post("/register", registerValidator, validate, register);
router.post("/login",    loginValidator,    validate, login);
router.get("/me",        protect, getMe);
router.put('/profile',   protect, updateProfileValidator, validate, updateProfile);
router.put('/settings',  protect, updateSettingsValidator, validate, updateSettings);
router.put('/change-password', protect, changePasswordValidator, validate, changePassword);
router.delete('/me',     protect, deleteAccount);

// ── Password Reset ─────────────────────────────────────────────────────────────
router.post('/forgot-password',     forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password',      resetPasswordValidator,  validate, resetPassword);

// ── Email Verification ─────────────────────────────────────────────────────────
router.get('/verify-email',          verifyEmail);         // Browser navigates here from email link
router.post('/resend-verification',  resendVerification);

// ── Google OAuth ───────────────────────────────────────────────────
// Step 1: Redirect browser to Google consent screen
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects here after user approves
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Passport attached the user to req.user via the strategy
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    const userPayload = encodeURIComponent(JSON.stringify({
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    }));

    // Redirect to the frontend callback page with JWT + user info as query params
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/google/success?token=${token}&user=${userPayload}`);
  }
);

module.exports = router;



