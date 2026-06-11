const Ingredient = require('../models/Ingredient');
const Box = require('../models/Box');

/**
 * Decrements stock quantity for all ingredients used by all meals in an order.
 * Calculates usage based on: recipe quantity * servingSize * box quantity.
 *
 * @param {Object} order - The populated or raw order object from database.
 */
const decrementIngredientsForOrder = async (order) => {
  try {
    if (!order || !order.items || !Array.isArray(order.items)) return;

    for (const item of order.items) {
      // Fetch the box and populate its meals
      const box = await Box.findById(item.box).populate({
        path: 'meals',
        populate: { path: 'ingredients.ingredient' },
      });
      if (!box) continue;

      const servingSize = item.servingSize || 2;
      const boxQty = item.quantity || 1;
      const totalMealServings = servingSize * boxQty;

      for (const meal of box.meals) {
        if (!meal.ingredients || !Array.isArray(meal.ingredients)) continue;
        
        for (const mealIng of meal.ingredients) {
          if (mealIng.ingredient) {
            const ingId = mealIng.ingredient._id || mealIng.ingredient;
            const quantityToUse = (mealIng.quantity || 0) * totalMealServings;

            // Decrement the ingredient's stockQuantity in the database
            await Ingredient.findByIdAndUpdate(ingId, {
              $inc: { stockQuantity: -quantityToUse },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to decrement ingredients for order:', err.message);
  }
};

module.exports = { decrementIngredientsForOrder };
