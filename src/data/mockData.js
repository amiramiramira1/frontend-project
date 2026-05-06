// ============================================================
// MOCK DATA — Use this instead of the backend during development
// ============================================================

// ---------- SAMPLE MEALS ----------
export const sampleMeals = [
  {
    _id: 'meal-001',
    name: 'Grilled Chicken Shawarma Bowl',
    description: 'Tender marinated chicken with garlic sauce, pickled turnips, and seasoned rice.',
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600',
    prepTime: 25,
    caloriesPerServing: 520,
    pricePerServing: 65,
    cuisine: 'Mediterranean',
    dietaryTags: ['high-protein'],
    allergens: ['dairy'],
  },
  {
    _id: 'meal-002',
    name: 'Egyptian Koshari',
    description: 'Classic Egyptian comfort food with lentils, rice, pasta, and spicy tomato sauce.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
    prepTime: 35,
    caloriesPerServing: 480,
    pricePerServing: 45,
    cuisine: 'Egyptian',
    dietaryTags: ['vegetarian', 'vegan'],
    allergens: ['gluten'],
  },
  {
    _id: 'meal-003',
    name: 'Salmon & Asparagus',
    description: 'Pan-seared Atlantic salmon with roasted asparagus and lemon-dill sauce.',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
    prepTime: 20,
    caloriesPerServing: 410,
    pricePerServing: 95,
    cuisine: 'Healthy',
    dietaryTags: ['high-protein', 'gluten-free'],
    allergens: ['fish'],
  },
  {
    _id: 'meal-004',
    name: 'Creamy Mushroom Risotto',
    description: 'Arborio rice slowly cooked with porcini mushrooms, parmesan, and truffle oil.',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600',
    prepTime: 30,
    caloriesPerServing: 550,
    pricePerServing: 70,
    cuisine: 'Italian',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy', 'gluten'],
  },
  {
    _id: 'meal-005',
    name: 'Thai Basil Chicken Stir-Fry',
    description: 'Spicy chicken stir-fry with Thai basil, chili, garlic, and jasmine rice.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600',
    prepTime: 15,
    caloriesPerServing: 460,
    pricePerServing: 60,
    cuisine: 'Mediterranean',
    dietaryTags: ['high-protein', 'dairy-free'],
    allergens: ['soy'],
  },
  {
    _id: 'meal-006',
    name: 'Falafel Wrap with Tahini',
    description: 'Crispy baked falafel in warm pita with fresh veggies and creamy tahini sauce.',
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600',
    prepTime: 20,
    caloriesPerServing: 390,
    pricePerServing: 50,
    cuisine: 'Egyptian',
    dietaryTags: ['vegetarian', 'vegan'],
    allergens: ['gluten', 'sesame'],
  },
  {
    _id: 'meal-007',
    name: 'Grilled Steak & Sweet Potato',
    description: 'Juicy grilled sirloin steak with roasted sweet potato wedges and chimichurri.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    prepTime: 25,
    caloriesPerServing: 620,
    pricePerServing: 110,
    cuisine: 'Healthy',
    dietaryTags: ['high-protein', 'gluten-free', 'dairy-free'],
    allergens: [],
  },
  {
    _id: 'meal-008',
    name: 'Margherita Pizza Kit',
    description: 'Hand-stretch dough with San Marzano tomato sauce, fresh mozzarella, and basil.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    prepTime: 20,
    caloriesPerServing: 580,
    pricePerServing: 55,
    cuisine: 'Italian',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy', 'gluten'],
  },
  {
    _id: 'meal-009',
    name: 'Quinoa Buddha Bowl',
    description: 'Nutrient-packed bowl with quinoa, roasted chickpeas, avocado, and tahini dressing.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
    prepTime: 15,
    caloriesPerServing: 380,
    pricePerServing: 60,
    cuisine: 'Healthy',
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    allergens: ['sesame'],
  },
  {
    _id: 'meal-010',
    name: 'Chicken Molokhia',
    description: 'Traditional Egyptian molokhia stew with tender chicken, served over white rice.',
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600',
    prepTime: 40,
    caloriesPerServing: 440,
    pricePerServing: 55,
    cuisine: 'Egyptian',
    dietaryTags: ['high-protein', 'gluten-free'],
    allergens: [],
  },
];

// Helper: build pricing options from a list of meal IDs
function buildPricingOptions(mealIds) {
  const meals = mealIds.map(id => sampleMeals.find(m => m._id === id)).filter(Boolean);
  const servingSizes = [1, 2, 4, 6];
  const result = {};
  servingSizes.forEach(s => {
    const totalPrice = meals.reduce((sum, m) => sum + m.pricePerServing * s, 0);
    const totalCalories = meals.reduce((sum, m) => sum + m.caloriesPerServing * s, 0);
    result[s] = {
      pricePerServing: meals.reduce((sum, m) => sum + m.pricePerServing, 0) / meals.length,
      totalPrice,
      totalCalories,
      mealDetails: meals.map(m => ({
        _id: m._id,
        name: m.name,
        description: m.description,
        image: m.image,
        prepTime: m.prepTime,
        caloriesPerServing: m.caloriesPerServing,
        pricePerServing: m.pricePerServing,
        dietaryTags: m.dietaryTags,
        allergens: m.allergens,
      })),
    };
  });
  return result;
}

// ---------- SAMPLE BOXES ----------
export const sampleBoxes = [
  {
    _id: 'box-001',
    name: 'Mediterranean Feast',
    description: 'A vibrant collection of Mediterranean-inspired meals — grilled chicken, fresh wraps, and hearty risotto.',
    category: 'Mediterranean',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    mealsCount: 3,
    availableServings: [1, 2, 4, 6],
    featured: true,
    startingPrice: 390,
    pricingOptions: buildPricingOptions(['meal-001', 'meal-005', 'meal-004']),
  },
  {
    _id: 'box-002',
    name: 'Egyptian Classics',
    description: 'Authentic Egyptian home-cooked favourites — Koshari, Molokhia, and crispy Falafel wraps.',
    category: 'Egyptian',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    mealsCount: 3,
    availableServings: [1, 2, 4, 6],
    featured: true,
    startingPrice: 300,
    pricingOptions: buildPricingOptions(['meal-002', 'meal-006', 'meal-010']),
  },
  {
    _id: 'box-003',
    name: 'Healthy Balance',
    description: 'Light, nutritious meals perfect for a balanced lifestyle — salmon, quinoa bowls, and lean steak.',
    category: 'Healthy',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    mealsCount: 3,
    availableServings: [1, 2, 4, 6],
    featured: true,
    startingPrice: 530,
    pricingOptions: buildPricingOptions(['meal-003', 'meal-007', 'meal-009']),
  },
  {
    _id: 'box-004',
    name: 'Italian Night',
    description: 'Bring Italy home with creamy risotto, hand-made pizza, and more Italian favourites.',
    category: 'Italian',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    mealsCount: 2,
    availableServings: [1, 2, 4],
    featured: false,
    startingPrice: 250,
    pricingOptions: buildPricingOptions(['meal-004', 'meal-008']),
  },
  {
    _id: 'box-005',
    name: 'Plant Power Box',
    description: 'Fully vegetarian meals packed with protein and flavour — falafel, quinoa, koshari, and mushroom risotto.',
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800',
    mealsCount: 4,
    availableServings: [1, 2, 4, 6],
    featured: false,
    startingPrice: 450,
    pricingOptions: buildPricingOptions(['meal-002', 'meal-004', 'meal-006', 'meal-009']),
  },
  {
    _id: 'box-006',
    name: 'High-Protein Pack',
    description: 'Fuel your body with protein-rich meals — shawarma, steak, salmon, and chicken molokhia.',
    category: 'High-Protein',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    mealsCount: 4,
    availableServings: [2, 4, 6],
    featured: false,
    startingPrice: 650,
    pricingOptions: buildPricingOptions(['meal-001', 'meal-003', 'meal-007', 'meal-010']),
  },
];

// ---------- HELPER: Calculate custom box price ----------
export function calculateCustomBoxPrice(mealQuantities, servingsPerMeal) {
  const entries = Object.entries(mealQuantities);
  const meals = entries
    .map(([id, qty]) => ({ meal: sampleMeals.find(m => m._id === id), qty }))
    .filter(({ meal }) => Boolean(meal));

  const totalPrice = meals.reduce(
    (sum, { meal, qty }) => sum + meal.pricePerServing * servingsPerMeal * qty, 0
  );
  const totalCalories = meals.reduce(
    (sum, { meal, qty }) => sum + meal.caloriesPerServing * servingsPerMeal * qty, 0
  );
  return {
    totalPrice,
    totalCalories,
    pricePerServing: meals.length
      ? totalPrice / meals.reduce((s, { qty }) => s + qty, 0) / servingsPerMeal
      : 0,
    mealsCount: meals.reduce((s, { qty }) => s + qty, 0),
  };
}

export const promoCodes = {
  'SAVE10': { discount: 0.10, label: '10% off' },
  'SAVE20': { discount: 0.20, label: '20% off' },
  'WELCOME': { discount: 0.15, label: '15% off' },
};