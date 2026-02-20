import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import BoxCard from '../components/BoxCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const categories = ['All', 'Mediterranean', 'Egyptian', 'Healthy', 'Italian', 'Vegetarian', 'High-Protein'];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      const { data } = await api.get(`/boxes?${params}`);
      setBoxes(data);
    } catch {} 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBoxes(); }, [selectedCategory, search]);

  return (
    <div className="min-h-screen bg-gray-50">
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
          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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
            <button onClick={() => { setSearch(''); setSelectedCategory('All'); }} className="btn-primary mt-4">
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
