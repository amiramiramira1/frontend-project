import { createContext, useContext, useState, useEffect } from 'react';
import { sampleBoxes, sampleMeals } from '../data/mockData';

const CartContext = createContext(null);

let _nextId = Date.now();

export const CartProvider = ({ children }) => {

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('boxify_cart');
    return saved ? JSON.parse(saved) : { items: [], cartTotal: 0 };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('boxify_cart', JSON.stringify(cart));
  }, [cart]);

  const recalcTotal = (items) => items.reduce((s, i) => s + (i.totalPrice || 0), 0);

  const addToCart = async (payload) => {
    setLoading(true);
    try {
      let newItem;

      if (payload.type === 'pre-made-box') {
        // ── Pre-made box: unchanged ──────────────────────────────
        const box = sampleBoxes.find(b => b._id === payload.boxId);
        const pricing = box?.pricingOptions?.[payload.servingsPerMeal];
        newItem = {
          _id: `cart-item-${_nextId++}`,
          type: 'pre-made-box',
          boxId: payload.boxId,
          boxName: box?.name || 'Meal Box',
          mealsCount: box?.mealsCount || 0,
          servingsPerMeal: payload.servingsPerMeal,
          quantity: 1,
          totalPrice: pricing?.totalPrice || 0,
          meals: pricing?.mealDetails || [],
        };

      } else {
        // ── Custom box: now supports quantities ──────────────────
        // payload.mealQuantities = { 'meal-001': 2, 'meal-003': 1 }

        const quantities = payload.mealQuantities || {};

        // Convert { 'meal-001': 2 } → [mealObj, mealObj]
        // (repeated entries so CartPage can display them individually)
        const meals = Object.entries(quantities).flatMap(([id, qty]) => {
          const meal = sampleMeals.find(m => m._id === id);
          return meal ? Array(qty).fill(meal) : [];
        });

        // Price = sum of (pricePerServing × servings × qty) for each meal
        const totalPrice = Object.entries(quantities).reduce((sum, [id, qty]) => {
          const meal = sampleMeals.find(m => m._id === id);
          return sum + (meal ? meal.pricePerServing * payload.servingsPerMeal * qty : 0);
        }, 0);

        newItem = {
          _id: `cart-item-${_nextId++}`,
          type: 'custom-box',
          customBox: { name: payload.name || 'Custom Box' },
          mealQuantities: quantities,          // store for future edits
          mealsCount: meals.length,            // total slots (e.g. 2+1 = 3)
          servingsPerMeal: payload.servingsPerMeal,
          quantity: 1,
          totalPrice,
          meals,                               // flat array for CartPage display
        };
      }

      setCart(prev => {
        const items = [...prev.items, newItem];
        return { items, cartTotal: recalcTotal(items) };
      });
      return newItem;

    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId, updates) => {
    setCart(prev => {
      const items = prev.items.map(i => {
        if (i._id !== itemId) return i;
        const updated = { ...i, ...updates };
        if (updates.quantity) {
          const basePrice = i.totalPrice / (i.quantity || 1);
          updated.totalPrice = basePrice * updates.quantity;
        }
        return updated;
      });
      return { items, cartTotal: recalcTotal(items) };
    });
  };

  const removeItem = async (itemId) => {
    setCart(prev => {
      const items = prev.items.filter(i => i._id !== itemId);
      return { items, cartTotal: recalcTotal(items) };
    });
  };

  const clearCart = async () => {
    setCart({ items: [], cartTotal: 0 });
    localStorage.removeItem('boxify_cart');
  };

  const fetchCart = async () => {};

  const itemCount = cart.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;

  return (
    <CartContext.Provider value={{ cart, addToCart, updateItem, removeItem, clearCart, fetchCart, loading, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};