import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('boxify_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('boxify_token', data.token);
      localStorage.setItem('boxify_user', JSON.stringify(data));
      setUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('boxify_token', data.token);
      localStorage.setItem('boxify_user', JSON.stringify(data));
      setUser(data);
      toast.success(`Welcome to Boxify, ${data.name}!`);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('boxify_token');
    localStorage.removeItem('boxify_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(prev => ({ ...prev, ...data }));
      localStorage.setItem('boxify_user', JSON.stringify({ ...user, ...data }));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
