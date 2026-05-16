import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import BoxCard from '../components/BoxCard';
import Recommendation from '../components/Recommendation';
import { Search, X, GitCompareArrows, Sparkles } from 'lucide-react';

const dietFilters = [
  { value: 'all',        label: 'All' },
  { value: 'standard',   label: 'Standard' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan',      label: 'Vegan' },
  { value: 'keto',       label: 'Keto' },
  { value: 'paleo',      label: 'Paleo' },
  { value: 'mixed',      label: 'Mixed' },
];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('all');
  const [compareIds, setCompareIds] = useState([]);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (selectedDiet !== 'all') params.dietType = selectedDiet;
        const { data } = await api.get('/boxes', { params });
        setBoxes(data.boxes || []);
      } catch (err) {
        setError('Failed to load boxes. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoxes();
  }, [selectedDiet]);

  const filteredBoxes = boxes.filter(box => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      box.name.toLowerCase().includes(q) ||
      box.description?.toLowerCase().includes(q)
    );
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedDiet('all');
  };

  const hasActiveFilters = search || selectedDiet !== 'all';

  const toggleCompare = (id) => {
    setCompareIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>All Meal Boxes — Boxify</title>
        <meta name="description" content="Browse all our curated meal boxes. Fresh ingredients delivered weekly across Egypt." />
      </Helmet>

      {/* Recommendation Panel */}
      {showRecommendation && (
        <Recommendation
          onClose={() => setShowRecommendation(false)}
          mode="boxes"
        />
      )}

      {/* Overlay */}
      {showRecommendation && (
        <div
          onClick={() => setShowRecommendation(false)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 999
          }}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Meal Boxes</h1>
              <p className="text-gray-500">Curated collections of fresh, pre-portioned ingredients</p>
            </div>
            {/* زرار الـ AI Recommendation */}
            <button
              onClick={() => setShowRecommendation(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg hover:scale-105 w-fit"
              style={{ background: 'linear-gradient(135deg, #1b5e20, #43a047)' }}
            >
              <Sparkles className="w-4 h-4" />
              🤖 لاقيلي بوكس
            </button>
          </div>
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

        {/* Diet type filter */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Diet Type</p>
          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 -mx-4 px-4">
            {dietFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setSelectedDiet(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  selectedDiet === f.value
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 mb-4">
            <X className="w-4 h-4" /> Clear all filters
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredBoxes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-700 mb-2">No boxes found</h3>
            <p className="text-gray-400">Try a different search or filter</p>
            <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {filteredBoxes.length} box{filteredBoxes.length !== 1 ? 'es' : ''} found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBoxes.map(box => (
                <div key={box._id} className="relative">
                  <label className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(box._id)}
                      onChange={() => toggleCompare(box._id)}
                      className="accent-brand-500 w-3.5 h-3.5"
                      disabled={!compareIds.includes(box._id) && compareIds.length >= 3}
                    />
                    <span className="text-xs font-medium text-gray-700">Compare</span>
                  </label>
                  <BoxCard box={box} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Compare Button */}
      {compareIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <GitCompareArrows className="w-5 h-5" />
            Compare {compareIds.length} Boxes
            {compareIds.length < 3 && (
              <span className="text-xs opacity-75 ml-1">(add {3 - compareIds.length} more)</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}