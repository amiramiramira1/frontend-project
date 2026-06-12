const express = require('express');
const router = express.Router();
const { validatePromo, listPromos, createPromo, togglePromo, deletePromo } = require('../controllers/promoController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Customer-facing: validate a promo code at checkout
router.post('/validate', protect, validatePromo);

// Admin: full CRUD
router.get('/',            protect, adminOnly, listPromos);
router.post('/',           protect, adminOnly, createPromo);
router.patch('/:id/toggle', protect, adminOnly, togglePromo);
router.delete('/:id',     protect, adminOnly, deletePromo);

module.exports = router;
