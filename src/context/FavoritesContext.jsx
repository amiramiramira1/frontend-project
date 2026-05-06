    import { createContext, useContext, useState, useEffect } from 'react';
    import { useAuth } from './AuthContext';

    const FavoritesContext = createContext();

    export function FavoritesProvider({ children }) {
    const { user } = useAuth();

    const [favorites, setFavorites] = useState(() => {
        try {
        return JSON.parse(localStorage.getItem('boxify_favorites')) || [];
        } catch {
        return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('boxify_favorites', JSON.stringify(favorites));
    }, [favorites]);

    // ✅ لما اليوزر يعمل logout امسح الـ favorites
    useEffect(() => {
        if (!user) {
        setFavorites([]);
        localStorage.removeItem('boxify_favorites');
        }
    }, [user]);

    const toggleFavorite = (boxId) => {
        setFavorites(prev =>
        prev.includes(boxId) ? prev.filter(id => id !== boxId) : [...prev, boxId]
        );
    };

    const isFavorite = (boxId) => favorites.includes(boxId);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, favoritesCount: favorites.length }}>
        {children}
        </FavoritesContext.Provider>
    );
    }

    export function useFavorites() {
    return useContext(FavoritesContext);
    }