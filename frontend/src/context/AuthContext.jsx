import { createContext, useContext, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import i18next from 'i18next';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('boxify_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const persistUser = (userData, token) => {
    localStorage.setItem('boxify_token', token);
    localStorage.setItem('boxify_user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── LOGIN ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persistUser(data.user, data.token);
      toast.success(i18next.t('msg.welcomeBack', { name: data.user.name }));
      return data.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ──────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      persistUser(data.user, data.token);
      toast.success(i18next.t('msg.welcomeNew', { name: data.user.name }));
      return data.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── LOGOUT ───────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('boxify_token');
    localStorage.removeItem('boxify_user');
    setUser(null);
    toast.success(i18next.t('msg.loggedOut'));
  };

  // ── REFRESH USER ─────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const token = localStorage.getItem('boxify_token');
      persistUser(data.user, token);
      return data.user;
    } catch {
      logout();
    }
  };

  // ── UPDATE PROFILE ───────────────────────────────────────────────
  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', updates);
      const token = localStorage.getItem('boxify_token');
      persistUser(data.user, token);
      toast.success(i18next.t('msg.profileUpdated'));
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || i18next.t('msg.updateFailed');
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── UPDATE SETTINGS ──────────────────────────────────────────────
  // Persists user preferences to the database (emailNotifications, language, defaultServings)
  const updateSettings = async (updates) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/settings', updates);
      const token = localStorage.getItem('boxify_token');
      persistUser(data.user, token);
      toast.success(i18next.t('msg.settingsSaved'));
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || i18next.t('msg.updateFailed');
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── CHANGE PASSWORD ──────────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success(i18next.t('msg.passwordChanged'));
    } catch (err) {
      const msg = err.response?.data?.message || i18next.t('msg.passwordChangeFailed');
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE OAUTH ──────────────────────────────────────────────────
  // Redirects the browser to the backend which redirects to Google.
  // No Promise needed — this is a full page navigation, not an API call.
  const loginWithGoogle = () => {
    const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${backendURL}/api/auth/google`;
  };

  // ── FORGOT PASSWORD ───────────────────────────────────────────────
  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } finally {
      setLoading(false);
    }
  };

  // ── RESET PASSWORD ────────────────────────────────────────────────
  const resetPassword = async (token, password) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
    } finally {
      setLoading(false);
    }
  };

  // ── RESEND VERIFICATION ───────────────────────────────────────────
  const resendVerification = async (email) => {
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
    } finally {
      setLoading(false);
    }
  };

  // ── DELETE ACCOUNT ────────────────────────────────────────────────
  const deleteAccount = async () => {
    try {
      await api.delete('/auth/me');
    } catch { /* allow even if API fails */ }
    localStorage.removeItem('boxify_token');
    localStorage.removeItem('boxify_user');
    setUser(null);
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
      updateSettings,
      changePassword,
      forgotPassword,
      resetPassword,
      resendVerification,
      isAdmin: user?.role === 'admin',
      loginWithGoogle,
      deleteAccount,
      persistUser,
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
