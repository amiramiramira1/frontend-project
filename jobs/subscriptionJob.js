const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const Box = require('../models/Box');

const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

const processSubscriptions = async () => {
  console.log('🔄 Running subscription job at', new Date().toISOString());

  try {
    const now = new Date();

    // Find all active subscriptions where the next delivery date has arrived
    const dueSubscriptions = await Subscription.find({
      status: 'active',
      nextDeliveryDate: { $lte: now },
    }).populate('box');

    console.log(`📦 Found ${dueSubscriptions.length} subscription(s) to process`);

    for (const subscription of dueSubscriptions) {
      const box = subscription.box;
      if (!box) continue;

      const multiplier = SERVING_MULTIPLIERS[subscription.servingSize] || 1;
      const priceAtPurchase = parseFloat((box.basePrice * multiplier).toFixed(2));

      // Create a new order for this subscription
      await Order.create({
        user: subscription.user,
        items: [
          {
            box: box._id,
            servingSize: subscription.servingSize,
            quantity: 1,
            priceAtPurchase,
          },
        ],
        totalPrice: priceAtPurchase,
        orderType: 'subscription',
        subscription: subscription._id,
        status: 'confirmed',
      });

      // Calculate the next delivery date and update the subscription
      const nextDate = new Date(now);
      if (subscription.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      subscription.nextDeliveryDate = nextDate;
      await subscription.save();

      console.log(`✅ Order created for subscription ${subscription._id}`);
    }
  } catch (error) {
    console.error('❌ Subscription job error:', error.message);
  }
};

// Schedule: runs every day at midnight (00:00)
// Cron syntax: second(optional) minute hour day-of-month month day-of-week
// '0 0 * * *' means: at minute 0, hour 0, every day
const startSubscriptionJob = () => {
  cron.schedule('0 0 * * *', processSubscriptions);
  console.log('⏰ Subscription cron job scheduled (runs daily at midnight)');
};

module.exports = { startSubscriptionJob };