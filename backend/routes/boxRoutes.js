const express = require('express');
const router = express.Router();
const {
  getBoxes, getBox, createBox, createCustomBox, updateBox, deleteBox, calculateCustomBox, getRecommendedBoxes, addReview, deleteReview
} = require('../controllers/boxController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
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
router.get('/recommended', optionalProtect, getRecommendedBoxes);

router.route('/:id')
  .get(getBox)
  .put(protect, adminOnly, updateBoxValidator, validate, updateBox)
  .delete(protect, adminOnly, deleteBox);

router.post('/:id/reviews', protect, addReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

module.exports = router;