/**
 * tests/cart.test.js
 * Integration + E2E tests for /api/cart (full checkout lifecycle)
 */
const request = require('supertest');
const app = require('../app');
const Cart = require('../models/Cart');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

beforeAll(async () => {
  await connectDB();
  await seedTestData();
  // Wipe any stale cart for this customer before tests
  await Cart.deleteMany({ user: state.customerId });
});

afterAll(async () => {
  await teardownTestData();
});

let cartItemId; // shared between update/delete tests

// ─── GET /api/cart ────────────────────────────────────────────────────────────
describe('GET /api/cart', () => {
  it('should create and return an empty cart for a new user', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.cart).toHaveProperty('items');
    expect(res.body.cart.items).toHaveLength(0);
    expect(res.body.cart.cartTotal).toBe(0);
  });

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.statusCode).toBe(401);
  });
});

// ─── POST /api/cart/items ─────────────────────────────────────────────────────
describe('POST /api/cart/items', () => {
  it('should add a valid box to the cart', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: state.boxId, servingSize: 2, quantity: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.cartTotal).toBeGreaterThan(0);
    cartItemId = res.body.cart.items[0]._id;
  });

  it('should accumulate quantity if same box+servingSize is added again', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: state.boxId, servingSize: 2, quantity: 1 });
    expect(res.statusCode).toBe(200);
    // Should still be 1 item, but quantity increases to 2
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].quantity).toBe(2);
  });

  it('should reject adding a non-existent box', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: '000000000000000000000000', servingSize: 2 });
    expect(res.statusCode).toBe(404);
  });

  it('should reject unauthenticated add', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .send({ boxId: state.boxId, servingSize: 2 });
    expect(res.statusCode).toBe(401);
  });
});

// ─── PUT /api/cart/items/:itemId ─────────────────────────────────────────────
describe('PUT /api/cart/items/:itemId', () => {
  it('should update the quantity of a cart item', async () => {
    const res = await request(app)
      .put(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ quantity: 3 });
    expect(res.statusCode).toBe(200);
    const updated = res.body.cart.items.find((i) => i._id === cartItemId);
    expect(updated.quantity).toBe(3);
  });

  it('should remove item when quantity is set to 0', async () => {
    const res = await request(app)
      .put(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ quantity: 0 });
    expect(res.statusCode).toBe(200);
    const found = res.body.cart.items.find((i) => i._id === cartItemId);
    expect(found).toBeUndefined();
  });
});

// ─── POST /api/cart/items (re-add for checkout test) ─────────────────────────
describe('Cart checkout flow (E2E)', () => {
  let checkoutCartItemId;

  beforeAll(async () => {
    // Add item back so we can test checkout
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: state.boxId, servingSize: 2, quantity: 1 });
    checkoutCartItemId = res.body.cart.items[0]?._id;
  });

  it('should complete checkout, create an order, and clear the cart', async () => {
    const res = await request(app)
      .post('/api/cart/checkout')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({
        deliveryAddress: {
          street: '5 Test Street',
          city: 'Cairo',
          country: 'Egypt',
          postalCode: '11511',
        },
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('order');
    expect(res.body.order.orderType).toBe('one-time');
    expect(res.body.order.totalPrice).toBeGreaterThan(0);

    // Cart should now be empty
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(cartRes.body.cart.items).toHaveLength(0);
    expect(cartRes.body.cart.cartTotal).toBe(0);
  });

  it('should reject checkout when cart is empty', async () => {
    const res = await request(app)
      .post('/api/cart/checkout')
      .set('Authorization', `Bearer ${state.customerToken}`)
      // Full valid address so validator passes — controller then rejects for empty cart
      .send({ deliveryAddress: { street: '5 Test St', city: 'Cairo', country: 'Egypt' } });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/empty/i);
  });
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
describe('DELETE /api/cart', () => {
  it('should clear all items from the cart', async () => {
    // Add an item first
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: state.boxId, servingSize: 2, quantity: 2 });

    const res = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
  });
});
