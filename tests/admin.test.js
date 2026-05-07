/**
 * tests/admin.test.js
 * Integration + E2E tests for /api/admin
 */
const request = require('supertest');
const app = require('../app');
const Subscription = require('../models/Subscription');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

let activeSub;

beforeAll(async () => {
  await connectDB();
  await seedTestData();

  // Ensure a fresh active subscription exists for the admin tests
  await Subscription.deleteMany({ user: state.customerId });
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 3); // within 7 days for upcoming test
  activeSub = await Subscription.create({
    user: state.customerId,
    box: state.boxId,
    servingSize: 2,
    frequency: 'weekly',
    status: 'active',
    nextDeliveryDate: nextWeek,
    mealRotation: [state.mealId],
  });
  state.subId = activeSub._id.toString();
});

afterAll(async () => {
  await Subscription.deleteMany({ user: state.customerId });
  await teardownTestData();
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
describe('GET /api/admin/stats', () => {
  it('should return dashboard stats for admin', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toHaveProperty('totalUsers');
    expect(res.body.stats).toHaveProperty('totalBoxes');
    expect(res.body.stats).toHaveProperty('totalOrders');
    expect(res.body.stats).toHaveProperty('totalRevenue');
    expect(res.body.stats).toHaveProperty('ordersByStatus');
    expect(typeof res.body.stats.totalRevenue).toBe('number');
  });

  it('should reject non-admin access', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/admin/subscriptions/stats ──────────────────────────────────────
describe('GET /api/admin/subscriptions/stats', () => {
  it('should return subscription counts by status', async () => {
    const res = await request(app)
      .get('/api/admin/subscriptions/stats')
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.subscriptionStats).toHaveProperty('active');
    expect(res.body.subscriptionStats).toHaveProperty('paused');
    expect(res.body.subscriptionStats).toHaveProperty('cancelled');
    expect(res.body.subscriptionStats).toHaveProperty('total');
    expect(res.body.subscriptionStats.active).toBeGreaterThan(0);
  });

  it('should reject customer access', async () => {
    const res = await request(app)
      .get('/api/admin/subscriptions/stats')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─── GET /api/admin/subscriptions/upcoming ───────────────────────────────────
describe('GET /api/admin/subscriptions/upcoming', () => {
  it('should return subscriptions due within 7 days', async () => {
    const res = await request(app)
      .get('/api/admin/subscriptions/upcoming')
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('upcomingDeliveries');
    expect(Array.isArray(res.body.upcomingDeliveries)).toBe(true);
    // Our seeded sub is 3 days away so it must appear
    expect(res.body.count).toBeGreaterThan(0);
    // Check populate worked
    expect(res.body.upcomingDeliveries[0].user).toHaveProperty('name');
  });

  it('should reject non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/subscriptions/upcoming')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─── POST /api/admin/subscriptions/generate ──────────────────────────────────
describe('POST /api/admin/subscriptions/generate', () => {
  it('should manually generate an order for an active subscription', async () => {
    const res = await request(app)
      .post('/api/admin/subscriptions/generate')
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ subscriptionId: state.subId });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('order');
    expect(res.body.order.orderType).toBe('subscription');
    expect(res.body).toHaveProperty('nextDeliveryDate');
  });

  it('should reject generating for a non-existent subscription ID', async () => {
    const res = await request(app)
      .post('/api/admin/subscriptions/generate')
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ subscriptionId: '000000000000000000000000' });
    expect(res.statusCode).toBe(404);
  });

  it('should reject generating for a cancelled subscription', async () => {
    // Cancel it first
    await Subscription.findByIdAndUpdate(state.subId, { status: 'cancelled' });
    const res = await request(app)
      .post('/api/admin/subscriptions/generate')
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ subscriptionId: state.subId });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/active/i);
  });

  it('should reject non-admin access', async () => {
    const res = await request(app)
      .post('/api/admin/subscriptions/generate')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ subscriptionId: state.subId });
    expect(res.statusCode).toBe(403);
  });
});
