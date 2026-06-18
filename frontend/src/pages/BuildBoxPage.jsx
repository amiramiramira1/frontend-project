// BuildBoxPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, ShoppingCart, Flame, Repeat, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

const dietFilters = ['All', 'vegetarian', 'vegan', 'keto', 'paleo', 'standard'];
const servingOptions = [1, 2, 4, 6];
const SAVED_BOXES_KEY = 'saved_custom_boxes';

function loadSavedBoxes() {
  try { return JSON.parse(localStorage.getItem(SAVED_BOXES_KEY) || '[]'); }
  catch { return []; }
}
function persistSavedBoxes(boxes) {
  localStorage.setItem(SAVED_BOXES_KEY, JSON.stringify(boxes));
}

export default function BuildBoxPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [servings, setServings] = useState(2);
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState(() => localStorage.getItem('preferred_diet') || 'All');
  const [priceInfo, setPriceInfo] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [boxName, setBoxName] = useState(t('buildBox.yourCustomBox'));
  const [savedBoxes, setSavedBoxes] = useState(loadSavedBoxes);
  const [saving, setSaving] = useState(false);


  useEffect(() => { localStorage.setItem('preferred_diet', dietFilter); }, [dietFilter]);

  // GET /api/meals → { meals: [...], pagination }
  useEffect(() => {
    api.get('/meals', { params: { limit: 50 } })
      .then(({ data }) => setMeals(data.meals || []))
      .catch(() => toast.error(t('msg.loadMealsFailed')))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  // POST /api/boxes/custom/calculate whenever selection or servings changes
  useEffect(() => {
    if (Object.keys(selected).length === 0) { setPriceInfo(null); return; }
    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const mealIds = Object.entries(selected).flatMap(([id, qty]) => Array(qty).fill(id));
        const { data } = await api.post('/boxes/custom/calculate', { mealIds, servingSize: servings });
        setPriceInfo({
          totalPrice:    data.preview.priceForServingSize,
          totalCalories: data.preview.totalCalories,
          allergens:     data.preview.allergens || [],
        });
      } catch { setPriceInfo(null); }
      finally { setCalculating(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [selected, servings]);

  const MAX_QTY_PER_MEAL = 3;
  const MAX_TOTAL_MEALS  = 10;

  const addMeal = (id) => {
    const total = Object.values(selected).reduce((a, b) => a + b, 0);
    if (total >= MAX_TOTAL_MEALS) { toast.error(t('msg.maxMeals')); return; }
    setSelected(prev => ({ ...prev, [id]: 1 }));
  };

  const changeMealQty = (id, delta) => {
    setSelected(prev => {
      const next = (prev[id] ?? 0) + delta;
      if (next <= 0) { const { [id]: _, ...rest } = prev; return rest; }
      if (next > MAX_QTY_PER_MEAL) { toast.error(t('msg.maxPerMeal')); return prev; }
      const newTotal = Object.values({ ...prev, [id]: next }).reduce((a, b) => a + b, 0);
      if (newTotal > MAX_TOTAL_MEALS) { toast.error(t('msg.maxMeals')); return prev; }
      return { ...prev, [id]: next };
    });
  };

  const filtered = meals.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.cuisine?.toLowerCase().includes(search.toLowerCase());
    const matchDiet   = dietFilter === 'All' || m.dietType === dietFilter;
    return matchSearch && matchDiet;
  });

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (Object.keys(selected).length === 0) { toast.error(t('msg.selectMeal')); return; }
    setAdding(true);
    try {
      const mealIds = Object.entries(selected).flatMap(([id, qty]) => Array(qty).fill(id));
      const { data: boxData } = await api.post('/boxes/custom', {
        meals: mealIds, name: boxName, servingSize: servings,
      });
      await addToCart({ boxId: boxData.box._id, servingsPerMeal: servings, quantity: 1 });
      toast.success(t('msg.customBoxAdded'));
      navigate('/cart');
    } catch (err) {
      toast.error(err.response?.data?.message || t('msg.addToCartFailed'));
    } finally { setAdding(false); }
  };

  const mealCount      = Object.values(selected).reduce((a, b) => a + b, 0);
  const selectedMeals  = meals.filter(m => selected[m._id]);
  const allTags        = [...new Set(selectedMeals.map(m => m.dietType).filter(Boolean))];
  const allAllergens   = priceInfo?.allergens || [...new Set(selectedMeals.flatMap(m => m.allergens || []))];

  const lastSelectedId = Object.keys(selected).slice(-1)[0];
  const lastSelected   = lastSelectedId ? meals.find(m => m._id === lastSelectedId) : null;
  const suggestions    = lastSelected
    ? meals.filter(m => !selected[m._id] && m.dietType === lastSelected.dietType && m.inStock !== false && m.stockQuantity !== 0).slice(0, 2)
    : [];

  const handleSubscribe = async () => {
    if (!user) { navigate('/login'); return; }
    if (Object.keys(selected).length === 0) { toast.error(t('msg.selectMeal')); return; }
    try {
      const mealIds = Object.entries(selected).flatMap(([id, qty]) => Array(qty).fill(id));
      const { data: boxData } = await api.post('/boxes/custom', {
        meals: mealIds,
        name: boxName,
        servingSize: servings,
      });
      navigate(
        `/subscribe?boxId=${boxData.box._id}&servings=${servings}&type=custom&name=${encodeURIComponent(boxName)}`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || t('msg.addToCartFailed'));
    }
  };

  const handleSaveTemplate = () => {
    if (Object.keys(selected).length === 0) { toast.error(t('msg.selectMeal')); return; }
    setSaving(true);
    const newBox = { id: Date.now().toString(), name: boxName, mealQuantities: selected, servings, savedAt: new Date().toISOString() };
    const updated = [newBox, ...savedBoxes];
    setSavedBoxes(updated);
    persistSavedBoxes(updated);
    setTimeout(() => { setSaving(false); toast.success(i18next.t('msg.boxSaved', { name: boxName })); }, 400);
  };

  const handleLoadTemplate = (box) => {
    setSelected(box.mealQuantities || {});
    setServings(box.servings);
    setBoxName(box.name);
    toast.success(i18next.t('msg.boxLoaded', { name: box.name }));
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleDeleteTemplate = (e, id) => {
    e.stopPropagation();
    const updated = savedBoxes.filter(b => b.id !== id);
    setSavedBoxes(updated);
    persistSavedBoxes(updated);
    toast.success(t('msg.templateRemoved'));
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">{t('buildBox.title')}</h1>
              <p className="text-gray-500">{t('buildBox.subtitle')}</p>
            </div>
            <p className="text-sm text-gray-400 italic">
              {t('buildBox.assistantHint', { defaultValue: 'Need help choosing? Ask our assistant 🥕 in the chat!' })}
            </p>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {savedBoxes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <BookmarkCheck className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('buildBox.savedBoxes')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {savedBoxes.map(box => {
                const mc = box.mealQuantities ? Object.values(box.mealQuantities).reduce((a, b) => a + b, 0) : 0;
                return (
                  <button key={box.id} onClick={() => handleLoadTemplate(box)}
                    className="group relative text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-400 hover:shadow-md transition-all duration-200">
                    <button onClick={(e) => handleDeleteTemplate(e, box.id)}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bookmark className="w-4 h-4 text-brand-500" />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight pr-6 truncate">{box.name}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{mc} {mc !== 1 ? t('buildBox.meals') : t('buildBox.meal')}</span>
                      <span>·</span>
                      <span>{box.servings} {box.servings !== 1 ? t('buildBox.servings') : t('buildBox.serving')}</span>
                    </div>
                    <p className="mt-2.5 text-xs font-medium text-brand-500 group-hover:underline">{t('buildBox.tapToReload')}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('buildBox.searchPh')} className="input-field pl-11" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {dietFilters.map(f => (
                  <button key={f} onClick={() => setDietFilter(f)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all capitalize ${dietFilter === f ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                    {t(`dietType.${f.toLowerCase()}`, { defaultValue: f })}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="card h-40 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">{t('buildBox.noMeals')}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(meal => {
                  const qty     = selected[meal._id] ?? 0;
                  const isAdded = qty > 0;
                  const isOutOfStock = meal.inStock === false || meal.stockQuantity === 0;
                  const atMax   = qty >= MAX_QTY_PER_MEAL;
                  const boxFull = mealCount >= MAX_TOTAL_MEALS;
                  return (
                    <div key={meal._id} className={`card overflow-hidden transition-all duration-200 ${isAdded ? 'ring-2 ring-brand-500 shadow-md' : ''}`}>
                      <div className="relative">
                        <img src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={meal.name} className="w-full h-36 object-cover" />
                        {isOutOfStock && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">Out of Stock</span>
                          </div>
                        )}
                        {isAdded && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">×{qty}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">{meal.name}</h3>
                          <button
                            onClick={() => navigate(`/meals/${meal._id}`)}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
                          >
                            {t('mealDetails.viewDetails', { defaultValue: 'View Details' })}
                          </button>
                        </div>
                        <div className="flex gap-3 mb-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {meal.caloriesPerServing} {t('buildBox.cal')}</span>
                          <span className="font-medium text-brand-600">{(meal.pricePerServing * servings).toFixed(0)} EGP</span>
                          <span className="capitalize text-gray-400">{t(`cuisine.${meal.cuisine?.toLowerCase()}`, { defaultValue: meal.cuisine })}</span>
                        </div>
                        {isOutOfStock ? (
                          <button disabled
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200">
                            Out of Stock
                          </button>
                        ) : !isAdded ? (
                          <button onClick={() => addMeal(meal._id)} disabled={boxFull}
                            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${boxFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-500 hover:text-white hover:border-brand-500'}`}>
                            <Plus className="w-3.5 h-3.5" /> {boxFull ? t('buildBox.boxFull') : t('buildBox.add')}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-1 py-1">
                            <button onClick={() => changeMealQty(meal._id, -1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 flex items-center justify-center">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="text-center">
                              <span className="font-bold text-gray-900 text-sm">{qty}</span>
                              <p className="text-xs text-gray-400 leading-none">{qty === MAX_QTY_PER_MEAL ? t('buildBox.max') : `${t('buildBox.of')} ${MAX_QTY_PER_MEAL}`}</p>
                            </div>
                            <button onClick={() => changeMealQty(meal._id, +1)} disabled={atMax || boxFull || isOutOfStock}
                              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-brand-50 hover:text-brand-600 flex items-center justify-center disabled:opacity-40">
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

            {suggestions.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-3">{t('buildBox.youMightLike')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map(meal => {
                    const qty = selected[meal._id] ?? 0;
                    const isAdded = qty > 0;
                    return (
                      <div key={meal._id} className={`card overflow-hidden ring-1 bg-brand-50/30 ${isAdded ? 'ring-brand-500' : 'ring-brand-200'}`}>
                        <img src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} alt={meal.name} className="w-full h-28 object-cover" />
                        <div className="p-3">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm flex-1">{meal.name}</h3>
                            <button
                              onClick={() => navigate(`/meals/${meal._id}`)}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
                            >
                              {t('mealDetails.viewDetails', { defaultValue: 'View Details' })}
                            </button>
                          </div>
                          <div className="flex gap-3 mt-1 mb-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{meal.caloriesPerServing} {t('buildBox.cal')}</span>
                            <span className="font-medium text-brand-600">{(meal.pricePerServing * servings).toFixed(0)} EGP</span>
                          </div>
                          {!isAdded ? (
                            <button onClick={() => addMeal(meal._id)} className="w-full py-1.5 rounded-xl text-xs font-medium bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-500 hover:text-white transition-all">+ {t('buildBox.add')}</button>
                          ) : (
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-1 py-1">
                              <button onClick={() => changeMealQty(meal._id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                              <span className="font-bold text-sm">{qty}</span>
                              <button onClick={() => changeMealQty(meal._id, +1)} disabled={qty >= MAX_QTY_PER_MEAL} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40"><Plus className="w-3 h-3" /></button>
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

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold mb-4">{t('buildBox.yourCustomBox')}</h2>
              <input value={boxName} onChange={e => setBoxName(e.target.value)} className="input-field text-sm mb-4" />

              <div className="grid grid-cols-4 gap-2 mb-5">
                {servingOptions.map(s => (
                  <button key={s} onClick={() => setServings(s)}
                    className={`py-2 rounded-xl text-sm font-medium border ${servings === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-200'}`}>
                    {s}
                  </button>
                ))}
              </div>

              {mealCount > 0 && (
                <div className="mb-4 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('buildBox.selected')}</p>
                    <span className={`text-xs font-medium ${mealCount >= MAX_TOTAL_MEALS ? 'text-red-500' : 'text-gray-400'}`}>{mealCount}/{MAX_TOTAL_MEALS}</span>
                  </div>
                  {selectedMeals.map(m => (
                    <div key={m._id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                      <span className="text-gray-700 truncate pr-2 flex-1">{m.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => changeMealQty(m._id, -1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-2.5 h-2.5" /></button>
                        <span className="font-semibold w-4 text-center">{selected[m._id]}</span>
                        <button onClick={() => changeMealQty(m._id, +1)} disabled={selected[m._id] >= MAX_QTY_PER_MEAL || m.inStock === false || m.stockQuantity === 0} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40"><Plus className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {priceInfo && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">{t('buildBox.nutritionalSummary')}</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>{priceInfo.totalCalories?.toLocaleString()} {t('buildBox.totalCalories')}</span>
                  </div>
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {allTags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md capitalize">{tag}</span>
                      ))}
                    </div>
                  )}
                  {allAllergens.length > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                      {t('buildBox.contains')} {allAllergens.join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {priceInfo && (
                <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">{t('buildBox.total')}</span>
                  <span className="font-display font-black text-xl text-brand-600">
                    {calculating ? '…' : `${priceInfo.totalPrice?.toLocaleString()} EGP`}
                  </span>
                </div>
              )}

              <button onClick={handleSaveTemplate} disabled={saving || mealCount === 0}
                className={`w-full flex items-center justify-center gap-2 mb-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${mealCount === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-brand-300 text-brand-600 bg-brand-50 hover:bg-brand-100'}`}>
                <Bookmark className="w-4 h-4" /> {saving ? t('buildBox.saving') : t('buildBox.saveTemplate')}
              </button>

              <button onClick={handleAddToCart} disabled={adding || mealCount === 0} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4" /> {adding ? t('buildBox.creatingBox') : t('buildBox.addToCart')}
              </button>

              <button onClick={handleSubscribe} disabled={mealCount === 0} className="btn-outline w-full flex items-center justify-center gap-2">
                <Repeat className="w-4 h-4" /> {t('buildBox.subscribe')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}