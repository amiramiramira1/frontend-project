import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import i18next from 'i18next';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // CartProvider is inside AuthProvider so this is safe
  const [cart, setCart] = useState({ items: [], cartTotal: 0 });
  const [loading, setLoading] = useState(false);

  // ── Auto-fetch cart whenever user logs in or out ──────────────────
  // When user logs in  → fetch their real cart from the DB
  // When user logs out → reset to empty (axios interceptor already clears token)
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [], cartTotal: 0 });
    }
  }, [user]); // Runs every time user object changes

  // ── GET /api/cart ─────────────────────────────────────────────────
  // Returns { cart: { items: [...], cartTotal } }
  // Each item: { _id, box: { _id, name, image, basePrice }, servingSize, quantity, pricePerItem }
  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data?.cart || { items: [], cartTotal: 0 });
    } catch {
      // 401 = not logged in, ignore silently
      setCart({ items: [], cartTotal: 0 });
    }
  };

  // ── POST /api/cart/items ──────────────────────────────────────────
  // Request: { boxId, servingSize, quantity }
  // Note: frontend uses "servingsPerMeal", backend uses "servingSize" — we map here
  const addToCart = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/cart/items', {
        boxId:       payload.boxId,
        servingSize: payload.servingsPerMeal, // map old name → backend name
        quantity:    payload.quantity || 1,
      });
      setCart(data?.cart || { items: [], cartTotal: 0 });
      return data?.cart || { items: [], cartTotal: 0 };
    } catch (err) {
      const msg = err.response?.data?.message || i18next.t('msg.addToCartFailed');
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── PUT /api/cart/items/:itemId ───────────────────────────────────
  // Request: { quantity } or { servingSize } or both
  // The backend recalculates pricePerItem if servingSize changes
  const updateItem = async (itemId, updates) => {
    setLoading(true);
    try {
      const { data } = await api.put(`/cart/items/${itemId}`, updates);
      setCart(data?.cart || { items: [], cartTotal: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || i18next.t('msg.updateCartFailed'));
    } finally {
      setLoading(false);
    }
  };

  // ── DELETE /api/cart/items/:itemId ────────────────────────────────
  const removeItem = async (itemId) => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/cart/items/${itemId}`);
      setCart(data?.cart || { items: [], cartTotal: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || i18next.t('msg.removeItemFailed'));
    } finally {
      setLoading(false);
    }
  };

  // ── DELETE /api/cart ──────────────────────────────────────────────
  const clearCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.delete('/cart');
      setCart(data?.cart || { items: [], cartTotal: 0 });
    } catch (err) {
      toast.error(i18next.t('msg.clearCartFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Total number of items (sum of quantities) — used by Navbar badge
  const itemCount = cart?.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;

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