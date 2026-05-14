import { createContext, useContext, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // On page load, try to restore the user from localStorage
  // This keeps the user logged in after a browser refresh
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('boxify_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // ── Helper: save user + token to state AND localStorage ──────────
  const persistUser = (userData, token) => {
    localStorage.setItem('boxify_token', token);
    localStorage.setItem('boxify_user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── LOGIN ─────────────────────────────────────────────────────────
  // Calls POST /api/auth/login
  // Backend returns: { _id, name, email, role, token }
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persistUser(data.user, data.token);          // data.user, not data
      toast.success(`Welcome back, ${data.user.name}!`);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ──────────────────────────────────────────────────────
  // Calls POST /api/auth/register
  // Backend returns: { _id, name, email, role, token }
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      persistUser(data.user, data.token);          // data.user, not data
      toast.success(`Welcome to Boxify, ${data.user.name}!`);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── LOGOUT ───────────────────────────────────────────────────────
  // No backend call needed — just clear the token from localStorage
  // Next request will get a 401 and the axios interceptor will redirect
  const logout = () => {
    localStorage.removeItem('boxify_token');
    localStorage.removeItem('boxify_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  // ── REFRESH USER ─────────────────────────────────────────────────
  // Calls GET /api/auth/me to get fresh user data from the database
  // Useful after updating profile so the navbar shows the new name
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const token = localStorage.getItem('boxify_token');
      persistUser(data.user, token);               // data.user, not data
      return data.user;
    } catch {
      logout();
    }
  };

  // ── UPDATE PROFILE ───────────────────────────────────────────────
  // Calls PUT /api/auth/profile
  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', updates);
      const token = localStorage.getItem('boxify_token');
      persistUser(data, token);
      toast.success('Profile updated!');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── CHANGE PASSWORD ──────────────────────────────────────────────
  // Calls PUT /api/auth/change-password
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Password change failed';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── OAUTH (still mock — no backend support yet) ───────────────────
  const loginWithGoogle = async () => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = { _id: 'google-' + Date.now(), name: 'Google User', email: 'google@gmail.com', role: 'customer' };
        persistUser(mockUser, 'google-mock-token-' + Date.now());
        toast.success('Logged in with Google');
        setLoading(false);
        resolve(mockUser);
      }, 1000);
    });
  };

  const loginWithFacebook = async () => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = { _id: 'facebook-' + Date.now(), name: 'Facebook User', email: 'fb@gmail.com', role: 'customer' };
        persistUser(mockUser, 'facebook-mock-token-' + Date.now());
        toast.success('Logged in with Facebook');
        setLoading(false);
        resolve(mockUser);
      }, 1000);
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      refreshUser,
      updateProfile,
      changePassword,
      isAdmin: user?.role === 'admin',
      loginWithGoogle,
      loginWithFacebook,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
