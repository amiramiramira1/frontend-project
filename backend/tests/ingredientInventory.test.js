const request = require('supertest');
const app = require('../app');
const Ingredient = require('../models/Ingredient');
const Meal = require('../models/Meal');
const Box = require('../models/Box');
const { state, connectDB, seedTestData, teardownTestData } = require('./setup');

beforeAll(async () => {
  await connectDB();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

describe('Dynamic Ingredient-based Inventory Tests', () => {
  let testIngredientId;
  let testMealId;
  let testBoxId;

  beforeEach(async () => {
    // Clean up any existing test entities
    await Ingredient.deleteMany({ name: /^__spec_test__/ });
    await Meal.deleteMany({ name: /^__spec_test__/ });
    await Box.deleteMany({ name: /^__spec_test__/ });

    // 1. Create a spec ingredient with 1000 units
    const ing = await Ingredient.create({
      name: '__spec_test__ Rice',
      unit: 'g',
      costPerUnit: 0.05,
      caloriesPerUnit: 1.30,
      stockQuantity: 1000,
    });
    testIngredientId = ing._id;

    // 2. Create a spec meal that uses 150g per serving
    // (So max meals we can make is floor(1000 / 150) = 6 meals)
    const meal = await Meal.create({
      name: '__spec_test__ Fried Rice',
      description: 'Test fried rice',
      ingredients: [{ ingredient: testIngredientId, quantity: 150 }],
      dietType: 'standard',
      cuisine: 'Chinese',
      pricePerServing: 5.0,
      caloriesPerServing: 200,
    });
    testMealId = meal._id;

    // 3. Create a box containing this meal
    const box = await Box.create({
      name: '__spec_test__ Chinese Box',
      description: 'Spec test box',
      type: 'pre-made',
      dietType: 'standard',
      meals: [testMealId],
      basePrice: 5.0,
      isActive: true,
    });
    testBoxId = box._id;
  });

  it('should calculate meal stock quantity dynamically based on ingredients bottleneck', async () => {
    // Fetch the meal
    const res = await request(app)
      .get(`/api/meals/${testMealId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.meal.stockQuantity).toBe(6); // floor(1000 / 150) = 6
    expect(res.body.meal.inStock).toBe(true);
  });

  it('should reflect direct ingredient stock updates in the dynamic meal stock calculation', async () => {
    // Admin updates the ingredient stock to 300g (floor(300 / 150) = 2 meals)
    await request(app)
      .put(`/api/ingredients/${testIngredientId}`)
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ stockQuantity: 300 });

    // Fetch the meal again
    const res = await request(app)
      .get(`/api/meals/${testMealId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.meal.stockQuantity).toBe(2);
    expect(res.body.meal.inStock).toBe(true);
  });

  it('should respect admin override inStock: false and force stock to 0', async () => {
    // Admin toggles inStock: false on the meal
    await request(app)
      .put(`/api/meals/${testMealId}`)
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ inStock: false });

    // Fetch the meal
    const res = await request(app)
      .get(`/api/meals/${testMealId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.meal.stockQuantity).toBe(0);
    expect(res.body.meal.inStock).toBe(false);
  });

  it('should decrement ingredient stock proportionally when an order is checked out', async () => {
    // 1. Get initial ingredient stock
    const initialIng = await Ingredient.findById(testIngredientId);
    expect(initialIng.stockQuantity).toBe(1000);

    // 2. Mock a checkout by adding item to cart and checking out
    // Put item in cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({ boxId: testBoxId, servingSize: 2, quantity: 1 }); // 1 box * 2 servings * 150g = 300g used

    // Checkout
    const checkoutRes = await request(app)
      .post('/api/cart/checkout')
      .set('Authorization', `Bearer ${state.customerToken}`)
      .send({
        deliveryAddress: { street: '10 Spec St', city: 'Cairo', country: 'Egypt', postalCode: '11111' }
      });

    expect(checkoutRes.statusCode).toBe(201);

    // 3. Verify ingredient stock decremented by 300g (1000 - 300 = 700g remaining)
    const updatedIng = await Ingredient.findById(testIngredientId);
    expect(updatedIng.stockQuantity).toBe(700);

    // 4. Verify dynamic meal stock updated to floor(700 / 150) = 4 meals
    const mealRes = await request(app)
      .get(`/api/meals/${testMealId}`);
    expect(mealRes.body.meal.stockQuantity).toBe(4);
  });

  it('should soft-deactivate a box when DELETE is called by admin', async () => {
    const res = await request(app)
      .delete(`/api/boxes/${testBoxId}`)
      .set('Authorization', `Bearer ${state.adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Box deactivated');

    // Verify it is indeed inactive in the database
    const box = await Box.findById(testBoxId);
    expect(box.isActive).toBe(false);
  });

  it('should reactivate a deactivated box when PUT is called with isActive: true by admin', async () => {
    // 1. Deactivate first
    await Box.findByIdAndUpdate(testBoxId, { isActive: false });

    // 2. Reactivate via PUT
    const res = await request(app)
      .put(`/api/boxes/${testBoxId}`)
      .set('Authorization', `Bearer ${state.adminToken}`)
      .send({ isActive: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.box.isActive).toBe(true);

    // Verify it is indeed active in the database
    const box = await Box.findById(testBoxId);
    expect(box.isActive).toBe(true);
  });

  it('should retrieve all ingredients (above default 10 pagination limit) when request has limit=200', async () => {
    // Let's seed more ingredients to have more than 10 ingredients
    const additionalIngredients = [];
    for (let i = 1; i <= 12; i++) {
      additionalIngredients.push({
        name: `__spec_test__ Ingredient ${i}`,
        unit: 'g',
        costPerUnit: 0.1,
        caloriesPerUnit: 1.0,
        stockQuantity: 100,
      });
    }
    await Ingredient.insertMany(additionalIngredients);

    // Query ingredients without limit (defaults to 10)
    const resDefault = await request(app)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(resDefault.statusCode).toBe(200);
    expect(resDefault.body.ingredients.length).toBe(10); // limited to 10 by default

    // Query ingredients with limit=200
    const resLimit = await request(app)
      .get('/api/ingredients')
      .query({ limit: 200 })
      .set('Authorization', `Bearer ${state.adminToken}`);
    expect(resLimit.statusCode).toBe(200);
    expect(resLimit.body.ingredients.length).toBeGreaterThan(10); // should return all seeded ones
  });

  it('should reject requests with 401 Unauthorized if the user in the token has been deleted from the database', async () => {
    const User = require('../models/User');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');

    // 1. Create a temp user and sign a token
    const tempUser = await User.create({
      name: '__spec_test__ Temp Admin',
      email: '__spec_test__temp_admin@boxify.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    });

    const tempToken = jwt.sign({ id: tempUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 2. Verify that requesting with this token initially succeeds
    const successRes = await request(app)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${tempToken}`);
    expect(successRes.statusCode).toBe(200);

    // 3. Delete the temp user from the database
    await User.findByIdAndDelete(tempUser._id);

    // 4. Verify that requesting with the same token now returns 401 Unauthorized instead of 403 Forbidden
    const failRes = await request(app)
      .get('/api/ingredients')
      .set('Authorization', `Bearer ${tempToken}`);

    expect(failRes.statusCode).toBe(401);
    expect(failRes.body.message).toContain('user not found');
  });
});
