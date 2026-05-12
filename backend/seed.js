require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

const User         = require('./models/User');
const Ingredient   = require('./models/Ingredient');
const Meal         = require('./models/Meal');
const Box          = require('./models/Box');
const Subscription = require('./models/Subscription');
const Order        = require('./models/Order');

// Configure Cloudinary from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a remote URL to Cloudinary → returns secure_url.
// public_id keeps names predictable so re-seeding overwrites instead of duplicating.
async function uploadImage(remoteUrl, publicId) {
  const result = await cloudinary.uploader.upload(remoteUrl, {
    folder:         'boxify/seed',
    public_id:      publicId,
    overwrite:      true,
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  });
  return result.secure_url;
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // --- Wipe collections ---
    console.log('🗑️  Clearing database...');
    await Promise.all([
      User.deleteMany(),
      Ingredient.deleteMany(),
      Meal.deleteMany(),
      Box.deleteMany(),
      Subscription.deleteMany(),
      Order.deleteMany(),
    ]);
    console.log('✅ Database cleared');

    // --- Upload images to Cloudinary (remote URL upload — no file download needed) ---
    console.log('☁️  Uploading seed images to Cloudinary...');
    const [
      imgChicken,
      imgPasta,
      imgEggs,
      imgSalmon,
      imgClassicBox,
      imgVeggieBox,
      imgKetoBox,
    ] = await Promise.all([
      uploadImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', 'meal_chicken_bowl'),
      uploadImage('https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=800', 'meal_pasta_pomodoro'),
      uploadImage('https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800', 'meal_egg_scramble'),
      uploadImage('https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 'meal_salmon_rice'),
      uploadImage('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 'box_classic'),
      uploadImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800', 'box_veggie'),
      uploadImage('https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=800', 'box_keto'),
    ]);
    console.log('✅ Images uploaded to Cloudinary');

    // --- Seed Users ---
    console.log('👤 Seeding users...');
    const adminPassword    = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    const [, customer1, customer2] = await User.insertMany([
      { name: 'Admin User',  email: 'admin@boxify.com',  password: adminPassword,    role: 'admin' },
      {
        name: 'Sara Ahmed',  email: 'sara@example.com',  password: customerPassword, role: 'customer',
        addresses:       [{ street: '10 Tahrir Square', city: 'Cairo',      country: 'Egypt', postalCode: '11511' }],
        dietPreferences: ['vegetarian'],
      },
      {
        name: 'Omar Hassan', email: 'omar@example.com',  password: customerPassword, role: 'customer',
        addresses:       [{ street: '5 Corniche St',    city: 'Alexandria', country: 'Egypt', postalCode: '21500' }],
        dietPreferences: ['standard'],
      },
    ]);
    console.log('✅ Users seeded');

    // --- Seed Ingredients ---
    console.log('🥕 Seeding ingredients...');
    const ingredients = await Ingredient.insertMany([
      { name: 'Chicken Breast', unit: 'g',     costPerUnit: 0.015, caloriesPerUnit: 1.65 },
      { name: 'Basmati Rice',   unit: 'g',     costPerUnit: 0.004, caloriesPerUnit: 1.30 },
      { name: 'Broccoli',       unit: 'g',     costPerUnit: 0.005, caloriesPerUnit: 0.34 },
      { name: 'Olive Oil',      unit: 'tbsp',  costPerUnit: 0.20,  caloriesPerUnit: 119  },
      { name: 'Pasta',          unit: 'g',     costPerUnit: 0.003, caloriesPerUnit: 1.31 },
      { name: 'Tomato Sauce',   unit: 'ml',    costPerUnit: 0.006, caloriesPerUnit: 0.29 },
      { name: 'Cheddar Cheese', unit: 'g',     costPerUnit: 0.018, caloriesPerUnit: 4.02 },
      { name: 'Eggs',           unit: 'piece', costPerUnit: 0.50,  caloriesPerUnit: 78   },
      { name: 'Spinach',        unit: 'g',     costPerUnit: 0.007, caloriesPerUnit: 0.23 },
      { name: 'Salmon Fillet',  unit: 'g',     costPerUnit: 0.025, caloriesPerUnit: 2.08 },
    ]);
    console.log('✅ Ingredients seeded');

    const ing = (name) => ingredients.find((i) => i.name === name)._id;

    // --- Seed Meals ---
    console.log('🍽️  Seeding meals...');

    const calcTotals = (recipeItems) => {
      let price = 0, cals = 0;
      for (const { ingredient, quantity } of recipeItems) {
        const found = ingredients.find((i) => i._id.equals(ingredient));
        price += found.costPerUnit * quantity;
        cals  += found.caloriesPerUnit * quantity;
      }
      return { pricePerServing: parseFloat(price.toFixed(2)), caloriesPerServing: Math.round(cals) };
    };

    const meal1Ings = [
      { ingredient: ing('Chicken Breast'), quantity: 200 },
      { ingredient: ing('Basmati Rice'),   quantity: 150 },
      { ingredient: ing('Broccoli'),       quantity: 100 },
      { ingredient: ing('Olive Oil'),      quantity: 1   },
    ];
    const meal2Ings = [
      { ingredient: ing('Pasta'),          quantity: 200 },
      { ingredient: ing('Tomato Sauce'),   quantity: 100 },
      { ingredient: ing('Cheddar Cheese'), quantity: 30  },
    ];
    const meal3Ings = [
      { ingredient: ing('Eggs'),           quantity: 3  },
      { ingredient: ing('Spinach'),        quantity: 80 },
      { ingredient: ing('Cheddar Cheese'), quantity: 20 },
      { ingredient: ing('Olive Oil'),      quantity: 1  },
    ];
    const meal4Ings = [
      { ingredient: ing('Salmon Fillet'),  quantity: 180 },
      { ingredient: ing('Basmati Rice'),   quantity: 120 },
      { ingredient: ing('Broccoli'),       quantity: 80  },
    ];

    const meals = await Meal.insertMany([
      {
        name: 'Grilled Chicken Bowl',
        description: 'Juicy grilled chicken with steamed rice and broccoli.',
        ingredients: meal1Ings, dietType: 'standard', cuisine: 'American',
        allergens: [], image: imgChicken,
        ...calcTotals(meal1Ings),
      },
      {
        name: 'Pasta Pomodoro',
        description: 'Classic pasta in rich tomato sauce with melted cheese.',
        ingredients: meal2Ings, dietType: 'vegetarian', cuisine: 'Italian',
        allergens: ['gluten', 'dairy'], image: imgPasta,
        ...calcTotals(meal2Ings),
      },
      {
        name: 'Spinach & Egg Scramble',
        description: 'Fluffy scrambled eggs with fresh spinach and cheddar.',
        ingredients: meal3Ings, dietType: 'vegetarian', cuisine: 'International',
        allergens: ['eggs', 'dairy'], image: imgEggs,
        ...calcTotals(meal3Ings),
      },
      {
        name: 'Baked Salmon & Rice',
        description: 'Perfectly baked salmon fillet with jasmine rice.',
        ingredients: meal4Ings, dietType: 'keto', cuisine: 'Mediterranean',
        allergens: ['fish'], image: imgSalmon,
        ...calcTotals(meal4Ings),
      },
    ]);
    console.log('✅ Meals seeded');

    // --- Seed Boxes ---
    console.log('📦 Seeding boxes...');

    const calcBoxPrice = (selectedMeals) =>
      parseFloat(selectedMeals.reduce((sum, m) => sum + m.pricePerServing, 0).toFixed(2));

    const boxes = await Box.insertMany([
      {
        name: 'The Classic Box',
        description: 'A well-balanced weekly box for everyone.',
        type: 'pre-made', dietType: 'standard',
        meals: [meals[0]._id, meals[1]._id],
        basePrice: calcBoxPrice([meals[0], meals[1]]),
        image: imgClassicBox, isActive: true,
      },
      {
        name: 'Veggie Delight Box',
        description: 'All vegetarian meals, packed with nutrients.',
        type: 'pre-made', dietType: 'vegetarian',
        meals: [meals[1]._id, meals[2]._id],
        basePrice: calcBoxPrice([meals[1], meals[2]]),
        image: imgVeggieBox, isActive: true,
      },
      {
        name: 'Keto Power Box',
        description: 'High protein, low carb meals for your keto journey.',
        type: 'pre-made', dietType: 'keto',
        meals: [meals[0]._id, meals[3]._id],
        basePrice: calcBoxPrice([meals[0], meals[3]]),
        image: imgKetoBox, isActive: true,
      },
    ]);
    console.log('✅ Boxes seeded');

    // --- Seed Subscriptions ---
    console.log('🔄 Seeding subscriptions...');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Subscription.insertMany([
      {
        user: customer1._id, box: boxes[1]._id,
        servingSize: 2, frequency: 'weekly', status: 'active',
        nextDeliveryDate: nextWeek, mealRotation: boxes[1].meals,
      },
      {
        user: customer2._id, box: boxes[0]._id,
        servingSize: 4, frequency: 'monthly', status: 'active',
        nextDeliveryDate: nextWeek, mealRotation: boxes[0].meals,
      },
    ]);
    console.log('✅ Subscriptions seeded');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin  → admin@boxify.com  / admin123');
    console.log('   User 1 → sara@example.com  / customer123');
    console.log('   User 2 → omar@example.com  / customer123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seed();