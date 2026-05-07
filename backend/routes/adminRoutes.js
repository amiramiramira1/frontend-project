const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSubscriptionStats,
  getUpcomingDeliveries,
  manuallyGenerateSubscriptionOrder,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { generateSubscriptionOrderValidator } = require('../validators/subscriptionValidator');


// All admin routes require login + admin role
router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/subscriptions/stats', getSubscriptionStats);
router.get('/subscriptions/upcoming', getUpcomingDeliveries);
router.post('/subscriptions/generate', generateSubscriptionOrderValidator, validate, manuallyGenerateSubscriptionOrder);

module.exports = router;