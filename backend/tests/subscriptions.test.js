/**
 * tests/subscriptions.test.js
 * Integration + E2E tests for /api/subscriptions
 */
const request = require('supertest');
const app = require('../app');
const Subscription = require('../models/Subscription');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

let subId;

beforeAll(async () => {
  await connectDB();
  await seedTestData();
  // Clean previous test subs for this user
  await Subscription.deleteMany({ user: state.customerId });
});

afterAll(async () => {
  await Subscription.deleteMany({ user: state.customerId });
  await teardownTestData();
});

// ─── POST /api/subscriptions ──────────────────────────────────────────────────
describe('POST /api/subscriptions', () => {
  const deliveryDetails = {
    deliveryDay: 'monday',
    deliveryAddress: { street: '12 Tahrir St', city: 'Cairo', country: 'Egypt' },
    phone: '+201000000000',
  };

  it('should create a new subscription for the customer', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({
        boxId: state.boxId,
        servingSize: 2,
        frequency: 'weekly',
        ...deliveryDetails,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.subscription).toHaveProperty('_id');
    expect(res.body.subscription.status).toBe('active');
    expect(res.body.subscription).toHaveProperty('nextDeliveryDate');
    expect(res.body.subscription.deliveryAddress.city).toBe('Cairo');
    expect(res.body.subscription.deliveryDay).toBe('monday');
    subId = res.body.subscription._id;
    state.subId = subId;
  });

  it('should reject a subscription with no delivery address', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: state.boxId, servingSize: 2, frequency: 'weekly', deliveryDay: 'monday' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject duplicate subscription for the same box', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: state.boxId, servingSize: 2, frequency: 'weekly', ...deliveryDetails });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already have an active subscription/i);
  });

  it('should reject subscription creation for a non-existent box', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: '000000000000000000000000', servingSize: 2, frequency: 'weekly', ...deliveryDetails });
    expect(res.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .send({ boxId: state.boxId, servingSize: 2, frequency: 'weekly', ...deliveryDetails });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/subscriptions/my ────────────────────────────────────────────────
describe('GET /api/subscriptions/my', () => {
  it('should return the customer\'s subscriptions', async () => {
    const res = await request(app)
      .get('/api/subscriptions/my')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.subscriptions)).toBe(true);
    expect(res.body.subscriptions.length).toBeGreaterThan(0);
    // Ensure box is populated
    expect(res.body.subscriptions[0].box).toHaveProperty('name');
  });

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/subscriptions/my');
    expect(res.statusCode).toBe(401);
  });
});

// ─── PUT /api/subscriptions/:id/pause ────────────────────────────────────────
describe('PUT /api/subscriptions/:id/pause (toggle)', () => {
  it('should pause an active subscription', async () => {
    const res = await request(app)
      .put(`/api/subscriptions/${subId}/pause`)
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.subscription.status).toBe('paused');
  });

  it('should resume a paused subscription (toggle back to active)', async () => {
    const res = await request(app)
      .put(`/api/subscriptions/${subId}/pause`)
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.subscription.status).toBe('active');
  });

  it('should reject pausing another user\'s subscription', async () => {
    // Admin token is a different user
    const res = await request(app)
      .put(`/api/subscriptions/${subId}/pause`)
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(404); // findOne check scopes to req.user
  });
});

// ─── PUT /api/subscriptions/:id/cancel ───────────────────────────────────────
describe('PUT /api/subscriptions/:id/cancel', () => {
  it('should cancel an active subscription', async () => {
    const res = await request(app)
      .put(`/api/subscriptions/${subId}/cancel`)
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.subscription.status).toBe('cancelled');
  });

  it('should reject cancelling a subscription that belongs to another user', async () => {
    const res = await request(app)
      .put(`/api/subscriptions/${subId}/cancel`)
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});

// ─── GET /api/subscriptions (Admin only) ─────────────────────────────────────
describe('GET /api/subscriptions (admin)', () => {
  it('should return all subscriptions for admin', async () => {
    const res = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.subscriptions)).toBe(true);
  });

  it('should reject non-admin access', async () => {
    const res = await request(app)
      .get('/api/subscriptions')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});
