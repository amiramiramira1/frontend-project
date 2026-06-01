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
const { getNextDeliveryDate } = require('./jobs/subscriptionJob');

// Configure Cloudinary from .env if present
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key:    process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Upload a remote URL to Cloudinary → returns secure_url.
// If Cloudinary is not configured or fails, it falls back to direct URL gracefully.
async function uploadImage(remoteUrl, publicId) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log(`⚠️ Cloudinary not configured. Using direct link for ${publicId}`);
    return remoteUrl;
  }
  try {
    const result = await cloudinary.uploader.upload(remoteUrl, {
      folder:         'boxify/seed',
      public_id:      publicId,
      overwrite:      true,
      transformation: [{ width: 800, height: 600, crop: 'limit' }],
    });
    console.log(`☁️ Cloudinary uploaded: ${publicId}`);
    return result.secure_url;
  } catch (err) {
    console.log(`⚠️ Cloudinary upload failed for ${publicId} (${err.message}). Using direct link.`);
    return remoteUrl;
  }
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

    // --- Upload images to Cloudinary / Get URLs ---
    console.log('🖼️  Processing seed images...');
    const [
      imgKoshari,
      imgMolokhia,
      imgMoussaka,
      imgFalafel,
      imgMahshi,
      imgLentilSoup,
      imgSayadeya,
      imgShrimp,
      imgSalmon,
      imgKofta,
      imgShishTawook,
      imgBamya,
      imgShawarma,
      imgShakshuka,
      imgChickenTikka,
      imgPasta,
      imgButterChicken,
      imgChickenBowl,
      imgBaladiBox,
      imgDietBox,
      imgZamanBox,
      imgBahriBox,
      imgAliBox,
      imgEilaBox
    ] = await Promise.all([
      uploadImage('https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800', 'meal_koshari'),
      uploadImage('https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800', 'meal_molokhia'),
      uploadImage('https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=800', 'meal_moussaka'),
      uploadImage('https://images.unsplash.com/photo-1547058886-af77813b91d2?w=800', 'meal_falafel'),
      uploadImage('https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800', 'meal_mahshi'),
      uploadImage('https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=800', 'meal_lentilsoup'),
      uploadImage('https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800', 'meal_sayadeya'),
      uploadImage('https://images.unsplash.com/photo-1559737607-b28666ff047e?w=800', 'meal_shrimp'),
      uploadImage('https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 'meal_salmon'),
      uploadImage('https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800', 'meal_kofta'),
      uploadImage('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', 'meal_shishtawook'),
      uploadImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', 'meal_bamya'),
      uploadImage('https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800', 'meal_shawarma'),
      uploadImage('https://images.unsplash.com/photo-1590412200988-a436bb7050a8?w=800', 'meal_shakshuka'),
      uploadImage('https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800', 'meal_chickentikka'),
      uploadImage('https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=800', 'meal_pasta'),
      uploadImage('https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800', 'meal_butterchicken'),
      uploadImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', 'meal_chickenbowl'),
      uploadImage('https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800', 'box_baladi'),
      uploadImage('https://images.unsplash.com/photo-1544025162-d76694265947?w=800', 'box_diet'),
      uploadImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800', 'box_zaman'),
      uploadImage('https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800', 'box_bahri'),
      uploadImage('https://images.unsplash.com/photo-1544025162-d76694265947?w=800', 'box_ali'),
      uploadImage('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 'box_eila')
    ]);
    console.log('✅ Images ready');

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

    // --- Seed Ingredients (EGP values realistic for Egypt) ---
    console.log('🥕 Seeding ingredients...');
    const ingredients = await Ingredient.insertMany([
      { name: 'Chicken Breast', unit: 'g',     costPerUnit: 0.25,  caloriesPerUnit: 1.65 },
      { name: 'Basmati Rice',   unit: 'g',     costPerUnit: 0.05,  caloriesPerUnit: 1.30 },
      { name: 'Broccoli',       unit: 'g',     costPerUnit: 0.04,  caloriesPerUnit: 0.34 },
      { name: 'Olive Oil',      unit: 'ml',    costPerUnit: 0.15,  caloriesPerUnit: 8.84 },
      { name: 'Pasta',          unit: 'g',     costPerUnit: 0.04,  caloriesPerUnit: 1.31 },
      { name: 'Tomato Sauce',   unit: 'ml',    costPerUnit: 0.06,  caloriesPerUnit: 0.29 },
      { name: 'Cheddar Cheese', unit: 'g',     costPerUnit: 0.35,  caloriesPerUnit: 4.02 },
      { name: 'Eggs',           unit: 'piece', costPerUnit: 5.50,  caloriesPerUnit: 78   },
      { name: 'Spinach',        unit: 'g',     costPerUnit: 0.08,  caloriesPerUnit: 0.23 },
      { name: 'Salmon Fillet',  unit: 'g',     costPerUnit: 1.25,  caloriesPerUnit: 2.08 },
      { name: 'Lentils',        unit: 'g',     costPerUnit: 0.06,  caloriesPerUnit: 1.16 },
      { name: 'Macaroni',       unit: 'g',     costPerUnit: 0.04,  caloriesPerUnit: 3.71 },
      { name: 'Chickpeas',      unit: 'g',     costPerUnit: 0.08,  caloriesPerUnit: 3.64 },
      { name: 'Eggplant',       unit: 'g',     costPerUnit: 0.03,  caloriesPerUnit: 0.25 },
      { name: 'Minced Beef',    unit: 'g',     costPerUnit: 0.35,  caloriesPerUnit: 2.50 },
      { name: 'Fava Beans',     unit: 'g',     costPerUnit: 0.05,  caloriesPerUnit: 3.41 },
      { name: 'Zucchini',       unit: 'g',     costPerUnit: 0.04,  caloriesPerUnit: 0.17 },
      { name: 'Sea Bass Fillet',unit: 'g',     costPerUnit: 0.95,  caloriesPerUnit: 0.97 },
      { name: 'Okra',           unit: 'g',     costPerUnit: 0.06,  caloriesPerUnit: 0.33 },
      { name: 'Tender Lamb',    unit: 'g',     costPerUnit: 0.45,  caloriesPerUnit: 2.94 },
    ]);
    console.log('✅ Ingredients seeded');

    const ing = (name) => ingredients.find((i) => i.name === name)._id;

    // --- Helper to calculate totals automatically ---
    const calcTotals = (recipeItems) => {
      let price = 0, cals = 0;
      for (const { ingredient, quantity } of recipeItems) {
        const found = ingredients.find((i) => i._id.equals(ingredient));
        if (found) {
          price += found.costPerUnit * quantity;
          cals  += found.caloriesPerUnit * quantity;
        }
      }
      return { pricePerServing: parseFloat(price.toFixed(2)), caloriesPerServing: Math.round(cals) };
    };

    // --- Seed Meals (17 Exquisite Local & Mediterranean Dishes) ---
    console.log('🍽️  Seeding meals...');

    const meal1Ings = [
      { ingredient: ing('Lentils'), quantity: 50 },
      { ingredient: ing('Basmati Rice'), quantity: 80 },
      { ingredient: ing('Macaroni'), quantity: 80 },
      { ingredient: ing('Chickpeas'), quantity: 40 },
      { ingredient: ing('Tomato Sauce'), quantity: 80 },
      { ingredient: ing('Olive Oil'), quantity: 10 },
    ];
    const meal2Ings = [
      { ingredient: ing('Chicken Breast'), quantity: 180 },
      { ingredient: ing('Basmati Rice'), quantity: 150 },
      { ingredient: ing('Spinach'), quantity: 100 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];
    const meal3Ings = [
      { ingredient: ing('Eggplant'), quantity: 200 },
      { ingredient: ing('Minced Beef'), quantity: 120 },
      { ingredient: ing('Tomato Sauce'), quantity: 100 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];
    const meal4Ings = [
      { ingredient: ing('Fava Beans'), quantity: 150 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
      { ingredient: ing('Eggs'), quantity: 1 },
    ];
    const meal5Ings = [
      { ingredient: ing('Zucchini'), quantity: 200 },
      { ingredient: ing('Basmati Rice'), quantity: 100 },
      { ingredient: ing('Tomato Sauce'), quantity: 60 },
      { ingredient: ing('Olive Oil'), quantity: 10 },
    ];
    const meal6Ings = [
      { ingredient: ing('Lentils'), quantity: 100 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];
    const meal7Ings = [
      { ingredient: ing('Sea Bass Fillet'), quantity: 180 },
      { ingredient: ing('Basmati Rice'), quantity: 120 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];
    const meal8Ings = [
      { ingredient: ing('Zucchini'), quantity: 220 },
      { ingredient: ing('Olive Oil'), quantity: 20 },
    ];
    const meal9Ings = [
      { ingredient: ing('Salmon Fillet'), quantity: 180 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];
    const meal10Ings = [
      { ingredient: ing('Minced Beef'), quantity: 200 },
      { ingredient: ing('Olive Oil'), quantity: 10 },
    ];
    const meal11Ings = [
      { ingredient: ing('Chicken Breast'), quantity: 180 },
      { ingredient: ing('Olive Oil'), quantity: 10 },
    ];
    const meal12Ings = [
      { ingredient: ing('Okra'), quantity: 150 },
      { ingredient: ing('Tender Lamb'), quantity: 120 },
      { ingredient: ing('Tomato Sauce'), quantity: 80 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];
    const meal13Ings = [
      { ingredient: ing('Chicken Breast'), quantity: 180 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];
    const meal14Ings = [
      { ingredient: ing('Eggs'), quantity: 3 },
      { ingredient: ing('Tomato Sauce'), quantity: 100 },
      { ingredient: ing('Cheddar Cheese'), quantity: 30 },
      { ingredient: ing('Olive Oil'), quantity: 10 },
    ];
    const meal15Ings = [
      { ingredient: ing('Chicken Breast'), quantity: 180 },
      { ingredient: ing('Basmati Rice'), quantity: 120 },
      { ingredient: ing('Olive Oil'), quantity: 10 },
    ];
    const meal16Ings = [
      { ingredient: ing('Pasta'), quantity: 150 },
      { ingredient: ing('Tomato Sauce'), quantity: 100 },
      { ingredient: ing('Minced Beef'), quantity: 100 },
      { ingredient: ing('Olive Oil'), quantity: 10 },
    ];
    const meal17Ings = [
      { ingredient: ing('Chicken Breast'), quantity: 180 },
      { ingredient: ing('Basmati Rice'), quantity: 120 },
      { ingredient: ing('Olive Oil'), quantity: 15 },
    ];

    const meals = await Meal.insertMany([
      {
        name: 'كشري مصري (Koshari Masry Bowl)',
        description: 'طبق الكشري المصري التقليدي اللذيذ: مكرونة وأرز وعدس وحمص مع الصلصة والدقة والبصل المقرمش. (Classic Egyptian street food bowl: macaroni, rice, lentils, and chickpeas topped with spiced garlic vinegar, tomato sauce, and crispy onions.)',
        ingredients: meal1Ings, dietType: 'vegetarian', cuisine: 'Egyptian',
        allergens: ['gluten'], image: imgKoshari,
        ...calcTotals(meal1Ings),
      },
      {
        name: 'ملوخية بالفراخ (Molokhia bel Ferakh)',
        description: 'شوربة الملوخية المصرية الشهيرة بالثوم والكزبرة، تقدم مع صدر دجاج مشوي وأرز بالشعرية. (Authentic green jute leaf soup cooked with garlic and coriander, served with juicy roasted chicken breast and vermicelli rice.)',
        ingredients: meal2Ings, dietType: 'standard', cuisine: 'Egyptian',
        allergens: [], image: imgMolokhia,
        ...calcTotals(meal2Ings),
      },
      {
        name: 'مسقعة باللحمة المفرومة (Moussaka bel Lahma)',
        description: 'طاجن مسقعة مصري بالباذنجان المقلي والفلفل الرومي واللحم المفروم المطهو في صلصة الطماطم بالثوم. (Baked layers of seasoned eggplant, green bell peppers, and savory minced beef in a rich garlic tomato gravy.)',
        ingredients: meal3Ings, dietType: 'standard', cuisine: 'Egyptian',
        allergens: [], image: imgMoussaka,
        ...calcTotals(meal3Ings),
      },
      {
        name: 'فول وطعمية (Ful & Ta3meya Platter)',
        description: 'أقراص الطعمية المقرمشة بالخضرة الطازجة، تقدم مع الفول المدمس بزيت الزيتون والكمون والليمون. (Crispy fava bean falafel patties packed with fresh herbs, paired with slow-cooked fava beans in olive oil and cumin.)',
        ingredients: meal4Ings, dietType: 'vegetarian', cuisine: 'Egyptian',
        allergens: ['eggs'], image: imgFalafel,
        ...calcTotals(meal4Ings),
      },
      {
        name: 'محشي كوسة (Mahshi Kousa)',
        description: 'كوسة طازجة محشوة بخلطة الأرز المصرية المتبلة مع الشبت والبقدونس والصلصة. (Fresh local zucchini hollowed and stuffed with a seasoned rice, parsley, dill, and tomato herb mix.)',
        ingredients: meal5Ings, dietType: 'vegetarian', cuisine: 'Egyptian',
        allergens: [], image: imgMahshi,
        ...calcTotals(meal5Ings),
      },
      {
        name: 'شوربة عدس (Shorbet 3ads)',
        description: 'شوربة العدس الأصفر الغنية مع الجزر والكمون والثوم، تقدم مع الخبز البلدي المحمص. (Creamy and nourishing yellow lentil soup stewed with carrots, cumin, and garlic, served with crispy baladi bread.)',
        ingredients: meal6Ings, dietType: 'vegetarian', cuisine: 'Egyptian',
        allergens: [], image: imgLentilSoup,
        ...calcTotals(meal6Ings),
      },
      {
        name: 'سمك صيادية (Samak Sayadeya)',
        description: 'سمك قاروص مخبوز بالخلطة الإسكندرانية مع الكمون والفلفل، يقدم مع أرز الصيادية البني المقرمش. (Fresh sea bass fillet baked Alexandrian-style with cumin, sweet peppers, and onions, over spiced caramelized Sayadeya rice.)',
        ingredients: meal7Ings, dietType: 'standard', cuisine: 'Egyptian',
        allergens: ['fish'], image: imgSayadeya,
        ...calcTotals(meal7Ings),
      },
      {
        name: 'جمبري بالزبدة والثوم (Gambary bel Zebda)',
        description: 'جمبري طازج مطهو بزيت الزيتون والزبدة والثوم، يقدم مع نودلز الكوسة الصحية. (Succulent shrimp sautéed in garlic-infused olive oil and butter, served over fresh spiralized zucchini noodles.)',
        ingredients: meal8Ings, dietType: 'keto', cuisine: 'Mediterranean',
        allergens: ['shellfish'], image: imgShrimp,
        ...calcTotals(meal8Ings),
      },
      {
        name: 'سلمون مشوي (Salmon Mashwy)',
        description: 'فيليه سلمون مشوي بالملح البحري والأعشاب، يقدم مع أصابع الهليون الطازجة المشوية. (Herb-encrusted salmon fillet seared with sea salt and served alongside fresh roasted baby asparagus.)',
        ingredients: meal9Ings, dietType: 'keto', cuisine: 'Mediterranean',
        allergens: ['fish'], image: imgSalmon,
        ...calcTotals(meal9Ings),
      },
      {
        name: 'كفتة مشوية (Kofta Mashweya)',
        description: 'أصابع كفتة لحم بقري متبلة بالبصل والبقدونس والبهارات المشوية على الفحم، تقدم مع سلطة الطحينة. (Juicy minced beef skewers seasoned with onions, parsley, and Middle Eastern spices, grilled and served with tahini sauce.)',
        ingredients: meal10Ings, dietType: 'paleo', cuisine: 'Egyptian',
        allergens: [], image: imgKofta,
        ...calcTotals(meal10Ings),
      },
      {
        name: 'سلطة شيش طاووق (Shish Tawook Salad)',
        description: 'شيش طاووك مشوي متبل بالزبادي والليمون، يقدم مع الخضار الطازج وزيت الزيتون والليمون. (Marinated and grilled chicken skewers served over a colorful bed of crisp greens, cucumbers, and an olive oil lemon dressing.)',
        ingredients: meal11Ings, dietType: 'paleo', cuisine: 'Egyptian',
        allergens: [], image: imgShishTawook,
        ...calcTotals(meal11Ings),
      },
      {
        name: 'طاجن بامية باللحم (Tajen Bamya bel Lahma)',
        description: 'بامية طازجة مطهوة ببطء مع قطع لحم ضأن موزة في صلصة الطماطم بالثوم والليمون في طاجن فخاري. (Tender lamb chunks slow-cooked with fresh local baby okra in a savory garlic tomato sauce with a hint of fresh lemon.)',
        ingredients: meal12Ings, dietType: 'standard', cuisine: 'Egyptian',
        allergens: [], image: imgBamya,
        ...calcTotals(meal12Ings),
      },
      {
        name: 'شاورما فراخ (Chicken Shawarma Platter)',
        description: 'شرائح شاورما دجاج متبلة بالحبهان والبهارات، تقدم مع أرز القرنبيط الصحي اللذيذ. (Roasted chicken shawarma strips in garlic-cardamom spices, served over healthy seasoned cauliflower rice.)',
        ingredients: meal13Ings, dietType: 'keto', cuisine: 'Egyptian',
        allergens: [], image: imgShawarma,
        ...calcTotals(meal13Ings),
      },
      {
        name: 'شكشوكة بالبيض (Shakshuka Eggs)',
        description: 'بيض مسلوق ببطء في صلصة الطماطم المتبلة بالفلفل الأخضر الحار والبصل والثوم وجبن الفيتا. (Farm fresh eggs slow-poached in a simmering skillet of bell peppers, onions, chili, and garlic tomato stew with feta.)',
        ingredients: meal14Ings, dietType: 'vegetarian', cuisine: 'Egyptian',
        allergens: ['eggs', 'dairy'], image: imgShakshuka,
        ...calcTotals(meal14Ings),
      },
      {
        name: 'دجاج تكا بالزعفران (Chicken Tikka & Saffron Rice)',
        description: 'صدور دجاج مشوية متبلة بالزبادي والتوابل الهندية الغنية، تقدم مع أرز البسمتي بالزعفران. (Spiced yogurt-marinated roasted chicken breast, served with premium aromatic saffron Basmati rice.)',
        ingredients: meal15Ings, dietType: 'standard', cuisine: 'International',
        allergens: ['dairy'], image: imgChickenTikka,
        ...calcTotals(meal15Ings),
      },
      {
        name: 'مكرونة كرات اللحم (Spaghetti & Beef Meatballs)',
        description: 'مكرونة إسباجيتي بصلصة المارينارا الإيطالية الغنية، تعلوها كرات اللحم البقري المتبلة. (Spaghetti noodles tossed in rich tomato marinara, served with hand-rolled seasoned beef meatballs.)',
        ingredients: meal16Ings, dietType: 'standard', cuisine: 'Italian',
        allergens: ['gluten'], image: imgPasta,
        ...calcTotals(meal16Ings),
      },
      {
        name: 'بتر تشيكن هندي (Butter Chicken & Jasmine Rice)',
        description: 'دجاج مخلي طري مطهو في صلصة البتر تشيكن الكريمية اللذيذة، يقدم مع أرز الياسمين. (Boneless tender chicken simmered in a mildly sweet, rich tomato butter gravy, served with fluffy jasmine rice.)',
        ingredients: meal17Ings, dietType: 'standard', cuisine: 'International',
        allergens: ['dairy'], image: imgButterChicken,
        ...calcTotals(meal17Ings),
      },
    ]);
    console.log('✅ Meals seeded');

    // --- Seed Boxes (6 Casual Egyptian Categories) ---
    console.log('📦 Seeding boxes...');

    const calcBoxPrice = (selectedMeals) =>
      parseFloat(selectedMeals.reduce((sum, m) => sum + m.pricePerServing, 0).toFixed(2));

    const boxes = await Box.insertMany([
      {
        name: 'البلدي يوكل (El Baladi Yekol Box)',
        description: 'أشهر الأكلات المصرية الشعبية والأصيلة اللي بتدفي القلب: كشري وملوخية ومسقعة باللحمة المفرومة. (The most famous authentic Egyptian comfort foods: Koshari, Molokhia, and Moussaka.)',
        type: 'pre-made', dietType: 'standard',
        meals: [meals[0]._id, meals[1]._id, meals[2]._id],
        basePrice: calcBoxPrice([meals[0], meals[1], meals[2]]),
        image: imgBaladiBox, isActive: true,
      },
      {
        name: 'علشان الدايت (3alashan El Diet Box)',
        description: 'وجبات لذيذة وصحية وقليلة الكربوهيدرات عشان تحافظ على رشاقتك: كفتة مشوية وشاورما دجاج وشكشوكة غنية. (Delicious high-protein low-carb healthy options to stay in shape: Kofta, Shawarma, and Shakshuka.)',
        type: 'pre-made', dietType: 'keto',
        meals: [meals[9]._id, meals[12]._id, meals[13]._id],
        basePrice: calcBoxPrice([meals[9], meals[12], meals[13]]),
        image: imgDietBox, isActive: true,
      },
      {
        name: 'أكل زمان (Akl Zaman Veggie Box)',
        description: 'وجبات نباتية 100% مغذية ولذيذة بروح زمان وأكل الأمهات: طعمية وفول ومحشي كوسة وشوربة عدس دافية. (100% nutritious plant-based classics with the good old spirit of home cooking: Falafel, Ful, Mahshi, and Lentil Soup.)',
        type: 'pre-made', dietType: 'vegetarian',
        meals: [meals[3]._id, meals[4]._id, meals[5]._id],
        basePrice: calcBoxPrice([meals[3], meals[4], meals[5]]),
        image: imgZamanBox, isActive: true,
      },
      {
        name: 'أكلة بحري (Aklat Bahri Seafood Box)',
        description: 'فسفور وطاقة من سواحل إسكندرية والبحر الأحمر: سمك قاروص صيادية وجمبري بالثوم والزبدة وسلمون مشوي. (Fresh coastal sea catches from Alexandria and the Red Sea: Sayadeya Baked Fish, Garlic Butter Shrimp, and Seared Salmon.)',
        type: 'pre-made', dietType: 'standard',
        meals: [meals[6]._id, meals[7]._id, meals[8]._id],
        basePrice: calcBoxPrice([meals[6], meals[7], meals[8]]),
        image: imgBahriBox, isActive: true,
      },
      {
        name: 'شغل عالي (Shoghl 3aly Premium Box)',
        description: 'تشكيلة فاخرة ولذيذة من أطباق الدجاج واللحم المميزة: شيش طاووق وبامية باللحم الضاني وتكا هندي بالزعفران. (A luxurious selection of premium chicken and lamb dishes: Shish Tawook, Lamb Bamya Okra, and Chicken Tikka.)',
        type: 'pre-made', dietType: 'standard',
        meals: [meals[10]._id, meals[11]._id, meals[14]._id],
        basePrice: calcBoxPrice([meals[10], meals[11], meals[14]]),
        image: imgAliBox, isActive: true,
      },
      {
        name: 'لمة العيلة (Lemet El 3ela Family Box)',
        description: 'وجبات متوازنة ومحبوبة للأطفال والكبار بتكفي كل العيلة: مكرونة بالكرات واللحم وبتر تشيكن هندي وشيكن بول كلاسيك. (Crowd-pleasing balanced meals perfect for family dinners: Pasta with Meatballs, Butter Chicken, and Grilled Chicken Bowl.)',
        type: 'pre-made', dietType: 'standard',
        meals: [meals[15]._id, meals[16]._id, meals[1]._id],
        basePrice: calcBoxPrice([meals[15], meals[16], meals[1]]),
        image: imgEilaBox, isActive: true,
      },
    ]);
    console.log('✅ Boxes seeded');

    // --- Seed Subscriptions ---
    console.log('🔄 Seeding subscriptions...');
    await Subscription.insertMany([
      {
        user: customer1._id, box: boxes[2]._id,
        servingSize: 2, frequency: 'weekly', deliveryDay: 'saturday', status: 'active',
        nextDeliveryDate: getNextDeliveryDate('weekly', 'saturday'),
        mealRotation: boxes[2].meals,
      },
      {
        user: customer2._id, box: boxes[0]._id,
        servingSize: 4, frequency: 'monthly', deliveryDay: 'tuesday', status: 'active',
        nextDeliveryDate: getNextDeliveryDate('monthly', 'tuesday'),
        mealRotation: boxes[0].meals,
      },
    ]);
    console.log('✅ Subscriptions seeded');

    console.log('\n🎉 Database seeded successfully with authentic Egyptian content!');
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