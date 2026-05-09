const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// POST /api/upload
// Accepts: multipart/form-data with field name "image"
// Returns: { url: "https://res.cloudinary.com/..." }
// Access: Admin only
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }
  res.status(200).json({ url: req.file.path });
});

module.exports = router;
