// Load environment variables FIRST — before anything else
require('dotenv').config();

console.log('[boot] GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
console.log('[boot] GOOGLE_CLIENT_ID set:', !!process.env.GOOGLE_CLIENT_ID);
console.log('[boot] FRONTEND_URL:', process.env.FRONTEND_URL);

const app = require('./app');
const connectDB = require('./config/db');
const { startSubscriptionJob } = require('./jobs/subscriptionJob');

// --- Connect to MongoDB ---
connectDB();

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startSubscriptionJob(); // Start the cron job
});