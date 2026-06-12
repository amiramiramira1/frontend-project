const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper: generate a signed JWT token for a given user ID
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Helper: build the safe user payload sent to the frontend
const userPayload = (user) => ({
  id:              user._id,
  name:            user.name,
  email:           user.email,
  role:            user.role,
  addresses:       user.addresses,
  dietPreferences: user.dietPreferences,
  allergens:       user.allergens,
  settings:        user.settings,
  favorites:       user.favorites || [],
  isEmailVerified: user.isEmailVerified,
});

// Helper: generate a secure random token, return [rawToken, hashedToken]
const generateSecureToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return [raw, hash];
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate email verification token
    const [rawToken, hashedToken] = generateSecureToken();

    // Create the user — password is auto-hashed by the pre-save hook in the model
    const user = await User.create({
      name,
      email,
      password,
      emailVerifyToken:   hashedToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Fire-and-forget combined welcome + verification email
    const emailService = require('../services/emailService');
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${rawToken}`;
    emailService.sendWelcomeVerificationEmail(user, verifyUrl).catch((err) =>
      console.error('📧 Welcome/verify email failed:', err.message)
    );

    res.status(201).json({
      message: 'User registered successfully',
      token: generateToken(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email — explicitly include the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the submitted password to the stored hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/auth/me
// @access  Private (requires token)
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ user: userPayload(user) });
};

// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, addresses, dietPreferences, allergens } = req.body;

    // Only allow updating specific safe fields — never role or password here
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, addresses, dietPreferences, allergens },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userPayload(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/auth/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const { emailNotifications, language, defaultServings } = req.body;

    // Build update object — only include fields that were actually sent
    const settingsUpdate = {};
    if (emailNotifications !== undefined) settingsUpdate['settings.emailNotifications'] = emailNotifications;
    if (language            !== undefined) settingsUpdate['settings.language']           = language;
    if (defaultServings     !== undefined) settingsUpdate['settings.defaultServings']    = defaultServings;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: settingsUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Settings updated successfully',
      user: userPayload(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Fetch user with password (it's hidden by default due to select: false)
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Set new password — the pre-save hook in the User model will hash it automatically
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/auth/me
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT / RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/auth/forgot-password
// @access  Public
// Always returns 200 — never reveals whether the email exists (prevents enumeration)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Respond identically whether user exists or not
    if (!user) {
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate reset token
    const [rawToken, hashedToken] = generateSecureToken();

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Fire-and-forget password reset email
    const emailService = require('../services/emailService');
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
    emailService.sendPasswordResetEmail(user, resetUrl).catch((err) =>
      console.error('📧 Password reset email failed:', err.message)
    );

    res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    // Hash the raw token and compare to what we stored
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    // Set new password and clear the reset token fields
    user.password             = password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Your password has been reset successfully. You can now sign in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/auth/verify-email?token=<raw>
// @access  Public (navigated to directly from email link)
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      // Redirect to frontend with error flag
      return res.redirect(`${FRONTEND_URL}/verify-email?error=missing`);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerifyToken:   hashedToken,
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/verify-email?error=invalid`);
    }

    // Mark email as verified and clear the token
    user.isEmailVerified  = true;
    user.emailVerifyToken   = undefined;
    user.emailVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Redirect to login with verified=true flag so the page shows a success banner
    res.redirect(`${FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    res.redirect(`${FRONTEND_URL}/verify-email?error=server`);
  }
};

// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });

    // Always respond the same way to prevent enumeration
    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        message: 'If your email is registered and unverified, a new verification link has been sent.',
      });
    }

    // Generate a fresh verification token
    const [rawToken, hashedToken] = generateSecureToken();

    user.emailVerifyToken   = hashedToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save({ validateBeforeSave: false });

    const emailService = require('../services/emailService');
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${rawToken}`;
    emailService.sendWelcomeVerificationEmail(user, verifyUrl).catch((err) =>
      console.error('📧 Resend verification email failed:', err.message)
    );

    res.status(200).json({
      message: 'If your email is registered and unverified, a new verification link has been sent.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateSettings,
  changePassword,
  deleteAccount,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
