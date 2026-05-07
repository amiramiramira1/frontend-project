const Subscription = require('../models/Subscription');
const Box = require('../models/Box');
const paginate = require('../utils/paginate');


const getNextDeliveryDate = (frequency) => {
  const now = new Date();
  if (frequency === 'weekly') {
    now.setDate(now.getDate() + 7);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
};

// @route   POST /api/subscriptions
// @access  Private
const createSubscription = async (req, res) => {
  try {
    const { boxId, servingSize, frequency } = req.body;
    
    const box = await Box.findById(boxId).populate('meals');
    if (!box) return res.status(404).json({ message: 'Box not found' });

    // Check if user already has an active subscription for this box
    const existing = await Subscription.findOne({
      user: req.user.id,
      box: boxId,
      status: 'active',
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have an active subscription for this box' });
    }

    const subscription = await Subscription.create({
      user: req.user.id,
      box: boxId,
      servingSize,
      frequency,
      nextDeliveryDate: getNextDeliveryDate(frequency),
      mealRotation: box.meals.map((m) => m._id),
    });

    res.status(201).json({ message: 'Subscription created', subscription });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/subscriptions/my
// @access  Private
const getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('box', 'name image basePrice')
      .sort({ createdAt: -1 });
    res.status(200).json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/subscriptions/:id/pause
// @access  Private
const pauseSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot pause a cancelled subscription' });
    }

    subscription.status = subscription.status === 'active' ? 'paused' : 'active';
    await subscription.save();

    res.status(200).json({
      message: `Subscription ${subscription.status}`,
      subscription,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   PUT /api/subscriptions/:id/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    res.status(200).json({ message: 'Subscription cancelled', subscription });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/subscriptions  (Admin sees all)
// @access  Private/Admin
const getAllSubscriptions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.frequency) filter.frequency = req.query.frequency;
    if (req.query.userId) filter.user = req.query.userId;

    const result = await paginate(
      Subscription,
      filter,
      { page: req.query.page, limit: req.query.limit, sort: req.query.sort }
    );

    await Subscription.populate(result.data, [
      { path: 'user', select: 'name email' },
      { path: 'box', select: 'name basePrice' },
    ]);

    res.status(200).json({
      subscriptions: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createSubscription,
  getMySubscriptions,
  pauseSubscription,
  cancelSubscription,
  getAllSubscriptions,
};