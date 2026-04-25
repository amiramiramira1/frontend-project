import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sampleBoxes } from '../data/mockData';
import BoxCard from '../components/BoxCard';
import { Search, X } from 'lucide-react';

const categories = ['All', 'Mediterranean', 'Egyptian', 'Healthy', 'Italian', 'Vegetarian', 'High-Protein'];
const servingSizes = [1, 2, 4, 6];
const dietaryOptions = ['vegetarian', 'vegan', 'high-protein', 'gluten-free'];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedServing, setSelectedServing] = useState(null);
  const [selectedDietary, setSelectedDietary] = useState([]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let filtered = sampleBoxes;

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(b => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
      }

      if (selectedCategory !== 'All') {
        filtered = filtered.filter(b => b.category === selectedCategory);
      }

      if (selectedServing) {
        filtered = filtered.filter(b => b.availableServings?.includes(selectedServing));
      }

      if (selectedDietary.length > 0) {
        filtered = filtered.filter(b =>
          selectedDietary.some(tag => b.dietaryTags?.includes(tag))
        );
      }

      setBoxes(filtered);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, search, selectedServing, selectedDietary]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedServing(null);
    setSelectedDietary([]);
  };

  const hasActiveFilters = search || selectedCategory !== 'All' || selectedServing || selectedDietary.length > 0;

  const toggleDietary = (tag) => {
    setSelectedDietary(prev =>
      prev.includes(tag) ? [] : [tag]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-6">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Meal Boxes</h1>
          <p className="text-gray-500">Curated collections of fresh, pre-portioned ingredients</p>
        </div>
      </div>

      <div className="page-container py-4">
        {/* Search */}
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search boxes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-4">

          {/* Categories */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5 px-0">Category</p>
            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 -mx-4 px-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Serving Size */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Serving Size</p>
            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 -mx-4 px-4">
              {servingSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedServing(selectedServing === size ? null : size)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 border ${
                    selectedServing === size
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {size} {size === 1 ? 'Person' : 'People'}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Dietary</p>
            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 -mx-4 px-4">
              {dietaryOptions.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleDietary(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize flex-shrink-0 ${
                    selectedDietary.includes(tag)
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 mb-4"
          >
            <X className="w-4 h-4" /> Clear all filters
          </button>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card h-80 animate-pulse" />
            ))}
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-700 mb-2">No boxes found</h3>
            <p className="text-gray-400">Try a different search or category</p>
            <button onClick={clearAllFilters} className="btn-primary mt-4">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{boxes.length} box{boxes.length !== 1 ? 'es' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map(box => <BoxCard key={box._id} box={box} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
