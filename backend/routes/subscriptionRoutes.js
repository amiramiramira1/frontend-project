const express = require('express');
const router = express.Router();
const {
  createSubscription, getMySubscriptions, pauseSubscription,
  cancelSubscription, getAllSubscriptions, updateSubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { createSubscriptionValidator } = require('../validators/subscriptionValidator');
  

router.post('/', protect, createSubscriptionValidator, validate, createSubscription);
router.get('/my', protect, getMySubscriptions);
router.put('/:id/pause', protect, pauseSubscription);
router.put('/:id/cancel', protect, cancelSubscription);
router.get('/', protect, adminOnly, getAllSubscriptions);
router.patch('/:id', protect, updateSubscription);

module.exports = router;