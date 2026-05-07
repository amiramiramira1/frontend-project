/**
 * tests/setup.js
 * Global test setup: connect to DB, seed test users & data, expose shared state.
 * Runs once before all test suites (configured via jest globalSetup / beforeAll).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const Ingredient = require('../models/Ingredient');
const Meal = require('../models/Meal');
const Box = require('../models/Box');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

let mongoServer;

// ─── Shared state exposed to all test files ───────────────────────────────────
const state = {
  adminToken: null,
  customerToken: null,
  adminId: null,
  customerId: null,
  boxId: null,
  mealId: null,
  subId: null,
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
};

const seedTestData = async () => {
  // Wipe test-owned data by email prefix (__test__)
  await User.deleteMany({ email: /^__test__/ });
  await Ingredient.deleteMany({ name: /^__test__/ });
  await Meal.deleteMany({ name: /^__test__/ });
  await Box.deleteMany({ name: /^__test__/ });

  // --- Users ---
  const [admin, customer] = await User.insertMany([
    {
      name: '__test__ Admin',
      email: '__test__admin@boxify.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
    {
      name: '__test__ Customer',
      email: '__test__customer@boxify.com',
      password: await bcrypt.hash('customer123', 10),
      role: 'customer',
    },
  ]);

  const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  state.adminToken = sign(admin._id);
  state.customerToken = sign(customer._id);
  state.adminId = admin._id.toString();
  state.customerId = customer._id.toString();

  // --- Ingredient ---
  const [ing] = await Ingredient.insertMany([
    { name: '__test__ Chicken', unit: 'g', costPerUnit: 0.015, caloriesPerUnit: 1.65 },
  ]);

  // --- Meal ---
  const [meal] = await Meal.insertMany([
    {
      name: '__test__ Grilled Chicken',
      description: 'Test meal',
      ingredients: [{ ingredient: ing._id, quantity: 200 }],
      dietType: 'standard',
      cuisine: 'American',
      allergens: [],
      pricePerServing: 3.0,
      caloriesPerServing: 330,
    },
  ]);
  state.mealId = meal._id.toString();

  // --- Box ---
  const [box] = await Box.insertMany([
    {
      name: '__test__ Classic Box',
      description: 'Test box',
      type: 'pre-made',
      dietType: 'standard',
      meals: [meal._id],
      basePrice: 3.0,
      isActive: true,
    },
  ]);
  state.boxId = box._id.toString();
};

const teardownTestData = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { state, connectDB, seedTestData, teardownTestData };
