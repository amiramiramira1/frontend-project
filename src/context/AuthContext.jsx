import { createContext, useContext, useState } from 'react';
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
      // Mock login — accepts any credentials
      const mockUser = {
        _id: 'mock-user-001',
        name: email.split('@')[0] || 'Demo User',
        email,
        role: email.includes('admin') ? 'admin' : 'user',
        token: 'mock-jwt-token-' + Date.now(),
      };
      localStorage.setItem('boxify_token', mockUser.token);
      localStorage.setItem('boxify_user', JSON.stringify(mockUser));
      setUser(mockUser);
      toast.success(`Welcome back, ${mockUser.name}!`);
      return mockUser;
    } catch (err) {
      toast.error('Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      // Mock register — creates user locally
      const mockUser = {
        _id: 'mock-user-' + Date.now(),
        name,
        email,
        role: 'user',
        token: 'mock-jwt-token-' + Date.now(),
      };
      localStorage.setItem('boxify_token', mockUser.token);
      localStorage.setItem('boxify_user', JSON.stringify(mockUser));
      setUser(mockUser);
      toast.success(`Welcome to Boxify, ${mockUser.name}!`);
      return mockUser;
    } catch (err) {
      toast.error('Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('boxify_token');
    localStorage.removeItem('boxify_user');
    setUser(null);
  };  

   const deleteAccount = () => {
    // mock delete (no backend)
    logout();
    toast.success('Account deleted successfully');
   };

  const loginWithGoogle = async () => {
  setLoading(true);
  try {
    const mockUser = {
      _id: 'google-user-' + Date.now(),
      name: 'Google User',
      email: 'googleuser@example.com',
      role: 'user',
      token: 'mock-google-token-' + Date.now(),
    };

    localStorage.setItem('boxify_token', mockUser.token);
    localStorage.setItem('boxify_user', JSON.stringify(mockUser));
    setUser(mockUser);

    toast.success(`Welcome via Google, ${mockUser.name}!`);
    return mockUser;
  } finally {
    setLoading(false);
  }
};

const loginWithFacebook = async () => {
  setLoading(true);
  try {
    const mockUser = {
      _id: 'facebook-user-' + Date.now(),
      name: 'Facebook User',
      email: 'facebookuser@example.com',
      role: 'user',
      token: 'mock-facebook-token-' + Date.now(),
    };

    localStorage.setItem('boxify_token', mockUser.token);
    localStorage.setItem('boxify_user', JSON.stringify(mockUser));
    setUser(mockUser);

    toast.success(`Welcome via Facebook, ${mockUser.name}!`);
    return mockUser;
  } finally {
    setLoading(false);
  }
};

  const refreshUser = async () => {
    // No-op in mock mode
  };

  return (
<AuthContext.Provider value={{
  user,
  login,
  register,
  logout,
  deleteAccount,
  loginWithGoogle,
  loginWithFacebook,
  loading,
  refreshUser,
  isAdmin: user?.role === 'admin'
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
