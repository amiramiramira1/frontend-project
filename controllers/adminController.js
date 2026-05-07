const User = require('../models/User');
const Order = require('../models/Order');
const Box = require('../models/Box');
const Meal = require('../models/Meal');
const Subscription = require('../models/Subscription');

// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Run all count queries in parallel for speed
    const [
      totalUsers,
      totalBoxes,
      totalMeals,
      allOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Box.countDocuments({ isActive: true }),
      Meal.countDocuments(),
      Order.find(),
    ]);

    // Calculate total revenue from all delivered orders
    const totalRevenue = allOrders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Count orders grouped by status
    const ordersByStatus = allOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      stats: {
        totalUsers,
        totalBoxes,
        totalMeals,
        totalOrders: allOrders.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        ordersByStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/subscriptions/stats
// @access  Private/Admin
const getSubscriptionStats = async (req, res) => {
  try {
    const [active, paused, cancelled] = await Promise.all([
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'paused' }),
      Subscription.countDocuments({ status: 'cancelled' }),
    ]);

    res.status(200).json({
      subscriptionStats: {
        active,
        paused,
        cancelled,
        total: active + paused + cancelled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/subscriptions/upcoming
// @access  Private/Admin
// Returns all active subscriptions with a delivery due in the next 7 days
const getUpcomingDeliveries = async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    const upcoming = await Subscription.find({
      status: 'active',
      nextDeliveryDate: { $gte: now, $lte: in7Days },
    })
      .populate('user', 'name email')
      .populate('box', 'name')
      .sort({ nextDeliveryDate: 1 }); // Soonest first

    res.status(200).json({
      count: upcoming.length,
      upcomingDeliveries: upcoming,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/admin/subscriptions/generate
// @access  Private/Admin
// Manually force-generate an order for a specific subscription
// Useful if the cron job missed a delivery
const manuallyGenerateSubscriptionOrder = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await Subscription.findById(subscriptionId).populate('box');
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (subscription.status !== 'active') {
      return res.status(400).json({ message: 'Can only generate orders for active subscriptions' });
    }

    const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };
    const multiplier = SERVING_MULTIPLIERS[subscription.servingSize] || 1;
    const priceAtPurchase = parseFloat((subscription.box.basePrice * multiplier).toFixed(2));

    const order = await Order.create({
      user: subscription.user,
      items: [{
        box: subscription.box._id,
        servingSize: subscription.servingSize,
        quantity: 1,
        priceAtPurchase,
      }],
      totalPrice: priceAtPurchase,
      orderType: 'subscription',
      subscription: subscription._id,
      status: 'confirmed',
    });

    // Update next delivery date
    const nextDate = new Date();
    if (subscription.frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    subscription.nextDeliveryDate = nextDate;
    await subscription.save();

    res.status(201).json({
      message: 'Subscription order manually generated',
      order,
      nextDeliveryDate: subscription.nextDeliveryDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSubscriptionStats,
  getUpcomingDeliveries,
  manuallyGenerateSubscriptionOrder,
};