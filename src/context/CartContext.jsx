import { createContext, useContext, useState } from 'react';
import { sampleBoxes, sampleMeals } from '../data/mockData';

const CartContext = createContext(null);

let _nextId = 1;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], cartTotal: 0 });
  const [loading, setLoading] = useState(false);

  const recalcTotal = (items) => items.reduce((s, i) => s + (i.totalPrice || 0), 0);

  const addToCart = async (payload) => {
    setLoading(true);
    try {
      let newItem;
      if (payload.type === 'pre-made-box') {
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
        };
      } else {
        // custom box
        const meals = payload.mealIds.map(id => sampleMeals.find(m => m._id === id)).filter(Boolean);
        const totalPrice = meals.reduce((s, m) => s + m.pricePerServing * payload.servingsPerMeal, 0);
        newItem = {
          _id: `cart-item-${_nextId++}`,
          type: 'custom-box',
          customBox: { name: payload.name || 'Custom Box' },
          mealsCount: meals.length,
          servingsPerMeal: payload.servingsPerMeal,
          quantity: 1,
          totalPrice,
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
        // recalc totalPrice based on quantity
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
