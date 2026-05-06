import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sampleBoxes } from '../data/mockData';
import BoxCard from '../components/BoxCard';
import { Search, Heart, GitCompare, X } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const categories = ['All', 'Mediterranean', 'Egyptian', 'Healthy', 'Italian', 'Vegetarian', 'High-Protein'];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [showFavorites, setShowFavorites] = useState(searchParams.get('favorites') === 'true');
  const [compareList, setCompareList] = useState([]);
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let filtered = sampleBoxes;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(b => {
          const nameMatch = b.name.toLowerCase().includes(q);
          const descMatch = q.length >= 3 && b.description.toLowerCase().includes(q);
          return nameMatch || descMatch;
        });
      }
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(b => b.category === selectedCategory);
      }
      if (showFavorites) {
        filtered = filtered.filter(b => favorites.includes(b._id));
      }
      setBoxes(filtered);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, search, showFavorites, favorites]);

  const handleFavoritesFilter = () => {
    if (!user) {
      toast.error('Please log in to view favorites');
      return;
    }
    setShowFavorites(prev => !prev);
  };

  // ✅ Compare Logic
  const handleCompareToggle = (boxId) => {
    if (compareList.includes(boxId)) {
      setCompareList(prev => prev.filter(id => id !== boxId));
    } else {
      if (compareList.length >= 3) {
        toast.error('You can compare up to 3 boxes only!');
        return;
      }
      setCompareList(prev => [...prev, boxId]);
    }
  };

  const handleCompareNow = () => {
    navigate(`/compare?ids=${compareList.join(',')}`);
  };

  const compareBoxes = sampleBoxes.filter(b => compareList.includes(b._id));

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-10">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Meal Boxes</h1>
          <p className="text-gray-500">Curated collections of fresh, pre-portioned ingredients</p>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search boxes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          {/* Category Pills + Favorites */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setShowFavorites(false); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat && !showFavorites
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={handleFavoritesFilter}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                showFavorites
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showFavorites ? 'fill-white' : ''}`} />
              Favorites
              {favorites.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  showFavorites ? 'bg-white/20' : 'bg-red-100 text-red-600'
                }`}>
                  {favorites.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card h-80 animate-pulse" />
            ))}
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {showFavorites
                ? <Heart className="w-8 h-8 text-red-400" />
                : <Search className="w-8 h-8 text-gray-400" />
              }
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-700 mb-2">
              {showFavorites ? 'No favorites yet' : 'No boxes found'}
            </h3>
            <p className="text-gray-400">
              {showFavorites ? 'Start saving boxes you love by clicking the ❤️' : 'Try a different search or category'}
            </p>
            <button onClick={() => { setSearch(''); setSelectedCategory('All'); setShowFavorites(false); }} className="btn-primary mt-4">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{boxes.length} box{boxes.length !== 1 ? 'es' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map(box => (
                <BoxCard
                  key={box._id}
                  box={box}
                  compareList={compareList}
                  onCompareToggle={handleCompareToggle}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ✅ Sticky Compare Bar */}
      {compareList.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
          <div className="page-container py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <GitCompare className="w-4 h-4 text-brand-500" />
                  Comparing:
                </div>
                {compareBoxes.map(box => (
                  <div key={box._id} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    {box.name}
                    <button onClick={() => handleCompareToggle(box._id)} className="hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setCompareList([])}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleCompareNow}
                  className="btn-primary flex items-center gap-2"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}