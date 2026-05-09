/**
 * app.js
 * Exports the configured Express app WITHOUT starting the HTTP listener.
 * This allows Supertest to import and test all routes without binding a port.
 * server.js imports this file and calls app.listen() separately.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// --- Import Routes ---
const authRoutes         = require('./routes/authRoutes');
const ingredientRoutes   = require('./routes/ingredientRoutes');
const mealRoutes         = require('./routes/mealRoutes');
const boxRoutes          = require('./routes/boxRoutes');
const orderRoutes        = require('./routes/orderRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const cartRoutes         = require('./routes/cartRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const uploadRoutes       = require('./routes/uploadRoutes');

// --- Create Express App ---
const app = express();

// --- Global Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api/auth',          authRoutes);
app.use('/api/ingredients',   ingredientRoutes);
app.use('/api/meals',         mealRoutes);
app.use('/api/boxes',         boxRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/cart',          cartRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/upload',        uploadRoutes);   // Dedicated image upload endpoint

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.json({ message: '🍱 Boxify API is running' });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
