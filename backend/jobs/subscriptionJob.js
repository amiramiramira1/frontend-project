const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const Box = require('../models/Box');
const { decrementIngredientsForOrder } = require('../utils/inventoryHelper');

const SERVING_MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

// Maps deliveryDay string → JS Date.getDay() index (0 = Sunday)
const DAY_INDEX = {
  sunday:    0,
  monday:    1,
  tuesday:   2,
  wednesday: 3,
  thursday:  4,
  friday:    5,
  saturday:  6,
};

/**
 * Returns the next delivery Date that:
 *   - lands on the user's preferred weekday (deliveryDay)
 *   - is at least 7 days away (weekly) or in the next calendar month (monthly)
 *
 * @param {'weekly'|'monthly'} frequency
 * @param {string} deliveryDay  e.g. 'saturday'
 * @returns {Date}
 */
const getNextDeliveryDate = (frequency, deliveryDay = 'saturday') => {
  const targetDayIndex = DAY_INDEX[deliveryDay] ?? DAY_INDEX.saturday;
  const base = new Date();

  if (frequency === 'weekly') {
    // Start from at least 7 days out, then walk forward to the target weekday
    const earliest = new Date(base);
    earliest.setDate(earliest.getDate() + 7);

    const daysAhead = (targetDayIndex - earliest.getDay() + 7) % 7;
    earliest.setDate(earliest.getDate() + daysAhead);
    earliest.setHours(8, 0, 0, 0); // 08:00 delivery window
    return earliest;
  }

  // monthly: first occurrence of the target weekday in the next calendar month
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1, 1); // 1st of next month

  const daysAhead = (targetDayIndex - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + daysAhead);
  next.setHours(8, 0, 0, 0);
  return next;
};

const processSubscriptions = async () => {
  console.log('🔄 Running subscription job at', new Date().toISOString());

  try {
    // Match all active subscriptions due today or overdue
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dueSubscriptions = await Subscription.find({
      status: 'active',
      nextDeliveryDate: { $lte: endOfDay },
    }).populate('box');

    console.log(`📦 Found ${dueSubscriptions.length} subscription(s) to process`);

    for (const subscription of dueSubscriptions) {
      const box = subscription.box;
      if (!box) continue;

      const multiplier = SERVING_MULTIPLIERS[subscription.servingSize] || 1;
      const priceAtPurchase = parseFloat((box.basePrice * multiplier).toFixed(2));

      // Create the delivery order — carry the subscription's delivery details
      const order = await Order.create({
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
        deliveryAddress: subscription.deliveryAddress,
        phone: subscription.phone,
        deliveryDate: subscription.nextDeliveryDate,
      });

      // Decrement ingredient stocks proportionally
      await decrementIngredientsForOrder(order);

      // Advance to the next delivery, honouring the user's preferred day
      subscription.nextDeliveryDate = getNextDeliveryDate(
        subscription.frequency,
        subscription.deliveryDay,  // ← the key change: use the user's chosen weekday
      );
      await subscription.save();

      console.log(
        `✅ Order created for subscription ${subscription._id}` +
        ` | next: ${subscription.nextDeliveryDate.toDateString()}`,
      );
    }
  } catch (error) {
    console.error('❌ Subscription job error:', error.message);
  }
};

// Runs every day at 07:00 — processes today's deliveries before the 08:00 window
const startSubscriptionJob = () => {
  cron.schedule('0 7 * * *', processSubscriptions);
  console.log('⏰ Subscription cron job scheduled (runs daily at 07:00)');
};

module.exports = { startSubscriptionJob, getNextDeliveryDate };