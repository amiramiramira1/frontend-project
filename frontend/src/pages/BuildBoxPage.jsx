import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleMeals, calculateCustomBoxPrice } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, ShoppingCart, Flame, Clock, Repeat, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';

const dietFilters = ['All', 'vegetarian', 'vegan', 'gluten-free', 'high-protein'];
const servingOptions = [1, 2, 4, 6];
const SAVED_BOXES_KEY = 'saved_custom_boxes';

function loadSavedBoxes() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_BOXES_KEY) || '[]');
  } catch {
    return [];
  }
}

function persistSavedBoxes(boxes) {
  localStorage.setItem(SAVED_BOXES_KEY, JSON.stringify(boxes));
}

export default function BuildBoxPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({}); // ✅ object مش array
  const [servings, setServings] = useState(2);
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState(() => {
    return localStorage.getItem('preferred_diet') || 'All';
  });
  const [priceInfo, setPriceInfo] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [boxName, setBoxName] = useState('My Custom Box');
  const [savedBoxes, setSavedBoxes] = useState(loadSavedBoxes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('preferred_diet', dietFilter);
  }, [dietFilter]);

  useEffect(() => {
    setTimeout(() => {
      setMeals(sampleMeals);
      setLoading(false);
    }, 300);
  }, []);

  // ✅ FIX 1: Object.keys بدل .length
  useEffect(() => {
    if (Object.keys(selected).length === 0) {
      setPriceInfo(null);
      return;
    }
    const timer = setTimeout(() => {
      setCalculating(true);
      const result = calculateCustomBoxPrice(selected, servings);
      setPriceInfo(result);
      setCalculating(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [selected, servings]);

  // ✅ FIX 2: بدل toggle — addMeal و changeMealQty
  const MAX_QTY_PER_MEAL = 3;
  const MAX_TOTAL_MEALS = 10;

  const addMeal = (id) => {
    const total = Object.values(selected).reduce((a, b) => a + b, 0);
    if (total >= MAX_TOTAL_MEALS) { toast.error('Maximum 10 meals per box'); return; }
    setSelected(prev => ({ ...prev, [id]: 1 }));
  };

  const changeMealQty = (id, delta) => {
    setSelected(prev => {
      const current = prev[id] ?? 0;
      const next = current + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      if (next > MAX_QTY_PER_MEAL) { toast.error('Max 3 per meal'); return prev; }
      const newTotal = Object.values({ ...prev, [id]: next }).reduce((a, b) => a + b, 0);
      if (newTotal > MAX_TOTAL_MEALS) { toast.error('Maximum 10 meals per box'); return prev; }
      return { ...prev, [id]: next };
    });
  };

  const filtered = meals.filter(m => {
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.cuisine?.toLowerCase().includes(search.toLowerCase());
    const matchDiet =
      dietFilter === 'All' ||
      m.dietaryTags?.includes(dietFilter);
    return matchSearch && matchDiet;
  });

  // ✅ FIX 3: Object.keys بدل .length + mealQuantities بدل mealIds
  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (Object.keys(selected).length === 0) { toast.error('Select at least one meal'); return; }
    setAdding(true);
    try {
      await addToCart({
        type: 'custom-box',
        mealQuantities: selected,
        servingsPerMeal: servings,
        name: boxName
      });
      toast.success('Custom box added to cart!');
      navigate('/cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setAdding(false);
    }
  };

  // ✅ FIX 4: كل الأسطر اللي بتستخدم selected كـ array اتصلحت
  const mealCount = Object.values(selected).reduce((a, b) => a + b, 0);
  const selectedMeals = meals.filter(m => selected[m._id]);
  const lastSelectedId = Object.keys(selected).slice(-1)[0];
  const lastSelected = lastSelectedId ? meals.find(m => m._id === lastSelectedId) : null;
  const suggestions = lastSelected
    ? meals.filter(m =>
        !selected[m._id] &&
        m.dietaryTags?.some(tag => lastSelected.dietaryTags?.includes(tag))
      ).slice(0, 2)
    : [];
  const allTags = [...new Set(selectedMeals.flatMap(m => m.dietaryTags || []))];
  const allAllergens = [...new Set(selectedMeals.flatMap(m => m.allergens || []))];

  const handleSubscribe = () => {
    if (!user) { navigate('/login'); return; }
    if (Object.keys(selected).length === 0) { toast.error('Select at least one meal'); return; }
    const params = new URLSearchParams({
      type: 'custom',
      mealsJson: JSON.stringify(selected),
      servings,
      name: boxName,
    });
    navigate(`/subscribe?${params}`);
  };

  const handleSaveTemplate = () => {
    if (Object.keys(selected).length === 0) {
      toast.error('Select at least one meal before saving');
      return;
    }
    setSaving(true);
    const newBox = {
      id: Date.now().toString(),
      name: boxName,
      mealQuantities: selected,
      servings,
      savedAt: new Date().toISOString(),
    };
    const updated = [newBox, ...savedBoxes];
    setSavedBoxes(updated);
    persistSavedBoxes(updated);
    setTimeout(() => {
      setSaving(false);
      toast.success(`"${boxName}" saved as a template!`);
    }, 400);
  };

  const handleLoadTemplate = (box) => {
    // ✅ backwards-compat: لو template قديم فيه mealIds array حوّله لـ object
    if (box.mealQuantities) {
      setSelected(box.mealQuantities);
    } else if (box.mealIds) {
      const obj = {};
      box.mealIds.forEach(id => { obj[id] = 1; });
      setSelected(obj);
    }
    setServings(box.servings);
    setBoxName(box.name);
    toast.success(`Loaded "${box.name}"`);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleDeleteTemplate = (e, id) => {
    e.stopPropagation();
    const updated = savedBoxes.filter(b => b.id !== id);
    setSavedBoxes(updated);
    persistSavedBoxes(updated);
    toast.success('Template removed');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-10">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
            Build Your Box
          </h1>
          <p className="text-gray-500">
            Pick any meals you love. We'll portion everything fresh.
          </p>
        </div>
      </div>

      <div className="page-container py-8">
        {savedBoxes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <BookmarkCheck className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Your Saved Boxes
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {savedBoxes.map(box => {
                const mc = box.mealQuantities
                  ? Object.values(box.mealQuantities).reduce((a, b) => a + b, 0)
                  : (box.mealIds?.length ?? 0);
                const savedDate = new Date(box.savedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short',
                });
                return (
                  <button
                    key={box.id}
                    onClick={() => handleLoadTemplate(box)}
                    className="group relative text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-400 hover:shadow-md transition-all duration-200"
                  >
                    <button
                      onClick={(e) => handleDeleteTemplate(e, box.id)}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bookmark className="w-4 h-4 text-brand-500" />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight pr-6 truncate">
                        {box.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{mc} meal{mc !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{box.servings} serving{box.servings !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{savedDate}</span>
                    </div>
                    <p className="mt-2.5 text-xs font-medium text-brand-500 group-hover:underline">
                      Tap to reload →
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* العمود الشمال — قائمة الوجبات */}
          <div className="lg:col-span-2">

            {/* Preference Presets */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Your Preferences</p>
              <div className="flex gap-2 flex-wrap">
                {['vegetarian', 'vegan', 'gluten-free', 'high-protein'].map(pref => (
                  <button
                    key={pref}
                    onClick={() => setDietFilter(dietFilter === pref ? 'All' : pref)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      dietFilter === pref
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search meals..."
                  className="input-field pl-11"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {dietFilters.map(f => (
                  <button
                    key={f}
                    onClick={() => setDietFilter(f)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      dietFilter === f
                        ? 'bg-brand-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Meals Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="card h-40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(meal => {
                  const qty = selected[meal._id] ?? 0;
                  const isAdded = qty > 0;
                  const atMax = qty >= MAX_QTY_PER_MEAL;
                  const boxFull = mealCount >= MAX_TOTAL_MEALS;

                  return (
                    <div
                      key={meal._id}
                      className={`card transition-all duration-200 overflow-hidden ${
                        isAdded ? 'ring-2 ring-brand-500 shadow-md' : ''
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                          alt={meal.name}
                          className="w-full h-36 object-cover"
                        />
                        {isAdded && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                              ×{qty}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                          {meal.name}
                        </h3>
                        <div className="flex gap-3 mb-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {meal.prepTime}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" /> {meal.caloriesPerServing} cal
                          </span>
                          <span className="font-medium text-brand-600">
                            {(meal.pricePerServing * servings).toFixed(0)} EGP
                          </span>
                        </div>

                        {!isAdded ? (
                          <button
                            onClick={() => addMeal(meal._id)}
                            disabled={boxFull}
                            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
                              boxFull
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-500 hover:text-white hover:border-brand-500'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {boxFull ? 'Box Full' : 'Add'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-1 py-1">
                            <button
                              onClick={() => changeMealQty(meal._id, -1)}
                              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="text-center">
                              <span className="font-bold text-gray-900 text-sm">{qty}</span>
                              <p className="text-xs text-gray-400 leading-none">
                                {qty === MAX_QTY_PER_MEAL ? 'max' : `of ${MAX_QTY_PER_MEAL}`}
                              </p>
                            </div>
                            <button
                              onClick={() => changeMealQty(meal._id, +1)}
                              disabled={atMax || boxFull}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shadow-sm ${
                                atMax || boxFull
                                  ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'
                                  : 'bg-white border-gray-200 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* You might also like */}
            {suggestions.length > 0 && (
              <div className="mt-6 animate-fadeIn transition-all duration-500">
                <p className="text-sm font-medium text-gray-500 mb-3">
                  ✨ You might also like
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map(meal => {
                    const qty = selected[meal._id] ?? 0;
                    const isAdded = qty > 0;
                    const boxFull = mealCount >= MAX_TOTAL_MEALS;
                    return (
                      <div key={meal._id} className={`card overflow-hidden ring-1 bg-brand-50/30 transition-all duration-200 ${isAdded ? 'ring-brand-500' : 'ring-brand-200'}`}>
                        <img src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={meal.name} className="w-full h-28 object-cover" />
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 text-sm">{meal.name}</h3>
                          <div className="flex gap-3 mt-1 mb-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{meal.caloriesPerServing} cal</span>
                            <span className="font-medium text-brand-600">{(meal.pricePerServing * servings).toFixed(0)} EGP</span>
                          </div>
                          {!isAdded ? (
                            <button onClick={() => addMeal(meal._id)} disabled={boxFull} className="w-full py-1.5 rounded-xl text-xs font-medium bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-500 hover:text-white transition-all">
                              + Add
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-1 py-1">
                              <button onClick={() => changeMealQty(meal._id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                              <span className="font-bold text-sm">{qty}</span>
                              <button onClick={() => changeMealQty(meal._id, +1)} disabled={qty >= MAX_QTY_PER_MEAL || boxFull} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40"><Plus className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* العمود الأيمن — Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold mb-4">Your Custom Box</h2>

              <input value={boxName} onChange={e => setBoxName(e.target.value)} className="input-field text-sm mb-4" />

              <div className="grid grid-cols-4 gap-2 mb-5">
                {servingOptions.map(s => (
                  <button key={s} onClick={() => setServings(s)} className={`py-2 rounded-xl text-sm font-medium border ${servings === s ? 'bg-brand-500 text-white' : 'bg-white border-gray-200'}`}>
                    {s}
                  </button>
                ))}
              </div>

              {/* قائمة الوجبات المختارة */}
              {mealCount > 0 && (
                <div className="mb-4 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected</p>
                    <span className={`text-xs font-medium ${mealCount >= MAX_TOTAL_MEALS ? 'text-red-500' : 'text-gray-400'}`}>{mealCount}/{MAX_TOTAL_MEALS}</span>
                  </div>
                  {selectedMeals.map(m => (
                    <div key={m._id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                      <span className="text-gray-700 truncate pr-2 flex-1">{m.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => changeMealQty(m._id, -1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-2.5 h-2.5" /></button>
                        <span className="font-semibold w-4 text-center">{selected[m._id]}</span>
                        <button onClick={() => changeMealQty(m._id, +1)} disabled={selected[m._id] >= MAX_QTY_PER_MEAL} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40"><Plus className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {priceInfo && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Nutritional Summary</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>{priceInfo.totalCalories?.toLocaleString()} total calories</span>
                  </div>
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {allTags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md">{tag}</span>
                      ))}
                    </div>
                  )}
                  {allAllergens.length > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                      ⚠️ Contains: {allAllergens.join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {priceInfo && (
                <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="font-display font-black text-xl text-brand-600">
                    {calculating ? '…' : `${priceInfo.totalPrice?.toLocaleString()} EGP`}
                  </span>
                </div>
              )}

              <button
                onClick={handleSaveTemplate}
                disabled={saving || mealCount === 0}
                className={`w-full flex items-center justify-center gap-2 mb-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  mealCount === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : saving ? 'border-brand-300 text-brand-400 bg-brand-50'
                  : 'border-brand-300 text-brand-600 bg-brand-50 hover:bg-brand-100 hover:border-brand-400'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save as Template'}
              </button>

              <button onClick={handleAddToCart} disabled={adding || mealCount === 0} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>

              <button onClick={handleSubscribe} disabled={mealCount === 0} className="btn-outline w-full flex items-center justify-center gap-2">
                <Repeat className="w-4 h-4" />
                Subscribe Weekly
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}