/* eslint-disable no-unused-vars */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for the token in the Authorization header
  // Format: "Bearer eyJhbGci..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Get just the token part
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Verify the token — this throws an error if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request object so controllers can access it
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = user;

    next(); // Everything is fine, move on to the controller
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Same as protect, but doesn't reject if no token is present.
// Sets req.user if a valid token exists, otherwise leaves it null.
// Used for endpoints that behave differently for logged-in users (e.g. personalized sorting).
const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(); // No token — proceed as guest

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch {
    // Invalid token — proceed as guest silently
  }
  next();
};

module.exports = { protect, optionalProtect };