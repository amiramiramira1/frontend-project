import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Maps backend dietType values to display colors and emojis
const dietStyles = {
  'vegetarian': { color: 'bg-green-100 text-green-700', emoji: '🌱' },
  'vegan':      { color: 'bg-emerald-100 text-emerald-700', emoji: '🌿' },
  'keto':       { color: 'bg-purple-100 text-purple-700', emoji: '⚡' },
  'paleo':      { color: 'bg-amber-100 text-amber-700', emoji: '🥩' },
  'standard':   { color: 'bg-blue-100 text-blue-700', emoji: '🍽️' },
  'mixed':      { color: 'bg-gray-100 text-gray-700', emoji: '🔀' },
};

// Serving size price multipliers — same as backend
const MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

export default function BoxCard({ box }) {
  const { t } = useTranslation();
  const style = dietStyles[box.dietType];
  // Show starting price for 2 servings (most popular)
  const displayPrice = box.basePrice ? (box.basePrice * MULTIPLIERS[2]).toFixed(0) : null;
  const mealsCount = box.meals?.length ?? 0;

  return (
    <Link to={`/boxes/${box._id}`} className="block group">
      <div className="card overflow-hidden">
        {/* Box image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'}
            alt={box.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Diet type badge (top right) */}
          {style && (
            <div className="absolute top-3 right-3">
              <span className={`badge ${style.color}`}>{style.emoji} {t(`boxes.diet${box.dietType.charAt(0).toUpperCase() + box.dietType.slice(1)}`, box.dietType)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display font-bold text-lg text-gray-900 mb-1">{box.name}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{box.description}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{mealsCount} {mealsCount === 1 ? t('boxDetails.meal', 'meal') : t('boxDetails.meals', 'meals')}</span>
            {displayPrice && (
              <span className="text-sm font-bold text-brand-600">{t('boxDetails.from', 'from')} {displayPrice} {t('boxDetails.egp', 'EGP')}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}