/**
 * tests/inventory.test.js
 * Comprehensive integration tests for Inventory Management feature
 */
const request = require('supertest');
const app = require('../app');
const Meal = require('../models/Meal');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

beforeAll(async () => {
  await connectDB();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

describe('Inventory Management Integration Tests', () => {
  describe('Schema default fields', () => {
    it('should include inStock (default: true) and stockQuantity (default: 0) on pre-seeded meals', async () => {
      const res = await request(app)
        .get(`/api/meals/${state.mealId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('meal');
      expect(res.body.meal).toHaveProperty('inStock', true);
      expect(res.body.meal).toHaveProperty('stockQuantity', 0);
    });
  });

  describe('PUT /api/meals/:id (Admin only updating inventory)', () => {
    it('should successfully allow admin to toggle stock status and change quantity', async () => {
      const res = await request(app)
        .put(`/api/meals/${state.mealId}`)
        .set('Authorization', `Bearer ${state.adminToken}`)
        .send({
          inStock: false,
          stockQuantity: 25,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('meal');
      expect(res.body.meal.inStock).toBe(false);
      expect(res.body.meal.stockQuantity).toBe(25);

      // Verify direct database persistence
      const dbMeal = await Meal.findById(state.mealId);
      expect(dbMeal.inStock).toBe(false);
      expect(dbMeal.stockQuantity).toBe(25);
    });

    it('should allow admin to update quantity and set back to inStock: true', async () => {
      const res = await request(app)
        .put(`/api/meals/${state.mealId}`)
        .set('Authorization', `Bearer ${state.adminToken}`)
        .send({
          inStock: true,
          stockQuantity: 50,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.meal.inStock).toBe(true);
      expect(res.body.meal.stockQuantity).toBe(50);
    });

    it('should reject inventory updates by non-admin customer', async () => {
      const res = await request(app)
        .put(`/api/meals/${state.mealId}`)
        .set('Authorization', `Bearer ${state.customerToken}`)
        .send({
          inStock: false,
          stockQuantity: 99,
        });

      expect(res.statusCode).toBe(403);
    });

    it('should reject inventory updates by unauthenticated visitors', async () => {
      const res = await request(app)
        .put(`/api/meals/${state.mealId}`)
        .send({
          inStock: false,
          stockQuantity: 99,
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
