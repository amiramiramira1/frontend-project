import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch favorites from backend when user is logged in
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    api.get('/favorites')
      .then(({ data }) => {
        // Store just the IDs for quick lookups; the full objects are available via getFavorites
        const ids = (data.favorites || []).map(f => f._id || f);
        setFavorites(ids);
      })
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleFavorite = useCallback(async (boxId) => {
    if (!user) return; // Must be logged in

    // Optimistic update
    setFavorites(prev =>
      prev.includes(boxId) ? prev.filter(id => id !== boxId) : [...prev, boxId]
    );

    try {
      const { data } = await api.post(`/favorites/${boxId}`);
      setFavorites(data.favorites || []);
    } catch {
      // Revert on error — re-fetch to be safe
      try {
        const { data } = await api.get('/favorites');
        setFavorites((data.favorites || []).map(f => f._id || f));
      } catch { /* ignore */ }
    }
  }, [user]);

  const isFavorite = useCallback((boxId) => favorites.includes(boxId), [favorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      favoritesCount: favorites.length,
      loading,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}