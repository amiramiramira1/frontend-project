/**
 * tests/boxes.test.js
 * Integration + E2E tests for /api/boxes
 */
const request = require('supertest');
const app = require('../app');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

beforeAll(async () => {
  await connectDB();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

// ─── GET /api/boxes ───────────────────────────────────────────────────────────
describe('GET /api/boxes', () => {
  it('should return a list of active boxes (public route)', async () => {
    const res = await request(app).get('/api/boxes');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('boxes');
    expect(Array.isArray(res.body.boxes)).toBe(true);
  });

  it('should filter boxes by dietType query param', async () => {
    const res = await request(app).get('/api/boxes?dietType=standard');
    expect(res.statusCode).toBe(200);
    res.body.boxes.forEach((b) => expect(b.dietType).toBe('standard'));
  });

  it('should include computed priceForServing when servingSize is passed', async () => {
    const res = await request(app).get('/api/boxes?servingSize=2');
    expect(res.statusCode).toBe(200);
    if (res.body.boxes.length > 0) {
      expect(res.body.boxes[0]).toHaveProperty('priceForServing');
      expect(res.body.boxes[0].requestedServingSize).toBe(2);
    }
  });

  it('should paginate results when page and limit are provided', async () => {
    const res = await request(app).get('/api/boxes?page=1&limit=1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('boxes'); // using alias 'boxes' instead of 'docs' from paginate
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('totalPages');
    expect(res.body.pagination).toHaveProperty('page', 1);
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.boxes.length).toBeLessThanOrEqual(1);
  });

  it('should filter boxes by category', async () => {
    const res = await request(app).get('/api/boxes?category=pre-made');
    expect(res.statusCode).toBe(200);
    res.body.boxes.forEach((b) => expect(b.type).toBe('pre-made'));
  });

  it('should filter boxes by price range', async () => {
    const res = await request(app).get('/api/boxes?minPrice=1&maxPrice=10');
    expect(res.statusCode).toBe(200);
    res.body.boxes.forEach((b) => {
      expect(b.basePrice).toBeGreaterThanOrEqual(1);
      expect(b.basePrice).toBeLessThanOrEqual(10);
    });
  });

  it('should sort boxes by basePrice descending', async () => {
    // Add a second box to test sorting properly
    const resAdd = await request(app)
      .post('/api/boxes')
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({
        name: '__test__ Expensive Box',
        description: 'A more expensive box',
        type: 'pre-made',
        dietType: 'standard',
        basePrice: 50.0,
        meals: [state.mealId],
      });
      
    const res = await request(app).get('/api/boxes?sortBy=basePrice&sortOrder=desc');
    expect(res.statusCode).toBe(200);
    if (res.body.boxes.length >= 2) {
      expect(res.body.boxes[0].basePrice).toBeGreaterThanOrEqual(res.body.boxes[1].basePrice);
    }
  });
});

// ─── GET /api/boxes/:id ───────────────────────────────────────────────────────
describe('GET /api/boxes/:id', () => {
  it('should return a single box by ID', async () => {
    const res = await request(app).get(`/api/boxes/${state.boxId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.box._id).toBe(state.boxId);
  });

  it('should return 404 for a non-existent box ID', async () => {
    const res = await request(app).get('/api/boxes/000000000000000000000000');
    expect(res.statusCode).toBe(404);
  });
});

// ─── POST /api/boxes (Admin only) ────────────────────────────────────────────
describe('POST /api/boxes', () => {
  it('should allow admin to create a new box', async () => {
    const res = await request(app)
      .post('/api/boxes')
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({
        name: '__test__ New Box',
        description: 'A test box',
        type: 'pre-made',
        dietType: 'vegetarian',
        meals: [state.mealId],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.box.name).toBe('__test__ New Box');
    // Store for later cleanup
    state.createdBoxId = res.body.box._id;
  });

  it('should reject box creation by a non-admin customer', async () => {
    const res = await request(app)
      .post('/api/boxes')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ name: '__test__ Hack Box', meals: [] });
    expect(res.statusCode).toBe(403);
  });

  it('should reject box creation without a token', async () => {
    const res = await request(app)
      .post('/api/boxes')
      .send({ name: '__test__ No Auth Box', meals: [] });
    expect(res.statusCode).toBe(401);
  });
});

// ─── POST /api/boxes/custom/calculate (price preview) ────────────────────────
describe('POST /api/boxes/custom/calculate', () => {
  it('should return a price/calorie preview for selected meals', async () => {
    const res = await request(app)
      .post('/api/boxes/custom/calculate')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ mealIds: [state.mealId], servingSize: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.preview).toHaveProperty('totalCalories');
    expect(res.body.preview).toHaveProperty('priceForServingSize');
    expect(res.body.preview).toHaveProperty('allergens');
  });

  it('should reject with empty mealIds array', async () => {
    const res = await request(app)
      .post('/api/boxes/custom/calculate')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ mealIds: [], servingSize: 2 });
    expect(res.statusCode).toBe(400);
  });
});

// ─── POST /api/boxes/custom (saves a custom box)─────────────────────────────
describe('POST /api/boxes/custom', () => {
  it('should allow an authenticated user to create a custom box', async () => {
    const res = await request(app)
      .post('/api/boxes/custom')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ meals: [state.mealId], servingSize: 2 });
    expect(res.statusCode).toBe(201);
    expect(res.body.box.type).toBe('custom');
    expect(res.body).toHaveProperty('priceForServing');
  });

  it('should reject if no meals are provided', async () => {
    const res = await request(app)
      .post('/api/boxes/custom')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ meals: [], servingSize: 2 });
    expect(res.statusCode).toBe(400);
  });
});

// ─── PUT /api/boxes/:id (Admin only)──────────────────────────────────────────
describe('PUT /api/boxes/:id', () => {
  it('should allow admin to update a box description', async () => {
    const res = await request(app)
      .put(`/api/boxes/${state.boxId}`)
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ description: 'Updated description' });
    expect(res.statusCode).toBe(200);
    expect(res.body.box.description).toBe('Updated description');
  });

  it('should reject box update by non-admin', async () => {
    const res = await request(app)
      .put(`/api/boxes/${state.boxId}`)
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ description: 'Should fail' });
    expect(res.statusCode).toBe(403);
  });
});

// ─── DELETE /api/boxes/:id (Admin only, soft-delete) ─────────────────────────
describe('DELETE /api/boxes/:id', () => {
  it('should allow admin to soft-delete (deactivate) a box', async () => {
    const targetId = state.createdBoxId || state.boxId;
    const res = await request(app)
      .delete(`/api/boxes/${targetId}`)
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('should reject delete by a customer', async () => {
    const res = await request(app)
      .delete(`/api/boxes/${state.boxId}`)
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});
