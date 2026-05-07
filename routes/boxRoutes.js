const express = require('express');
const router = express.Router();
const {
  getBoxes, getBox, createBox, createCustomBox, updateBox, deleteBox, calculateCustomBox
} = require('../controllers/boxController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const {
  createBoxValidator,
  updateBoxValidator,
  createCustomBoxValidator,
  calculateCustomBoxValidator,
} = require('../validators/boxValidator');

router.route('/')
  .get(getBoxes)
  .post(protect, adminOnly, createBoxValidator, validate, createBox);

router.post('/custom/calculate', protect, calculateCustomBoxValidator, validate, calculateCustomBox);
router.post('/custom', protect, createCustomBoxValidator, validate, createCustomBox);

router.route('/:id')
  .get(getBox)
  .put(protect, adminOnly, updateBoxValidator, validate, updateBox)
  .delete(protect, adminOnly, deleteBox);


module.exports = router;