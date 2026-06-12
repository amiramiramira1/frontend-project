import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useFavorites } from '../../context/FavoritesContext';
import { Heart, ArrowRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/favorites')
      .then(({ data }) => setBoxes(data.favorites || []))
      .catch(() => setBoxes([]))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (boxId) => {
    await toggleFavorite(boxId);
    setBoxes(prev => prev.filter(b => b._id !== boxId));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-56" />
        ))}
      </div>
    );
  }

  if (boxes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">{t('dash.noFavorites', 'No favorites yet')}</h2>
        <p className="text-gray-500 mb-6">{t('dash.noFavoritesDesc', 'Browse our boxes and tap the heart to save your favorites')}</p>
        <Link to="/boxes" className="btn-primary inline-flex items-center gap-2">
          {t('dash.browseBoxes', 'Browse Boxes')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
        {t('dash.favoritesCount', 'My Favorites ({{count}})', { count: boxes.length })}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boxes.map(box => (
          <div key={box._id} className="card overflow-hidden group hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="relative h-40 bg-gray-100">
              {box.image ? (
                <img src={box.image} alt={box.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
              )}
              {/* Heart button */}
              <button
                onClick={(e) => { e.preventDefault(); handleToggle(box._id); }}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </button>
              {/* Diet badge */}
              {box.dietType && (
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700 capitalize">
                  {box.dietType}
                </span>
              )}
            </div>
            {/* Info */}
            <div className="p-4">
              <h3 className="font-display font-bold text-gray-900 mb-1 truncate">{box.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-brand-600 font-bold">{box.basePrice?.toLocaleString()} EGP</span>
                <Link
                  to={`/boxes/${box._id}`}
                  className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
                >
                  {t('dash.view', 'View')} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
