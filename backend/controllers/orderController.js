const Order = require('../models/Order');
const Box = require('../models/Box');
const User = require('../models/User');
const paginate = require('../utils/paginate');
const emailService = require('../services/emailService');

const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };


// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const result = await paginate(
      Order,
      filter,
      { page: req.query.page, limit: req.query.limit, sort: req.query.sort }
    );

    await Order.populate(result.data, [
      { path: 'items.box', select: 'name image' },
    ]);

    res.status(200).json({
      orders: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.box');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Customers can only see their own orders; admins can see all
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/orders  (Admin sees all orders)
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.orderType) filter.orderType = req.query.orderType;
    if (req.query.userId) filter.user = req.query.userId;

    const result = await paginate(
      Order,
      filter,
      { page: req.query.page, limit: req.query.limit, sort: req.query.sort }
    );

    // Manually populate after paginate since we need multiple fields
    await Order.populate(result.data, [
      { path: 'user', select: 'name email' },
      { path: 'items.box', select: 'name' },
    ]);

    res.status(200).json({
      orders: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Fire-and-forget lifecycle email — never blocks the response
    User.findById(order.user).then((user) => {
      if (user) {
        emailService.sendOrderStatusEmail(order, user)
          .catch((err) => console.error('📧 Status email failed:', err.message));
      }
    }).catch(() => {});

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getMyOrders, getOrderById, getAllOrders, updateOrderStatus };