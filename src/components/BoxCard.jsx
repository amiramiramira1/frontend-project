import { Link } from 'react-router-dom';

const dietTags = {
  'vegetarian': { color: 'bg-green-100 text-green-700', label: '🌱 Vegetarian' },
  'vegan': { color: 'bg-emerald-100 text-emerald-700', label: '🌿 Vegan' },
  'gluten-free': { color: 'bg-yellow-100 text-yellow-700', label: '🌾 Gluten-Free' },
  'dairy-free': { color: 'bg-blue-100 text-blue-700', label: '🥛 Dairy-Free' },
  'high-protein': { color: 'bg-red-100 text-red-700', label: '💪 High-Protein' },
};

export default function BoxCard({ box }) {
  return (
    <Link to={`/boxes/${box._id}`} className="block group">
      <div className="card overflow-hidden">
        {/* Image كبيرة زي Factor */}
        <div className="relative h-64 overflow-hidden">
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

        {/* Content بسيط زي Factor */}
        <div className="p-4">
          <h3 className="font-display font-bold text-lg text-gray-900 mb-1">{box.name}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{box.description}</p>

          {/* Tags */}
          {box.dietaryTags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {box.dietaryTags.slice(0, 3).map(tag => (
                dietTags[tag] && (
                  <span key={tag} className={`text-xs px-3 py-1 rounded-full font-medium ${dietTags[tag].color}`}>
                    {dietTags[tag].label}
                  </span>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}