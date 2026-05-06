import { Link } from 'react-router-dom';
import { Users, ChefHat, ArrowRight, Heart, GitCompare } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const dietTags = {
  'vegetarian': { color: 'bg-green-100 text-green-700', label: '🌱 Vegetarian' },
  'vegan': { color: 'bg-emerald-100 text-emerald-700', label: '🌿 Vegan' },
  'gluten-free': { color: 'bg-yellow-100 text-yellow-700', label: '🌾 Gluten-Free' },
  'dairy-free': { color: 'bg-blue-100 text-blue-700', label: '🥛 Dairy-Free' },
  'high-protein': { color: 'bg-red-100 text-red-700', label: '💪 High-Protein' },
};

export default function BoxCard({ box, compareList = [], onCompareToggle }) {
  const displayPrice = box.startingPrice || 0;
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const favorited = isFavorite(box._id);
  const isComparing = compareList.includes(box._id);

  const handleFavorite = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to save favorites');
      return;
    }
    toggleFavorite(box._id);
    toast.success(favorited ? 'Removed from favorites' : 'Added to favorites! ❤️');
  };

  const handleCompare = (e) => {
    e.preventDefault();
    if (onCompareToggle) onCompareToggle(box._id);
  };

  return (
    <div className={`card group overflow-hidden hover:-translate-y-1 transition-all duration-300 ${isComparing ? 'ring-2 ring-brand-500' : ''}`}>
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'}
          alt={box.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {box.featured && (
          <div className="absolute top-3 left-3">
            <span className="badge bg-brand-500 text-white">⭐ Featured</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="badge bg-white/90 text-gray-700 backdrop-blur-sm">{box.category}</span>
        </div>
        {/* Heart Button */}
        <button
          onClick={handleFavorite}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            favorited
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-gray-400 hover:text-red-500 hover:scale-110'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-1">{box.name}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{box.description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-brand-500" />
            {box.mealsCount} Meals
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-500" />
            {box.availableServings?.join(', ')} people
          </span>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">Starting from</p>
            <p className="text-2xl font-display font-black text-brand-600">
              {displayPrice.toLocaleString()} <span className="text-base font-medium">EGP</span>
            </p>
            <p className="text-xs text-gray-400">for 2 people</p>
          </div>
          <Link to={`/boxes/${box._id}`} className="btn-primary !py-2.5 !px-5 text-sm flex items-center gap-1.5">
            View Box <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ✅ Compare Button */}
        {onCompareToggle && (
          <button
            onClick={handleCompare}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all ${
              isComparing
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-500'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            {isComparing ? 'Added to Compare ✓' : 'Add to Compare'}
          </button>
        )}
      </div>
    </div>
  );
}