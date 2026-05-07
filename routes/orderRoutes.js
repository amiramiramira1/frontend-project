const express = require('express');
const router = express.Router();
const {
  getMyOrders, getOrderById, getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { updateOrderStatusValidator } = require('../validators/orderValidator');


router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatusValidator, validate, updateOrderStatus);

module.exports = router;