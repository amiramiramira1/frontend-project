import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], cartTotal: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {}
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/cart/add', payload);
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId, updates) => {
    try {
      const { data } = await api.put(`/cart/item/${itemId}`, updates);
      setCart(data);
    } catch {}
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await api.delete(`/cart/item/${itemId}`);
      setCart(data);
    } catch {}
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ items: [], cartTotal: 0 });
    } catch {}
  };

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
