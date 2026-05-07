const adminOnly = (req, res, next) => {
  // This middleware must always run AFTER 'protect', because it relies on req.user
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, allow through
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = { adminOnly };