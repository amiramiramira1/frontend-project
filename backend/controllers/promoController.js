const PromoCode = require('../models/PromoCode');

// @route   POST /api/promo/validate
// @access  Private
const validatePromo = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Promo code is required' });

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo || !promo.isActive) {
      return res.status(400).json({ valid: false, message: 'Invalid promo code' });
    }

    // Check expiry
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ valid: false, message: 'This promo code has expired' });
    }

    // Check usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ valid: false, message: 'This promo code has reached its usage limit' });
    }

    res.status(200).json({
      valid: true,
      code: promo.code,
      discount: promo.discount,
      label: promo.label,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/promo
// @access  Private/Admin
const listPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.status(200).json({ promos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/promo
// @access  Private/Admin
const createPromo = async (req, res) => {
  try {
    const { code, discount, label, usageLimit, expiresAt } = req.body;

    const existing = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'A promo code with this code already exists' });
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      discount,
      label,
      usageLimit: usageLimit || null,
      expiresAt: expiresAt || null,
    });

    res.status(201).json({ message: 'Promo code created', promo });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   PATCH /api/promo/:id/toggle
// @access  Private/Admin
const togglePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo code not found' });

    promo.isActive = !promo.isActive;
    await promo.save();

    res.status(200).json({ message: `Promo code ${promo.isActive ? 'activated' : 'deactivated'}`, promo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/promo/:id
// @access  Private/Admin
const deletePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo code not found' });

    res.status(200).json({ message: 'Promo code deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { validatePromo, listPromos, createPromo, togglePromo, deletePromo };
