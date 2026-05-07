/**
 * tests/orders.test.js
 * Integration + E2E tests for /api/orders
 */
const request = require('supertest');
const app = require('../app');
const Order = require('../models/Order');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

let orderId; // shared between tests

beforeAll(async () => {
  await connectDB();
  await seedTestData();

  // Directly create a test order in DB so we can test GET/PUT without relying on cart
  const order = await Order.create({
    user: state.customerId,
    items: [{ box: state.boxId, servingSize: 2, quantity: 1, priceAtPurchase: 5.4 }],
    totalPrice: 5.4,
    deliveryAddress: { street: '10 Test St', city: 'Cairo', country: 'Egypt' },
    orderType: 'one-time',
  });
  orderId = order._id.toString();
  state.testOrderId = orderId;
});

afterAll(async () => {
  await Order.deleteMany({ user: state.customerId });
  await teardownTestData();
});

// ─── GET /api/orders/my ───────────────────────────────────────────────────────
describe('GET /api/orders/my', () => {
  it('should return the customer\'s own orders', async () => {
    const res = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('orders');
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/orders/my');
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
describe('GET /api/orders/:id', () => {
  it('should return a specific order by ID for the owning customer', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.order._id).toBe(orderId);
  });

  it('should return 404 for a non-existent order ID', async () => {
    const res = await request(app)
      .get('/api/orders/000000000000000000000000')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should allow admin to view any order', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// ─── GET /api/orders (Admin only) ────────────────────────────────────────────
describe('GET /api/orders (admin)', () => {
  it('should return all orders for admin', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('should filter orders by status query param', async () => {
    const res = await request(app)
      .get('/api/orders?status=pending')
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
    res.body.orders.forEach((o) => expect(o.status).toBe('pending'));
  });

  it('should reject non-admin access to all orders list', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─── PUT /api/orders/:id/status (Admin only) ─────────────────────────────────
describe('PUT /api/orders/:id/status', () => {
  it('should allow admin to update order status to confirmed', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ status: 'confirmed' });
    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('confirmed');
  });

  it('should reject an invalid status value', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ status: 'exploded' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject status update by non-admin', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ status: 'delivered' });
    expect(res.statusCode).toBe(403);
  });
});
