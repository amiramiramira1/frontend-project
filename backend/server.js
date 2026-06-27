// Load environment variables FIRST — before anything else
require('dotenv').config();

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