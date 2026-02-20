import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { Search, Plus, X, ShoppingCart, Flame, Clock, ChefHat, Repeat, Calculator } from 'lucide-react';

const dietFilters = ['All', 'vegetarian', 'vegan', 'gluten-free', 'high-protein'];
const servingOptions = [1, 2, 4, 6];

export default function BuildBoxPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [servings, setServings] = useState(2);
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState('All');
  const [priceInfo, setPriceInfo] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [boxName, setBoxName] = useState('My Custom Box');

  useEffect(() => {
    api.get('/meals').then(({ data }) => setMeals(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected.length === 0) { setPriceInfo(null); return; }
    const timer = setTimeout(calculatePrice, 400);
    return () => clearTimeout(timer);
  }, [selected, servings]);

  const calculatePrice = async () => {
    setCalculating(true);
    try {
      const { data } = await api.post('/custom-box/calculate', {
        mealIds: selected,
        servingsPerMeal: servings
      });
      setPriceInfo(data);
    } catch {} finally { setCalculating(false); }
  };

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = meals.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.cuisine?.toLowerCase().includes(search.toLowerCase());
    const matchDiet = dietFilter === 'All' || m.dietaryTags?.includes(dietFilter);
    return matchSearch && matchDiet;
  });

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (selected.length === 0) { toast.error('Select at least one meal'); return; }
    setAdding(true);
    try {
      await addToCart({ type: 'custom-box', mealIds: selected, servingsPerMeal: servings, name: boxName });
      toast.success('Custom box added to cart!');
      navigate('/cart');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAdding(false); }
  };

  const handleSubscribe = () => {
    if (!user) { navigate('/login'); return; }
    if (selected.length === 0) { toast.error('Select at least one meal'); return; }
    const params = new URLSearchParams({
      type: 'custom',
      mealIds: selected.join(','),
      servings,
      name: boxName,
    });
    navigate(`/subscribe?${params}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-10">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Build Your Box</h1>
          <p className="text-gray-500">Pick any meals you love. We'll portion everything fresh.</p>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meal Selector */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals..." className="input-field pl-11" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {dietFilters.map(f => (
                  <button key={f} onClick={() => setDietFilter(f)} className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${dietFilter === f ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="card h-40 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(meal => {
                  const isSelected = selected.includes(meal._id);
                  return (
                    <div
                      key={meal._id}
                      onClick={() => toggle(meal._id)}
                      className={`card cursor-pointer transition-all duration-200 overflow-hidden ${isSelected ? 'ring-2 ring-brand-500 shadow-md' : 'hover:-translate-y-0.5'}`}
                    >
                      <div className="relative">
                        <img src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={meal.name} className="w-full h-36 object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center shadow-lg">
                              <Plus className="w-5 h-5 text-white rotate-45" style={{ transform: 'rotate(0deg)' }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{meal.name}</h3>
                          {isSelected && <span className="badge-green badge text-xs">✓</span>}
                        </div>
                        <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meal.prepTime}m</span>
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {meal.caloriesPerServing} cal</span>
                          <span className="font-medium text-brand-600">{(meal.pricePerServing * servings).toFixed(0)} EGP</span>
                        </div>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {meal.dietaryTags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Box Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold mb-4">Your Custom Box</h2>

              {/* Box name */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Box Name</label>
                <input value={boxName} onChange={e => setBoxName(e.target.value)} className="input-field text-sm" />
              </div>

              {/* Servings */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2">Serving Size</label>
                <div className="grid grid-cols-4 gap-2">
                  {servingOptions.map(s => (
                    <button key={s} onClick={() => setServings(s)} className={`py-2 rounded-xl text-sm font-medium transition-all border ${servings === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected meals */}
              {selected.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ChefHat className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Pick meals from the left</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {selected.map(id => {
                    const meal = meals.find(m => m._id === id);
                    if (!meal) return null;
                    return (
                      <div key={id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-700 truncate pr-2">{meal.name}</span>
                        <button onClick={() => toggle(id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price */}
              {priceInfo && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{selected.length} meals × {servings}</span>
                    <span>{calculating ? '...' : `${priceInfo.totalCalories?.toLocaleString()} cal`}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total</span>
                    <span className="text-2xl font-display font-black text-brand-600">
                      {calculating ? '...' : `${priceInfo.totalPrice?.toLocaleString()} EGP`}
                    </span>
                  </div>
                </div>
              )}

              {selected.length > 0 && (
                <p className="text-xs text-gray-500 text-center mb-3">{selected.length} meal{selected.length > 1 ? 's' : ''} selected</p>
              )}

              <button onClick={handleAddToCart} disabled={adding || selected.length === 0} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>

              <button onClick={handleSubscribe} disabled={selected.length === 0} className="btn-outline w-full flex items-center justify-center gap-2">
                <Repeat className="w-4 h-4" /> Subscribe Weekly
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
