/**
 * tests/auth.test.js
 * Integration + E2E tests for /api/auth
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

// ─── POST /api/auth/register ──────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('should register a new user and return a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Reg User',
      email: `__test__reg_${Date.now()}@boxify.com`,
      password: 'password123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('customer');
  });

  it('should reject registration with a duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '__test__ Customer',
      email: '__test__customer@boxify.com',
      password: 'customer123',
    });
    expect(res.statusCode).toBe(400);
    // Validator catches it OR controller catches it — either way it's a 400
    expect([400]).toContain(res.statusCode);
  });

  it('should reject registration with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'noname@test.com' });
    // Validator now catches missing name/password before the controller → 400 not 500
    expect(res.statusCode).toBe(400);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('should login an existing customer and return a token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: '__test__customer@boxify.com',
      password: 'customer123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('__test__customer@boxify.com');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: '__test__customer@boxify.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@nowhere.com',
      password: 'whatever',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('should return authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${state.customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('__test__customer@boxify.com');
  });

  it('should reject request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toBe(401);
  });
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
describe('PUT /api/auth/profile', () => {
  it('should update the user profile name', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${state.customerToken}`)
      // Name must pass the regex: only letters, spaces, hyphens, apostrophes
      .send({ name: 'Test Updated Name' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Test Updated Name');
  });

  it('should require authentication', async () => {
    const res = await request(app).put('/api/auth/profile').send({ name: 'Hacker' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
describe('PUT /api/auth/change-password', () => {
  it('should reject change-password with wrong current password', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/incorrect/i);
  });

  it('should reject if new password is too short', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ currentPassword: 'customer123', newPassword: '123' });
    expect(res.statusCode).toBe(400);
  });

  it('should successfully change the password', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ currentPassword: 'customer123', newPassword: 'newpass456' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/changed successfully/i);
  });
});
