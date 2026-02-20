import { Link } from 'react-router-dom';
import { Clock, Users, ChefHat, ArrowRight, Zap } from 'lucide-react';

const dietTags = {
  'vegetarian': { color: 'bg-green-100 text-green-700', label: '🌱 Vegetarian' },
  'vegan': { color: 'bg-emerald-100 text-emerald-700', label: '🌿 Vegan' },
  'gluten-free': { color: 'bg-yellow-100 text-yellow-700', label: '🌾 Gluten-Free' },
  'dairy-free': { color: 'bg-blue-100 text-blue-700', label: '🥛 Dairy-Free' },
  'high-protein': { color: 'bg-red-100 text-red-700', label: '💪 High-Protein' },
};

export default function BoxCard({ box }) {
  const displayPrice = box.startingPrice || 0;

  return (
    <div className="card group overflow-hidden hover:-translate-y-1 transition-all duration-300">
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
        <div className="absolute top-3 right-3">
          <span className="badge bg-white/90 text-gray-700 backdrop-blur-sm">{box.category}</span>
        </div>
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
        <div className="flex items-center justify-between">
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
      </div>
    </div>
  );
}
