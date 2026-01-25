import boxClassic from '@/assets/box-classic.jpg';
import boxVegan from '@/assets/box-vegan.jpg';
import boxKeto from '@/assets/box-keto.jpg';
import boxMediterranean from '@/assets/box-mediterranean.jpg';
import boxAsian from '@/assets/box-asian.jpg';
import boxProtein from '@/assets/box-protein.jpg';
import type { MealData } from '@/components/MealCard';

export interface BoxData {
  id: number;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  tag: string | null;
  dietType: string[];
  mealsPerWeek: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: MealData[];
  customerReviews: {
    id: number;
    name: string;
    rating: number;
    date: string;
    comment: string;
    avatar: string;
  }[];
}

export const boxesData: BoxData[] = [
  {
    id: 1,
    slug: 'classic-balance',
    name: 'Classic Balance',
    description: 'Perfectly balanced meals with lean proteins, whole grains, and fresh vegetables.',
    longDescription: 'Our Classic Balance box is designed for those who want nutritious, well-rounded meals without any extreme dietary restrictions. Each meal features lean proteins like chicken, fish, or turkey paired with complex carbohydrates and a rainbow of vegetables. Perfect for maintaining a healthy lifestyle.',
    price: 12.99,
    rating: 4.9,
    reviews: 248,
    image: boxClassic,
    tag: 'Best Seller',
    dietType: ['Balanced', 'High Protein'],
    mealsPerWeek: 5,
    nutrition: {
      calories: 550,
      protein: 35,
      carbs: 45,
      fat: 18,
    },
    meals: [
      { id: 1, name: 'Grilled Chicken Quinoa Bowl', image: boxClassic, ingredients: ['Chicken breast', 'Quinoa', 'Roasted vegetables', 'Herb sauce'], calories: 520, tags: ['High Protein', 'Gluten-Free'] },
      { id: 2, name: 'Salmon with Brown Rice', image: boxMediterranean, ingredients: ['Atlantic salmon', 'Brown rice', 'Asparagus', 'Lemon dill sauce'], calories: 580, tags: ['High Protein', 'Dairy-Free'] },
      { id: 3, name: 'Turkey Meatballs & Pasta', image: boxClassic, ingredients: ['Turkey meatballs', 'Whole wheat pasta', 'Marinara sauce', 'Parmesan'], calories: 540, tags: ['High Protein'] },
      { id: 4, name: 'Beef Stir Fry', image: boxAsian, ingredients: ['Lean beef', 'Mixed vegetables', 'Jasmine rice', 'Teriyaki glaze'], calories: 560, tags: ['High Protein', 'Dairy-Free'] },
      { id: 5, name: 'Herb Crusted Cod', image: boxMediterranean, ingredients: ['Atlantic cod', 'Sweet potato', 'Green beans', 'Herb crust'], calories: 490, tags: ['High Protein', 'Gluten-Free'] },
    ],
    customerReviews: [
      { id: 1, name: 'Sarah M.', rating: 5, date: '2 weeks ago', comment: 'The variety is amazing! Each meal feels like a restaurant experience.', avatar: 'SM' },
      { id: 2, name: 'Mike R.', rating: 5, date: '1 month ago', comment: 'Perfect portions and the taste is incredible. Highly recommend!', avatar: 'MR' },
      { id: 3, name: 'Jennifer L.', rating: 4, date: '1 month ago', comment: 'Great quality ingredients. Would love more fish options.', avatar: 'JL' },
    ],
  },
  {
    id: 2,
    slug: 'plant-power',
    name: 'Plant Power',
    description: '100% vegan meals packed with plant-based proteins and vibrant vegetables.',
    longDescription: 'Discover the delicious world of plant-based eating with our Plant Power box. Every meal is crafted to provide complete nutrition through legumes, tofu, tempeh, and a variety of vegetables. Rich in fiber and antioxidants, these meals prove that vegan food can be satisfying and flavorful.',
    price: 11.99,
    rating: 4.8,
    reviews: 186,
    image: boxVegan,
    tag: 'Vegan',
    dietType: ['Vegan', 'Vegetarian'],
    mealsPerWeek: 5,
    nutrition: {
      calories: 480,
      protein: 22,
      carbs: 55,
      fat: 16,
    },
    meals: [
      { id: 1, name: 'Buddha Bowl', image: boxVegan, ingredients: ['Chickpeas', 'Quinoa', 'Roasted sweet potato', 'Tahini dressing'], calories: 460, tags: ['Vegan', 'Gluten-Free'] },
      { id: 2, name: 'Tofu Teriyaki Stir Fry', image: boxAsian, ingredients: ['Organic tofu', 'Broccoli', 'Brown rice', 'Teriyaki sauce'], calories: 420, tags: ['Vegan', 'Dairy-Free'] },
      { id: 3, name: 'Lentil Curry', image: boxVegan, ingredients: ['Red lentils', 'Coconut milk', 'Basmati rice', 'Naan bread'], calories: 510, tags: ['Vegan', 'Vegetarian'] },
      { id: 4, name: 'Mediterranean Falafel Plate', image: boxMediterranean, ingredients: ['Falafel', 'Hummus', 'Tabbouleh', 'Pita bread'], calories: 480, tags: ['Vegan', 'Vegetarian'] },
      { id: 5, name: 'Black Bean Burrito Bowl', image: boxVegan, ingredients: ['Black beans', 'Cilantro lime rice', 'Guacamole', 'Salsa'], calories: 520, tags: ['Vegan', 'Gluten-Free'] },
    ],
    customerReviews: [
      { id: 1, name: 'Emily T.', rating: 5, date: '1 week ago', comment: 'Finally, vegan meals that actually taste amazing! So filling.', avatar: 'ET' },
      { id: 2, name: 'David K.', rating: 5, date: '3 weeks ago', comment: 'Even my non-vegan partner loves these meals!', avatar: 'DK' },
      { id: 3, name: 'Rachel G.', rating: 4, date: '1 month ago', comment: 'Great variety and flavors. The lentil curry is a favorite.', avatar: 'RG' },
    ],
  },
  {
    id: 3,
    slug: 'keto-fuel',
    name: 'Keto Fuel',
    description: 'Low-carb, high-fat meals designed to keep you in ketosis and energized.',
    longDescription: 'Stay in ketosis with our carefully crafted Keto Fuel box. Each meal contains less than 10g net carbs while delivering satisfying fats and proteins. From cauliflower crust pizzas to zucchini noodle dishes, we make keto eating convenient and delicious.',
    price: 14.99,
    rating: 4.7,
    reviews: 142,
    image: boxKeto,
    tag: 'Low Carb',
    dietType: ['Keto', 'Low Carb'],
    mealsPerWeek: 5,
    nutrition: {
      calories: 620,
      protein: 38,
      carbs: 8,
      fat: 48,
    },
    meals: [
      { id: 1, name: 'Bacon Wrapped Chicken', image: boxKeto, ingredients: ['Chicken thigh', 'Bacon', 'Creamy spinach', 'Cauliflower mash'], calories: 650, tags: ['Keto', 'Gluten-Free'] },
      { id: 2, name: 'Salmon with Avocado Salsa', image: boxMediterranean, ingredients: ['Wild salmon', 'Avocado', 'Cherry tomatoes', 'Olive oil'], calories: 580, tags: ['Keto', 'Dairy-Free'] },
      { id: 3, name: 'Beef Zucchini Lasagna', image: boxKeto, ingredients: ['Ground beef', 'Zucchini noodles', 'Ricotta', 'Marinara'], calories: 620, tags: ['Keto', 'Low Carb'] },
      { id: 4, name: 'Shrimp Alfredo Zoodles', image: boxKeto, ingredients: ['Jumbo shrimp', 'Zucchini noodles', 'Alfredo sauce', 'Parmesan'], calories: 540, tags: ['Keto', 'Low Carb'] },
      { id: 5, name: 'Pork Chops with Broccoli', image: boxKeto, ingredients: ['Bone-in pork chop', 'Roasted broccoli', 'Butter sauce', 'Herbs'], calories: 680, tags: ['Keto', 'Gluten-Free'] },
    ],
    customerReviews: [
      { id: 1, name: 'Tom B.', rating: 5, date: '1 week ago', comment: 'Lost 15 lbs in 2 months! These meals make keto so easy.', avatar: 'TB' },
      { id: 2, name: 'Lisa P.', rating: 4, date: '2 weeks ago', comment: 'Delicious and keeps me full. Wish there were more seafood options.', avatar: 'LP' },
      { id: 3, name: 'Chris W.', rating: 5, date: '1 month ago', comment: 'Best keto meal service I\'ve tried. The bacon chicken is incredible.', avatar: 'CW' },
    ],
  },
  {
    id: 4,
    slug: 'mediterranean',
    name: 'Mediterranean',
    description: 'Heart-healthy flavors inspired by the Mediterranean diet tradition.',
    longDescription: 'Transport your taste buds to the Mediterranean with our heart-healthy meal box. Featuring olive oil, fresh herbs, seafood, and lean meats, these meals are inspired by one of the world\'s healthiest diets. Rich in omega-3s and antioxidants.',
    price: 13.99,
    rating: 4.9,
    reviews: 167,
    image: boxMediterranean,
    tag: 'Popular',
    dietType: ['Mediterranean', 'Heart Healthy'],
    mealsPerWeek: 5,
    nutrition: {
      calories: 520,
      protein: 32,
      carbs: 42,
      fat: 22,
    },
    meals: [
      { id: 1, name: 'Greek Chicken Souvlaki', image: boxMediterranean, ingredients: ['Marinated chicken', 'Tzatziki', 'Greek salad', 'Pita bread'], calories: 530, tags: ['High Protein'] },
      { id: 2, name: 'Grilled Sea Bass', image: boxMediterranean, ingredients: ['Sea bass fillet', 'Roasted vegetables', 'Olive tapenade', 'Lemon'], calories: 480, tags: ['Gluten-Free', 'Dairy-Free'] },
      { id: 3, name: 'Lamb Kofta Plate', image: boxMediterranean, ingredients: ['Lamb kofta', 'Couscous', 'Hummus', 'Fresh herbs'], calories: 560, tags: ['High Protein'] },
      { id: 4, name: 'Shrimp Paella', image: boxMediterranean, ingredients: ['Jumbo shrimp', 'Saffron rice', 'Bell peppers', 'Peas'], calories: 520, tags: ['Gluten-Free'] },
      { id: 5, name: 'Stuffed Bell Peppers', image: boxVegan, ingredients: ['Bell peppers', 'Ground turkey', 'Rice', 'Feta cheese'], calories: 490, tags: ['Gluten-Free'] },
    ],
    customerReviews: [
      { id: 1, name: 'Anna S.', rating: 5, date: '5 days ago', comment: 'The flavors transport me to Greece! Absolutely love it.', avatar: 'AS' },
      { id: 2, name: 'George M.', rating: 5, date: '2 weeks ago', comment: 'Heart-healthy and delicious. My doctor is impressed!', avatar: 'GM' },
      { id: 3, name: 'Maria C.', rating: 5, date: '3 weeks ago', comment: 'Perfect balance of flavors. The lamb kofta is to die for.', avatar: 'MC' },
    ],
  },
  {
    id: 5,
    slug: 'asian-fusion',
    name: 'Asian Fusion',
    description: 'Bold Asian flavors with teriyaki, sesame, and fresh stir-fried vegetables.',
    longDescription: 'Experience the bold, umami-rich flavors of Asia with our fusion box. From Japanese teriyaki to Thai curry, each meal brings authentic Asian cuisine to your table. Fresh vegetables, aromatic spices, and perfectly balanced sauces make every bite memorable.',
    price: 12.99,
    rating: 4.8,
    reviews: 134,
    image: boxAsian,
    tag: null,
    dietType: ['Asian', 'Balanced'],
    mealsPerWeek: 5,
    nutrition: {
      calories: 510,
      protein: 28,
      carbs: 52,
      fat: 18,
    },
    meals: [
      { id: 1, name: 'Teriyaki Chicken Bowl', image: boxAsian, ingredients: ['Teriyaki chicken', 'Steamed rice', 'Edamame', 'Pickled ginger'], calories: 520, tags: ['Dairy-Free'] },
      { id: 2, name: 'Thai Basil Beef', image: boxAsian, ingredients: ['Ground beef', 'Thai basil', 'Jasmine rice', 'Chili sauce'], calories: 540, tags: ['Dairy-Free', 'High Protein'] },
      { id: 3, name: 'Salmon Poke Bowl', image: boxAsian, ingredients: ['Sushi-grade salmon', 'Sushi rice', 'Avocado', 'Sesame seeds'], calories: 480, tags: ['Gluten-Free', 'High Protein'] },
      { id: 4, name: 'Korean BBQ Pork', image: boxAsian, ingredients: ['BBQ pork belly', 'Kimchi', 'Steamed rice', 'Pickled vegetables'], calories: 580, tags: ['Dairy-Free'] },
      { id: 5, name: 'Pad Thai Shrimp', image: boxAsian, ingredients: ['Tiger shrimp', 'Rice noodles', 'Peanuts', 'Tamarind sauce'], calories: 490, tags: ['Gluten-Free'] },
    ],
    customerReviews: [
      { id: 1, name: 'Kevin L.', rating: 5, date: '1 week ago', comment: 'Better than takeout! The Korean BBQ is restaurant quality.', avatar: 'KL' },
      { id: 2, name: 'Nancy T.', rating: 4, date: '2 weeks ago', comment: 'Love the variety of Asian cuisines. Pad Thai is my favorite.', avatar: 'NT' },
      { id: 3, name: 'James Y.', rating: 5, date: '1 month ago', comment: 'Authentic flavors. Finally a meal kit that gets Asian food right!', avatar: 'JY' },
    ],
  },
  {
    id: 6,
    slug: 'protein-plus',
    name: 'Protein Plus',
    description: 'High-protein meals perfect for muscle building and active lifestyles.',
    longDescription: 'Fuel your fitness goals with our Protein Plus box. Each meal delivers 40+ grams of protein from quality sources like grass-fed beef, free-range chicken, and wild-caught fish. Designed for athletes, bodybuilders, and anyone looking to increase their protein intake.',
    price: 15.99,
    rating: 4.9,
    reviews: 198,
    image: boxProtein,
    tag: 'High Protein',
    dietType: ['High Protein', 'Athletic'],
    mealsPerWeek: 5,
    nutrition: {
      calories: 650,
      protein: 48,
      carbs: 35,
      fat: 28,
    },
    meals: [
      { id: 1, name: 'Double Chicken Breast', image: boxProtein, ingredients: ['Grilled chicken breast', 'Sweet potato', 'Steamed broccoli', 'Herb butter'], calories: 620, tags: ['High Protein', 'Gluten-Free'] },
      { id: 2, name: 'Grass-Fed Steak', image: boxProtein, ingredients: ['Ribeye steak', 'Roasted potatoes', 'Asparagus', 'Chimichurri'], calories: 720, tags: ['High Protein', 'Gluten-Free'] },
      { id: 3, name: 'Tuna Power Bowl', image: boxProtein, ingredients: ['Seared ahi tuna', 'Brown rice', 'Avocado', 'Sesame dressing'], calories: 580, tags: ['High Protein', 'Dairy-Free'] },
      { id: 4, name: 'Turkey & Egg White Scramble', image: boxProtein, ingredients: ['Ground turkey', 'Egg whites', 'Vegetables', 'Whole grain toast'], calories: 540, tags: ['High Protein'] },
      { id: 5, name: 'Bison Burger Lettuce Wrap', image: boxProtein, ingredients: ['Ground bison', 'Butter lettuce', 'Avocado', 'Special sauce'], calories: 580, tags: ['High Protein', 'Low Carb', 'Gluten-Free'] },
    ],
    customerReviews: [
      { id: 1, name: 'Ryan F.', rating: 5, date: '3 days ago', comment: 'Perfect for my bodybuilding prep. Great macros and taste!', avatar: 'RF' },
      { id: 2, name: 'Jessica H.', rating: 5, date: '2 weeks ago', comment: 'Finally hitting my protein goals without cooking all day.', avatar: 'JH' },
      { id: 3, name: 'Brandon D.', rating: 5, date: '1 month ago', comment: 'The steak quality is amazing. Worth every penny.', avatar: 'BD' },
    ],
  },
];

export const dietTypes = [
  'All',
  'Balanced',
  'Vegan',
  'Vegetarian',
  'Keto',
  'Low Carb',
  'High Protein',
  'Mediterranean',
  'Asian',
];

export const priceRanges = [
  { label: 'All Prices', min: 0, max: 100 },
  { label: 'Under $12/meal', min: 0, max: 12 },
  { label: '$12 - $14/meal', min: 12, max: 14 },
  { label: '$14+/meal', min: 14, max: 100 },
];

export const mealsPerWeekOptions = [
  { label: 'Any', value: 0 },
  { label: '3 meals', value: 3 },
  { label: '5 meals', value: 5 },
  { label: '7 meals', value: 7 },
];
