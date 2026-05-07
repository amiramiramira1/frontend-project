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
    req.user = await User.findById(decoded.id);

    next(); // Everything is fine, move on to the controller
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };