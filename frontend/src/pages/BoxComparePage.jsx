import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ChevronLeft, Check, X, Users, ChefHat, Flame, Tag, ShoppingCart, AlertTriangle, Trophy } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Same multipliers as backend
const MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

export default function BoxComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const { t, i18n } = useTranslation();

  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);

  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];

  // Fetch each box by ID from the real API
  // GET /api/boxes/:id → { box: { ...fields, meals: [...populated] } }
  useEffect(() => {
    if (ids.length < 2) { setLoading(false); return; }

    Promise.all(ids.map(id => api.get(`/boxes/${id}`)))
      .then(responses => setBoxes(responses.map(r => r.data.box).filter(Boolean)))
      .catch(() => toast.error('Failed to load boxes for comparison'))
      .finally(() => setLoading(false));
  }, [searchParams.get('ids'), i18n.language]);

  const handleAddToCart = async (box) => {
    if (!user) { navigate('/login'); return; }
    try {
      await addToCart({ type: 'pre-made-box', boxId: box._id, servingsPerMeal: 2 });
      toast.success(`${box.name} added to cart!`);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );

  if (boxes.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t('boxDetails.compareSelectAtLeast2', 'Please select at least 2 boxes to compare.')}</p>
          <button onClick={() => navigate('/boxes')} className="btn-primary">{t('subs.browseBoxes', 'Browse Boxes')}</button>
        </div>
      </div>
    );
  }

  // ── Helpers for highlight badges ──────────────────────────────────
  // Use basePrice × MULTIPLIER[2] (for 2 people) as the display price
  const priceFor2 = (box) => box.basePrice * MULTIPLIERS[2];
  const minPrice  = Math.min(...boxes.map(priceFor2));
  const maxMeals  = Math.max(...boxes.map(b => b.meals?.length || 0));
  // Sum of all meals' calories × serving multiplier
  const totalCals = (box) =>
    (box.meals?.reduce((s, m) => s + (m.caloriesPerServing || 0), 0) || 0) * MULTIPLIERS[2];
  const minCal = Math.min(...boxes.map(totalCals));

  // Unique diet types across all boxes' meals
  const allDietTypes = [...new Set(boxes.flatMap(b => b.meals?.map(m => m.dietType) || []).filter(Boolean))];
  // Unique allergens across all boxes' meals
  const allAllergens = [...new Set(boxes.flatMap(b => b.meals?.flatMap(m => m.allergens || []) || []))];

  const rows = [
    {
      label: t('boxDetails.comparePrice2', 'Price (2 people)'),
      icon: <Tag className="w-4 h-4" />,
      render: (box) => {
        const price = priceFor2(box);
        const isLowest = price === minPrice;
        return (
          <div className={isLowest ? 'bg-green-50 rounded-xl p-2' : ''}>
            {isLowest && (
              <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mb-1">
                <Trophy className="w-3 h-3" /> {t('boxDetails.bestValue', 'Best Value')}
              </div>
            )}
            <span className={`text-2xl font-display font-black ${isLowest ? 'text-green-600' : 'text-brand-600'}`}>
              {price.toFixed(0)}
            </span>
            <span className="text-sm text-gray-500 ml-1">{t('boxDetails.egp', 'EGP')}</span>
          </div>
        );
      },
    },
    {
      label: t('boxDetails.compareMealsCount', 'Meals Count'),
      icon: <ChefHat className="w-4 h-4" />,
      render: (box) => {
        const count = box.meals?.length || 0;
        const isMost = count === maxMeals;
        return (
          <div className={isMost ? 'bg-green-50 rounded-xl p-2' : ''}>
            {isMost && (
              <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mb-1">
                <Trophy className="w-3 h-3" /> {t('boxDetails.mostMeals', 'Most Meals')}
              </div>
            )}
            <span className={`text-lg font-bold ${isMost ? 'text-green-600' : 'text-gray-800'}`}>
              {count} {t('boxDetails.meals', 'Meals')}
            </span>
          </div>
        );
      },
    },
    {
      label: t('boxDetails.compareServingSizes', 'Serving Sizes'),
      icon: <Users className="w-4 h-4" />,
      // All backend boxes support all serving sizes
      render: () => (
        <div className="flex flex-wrap gap-1 justify-center">
          {[1, 2, 4, 6].map(s => (
            <span key={s} className="text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded-full font-medium">
              {s} {s === 1 ? t('boxDetails.person', 'person') : t('boxDetails.people', 'people')}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: t('boxDetails.compareDietType', 'Diet Type'),
      icon: <Tag className="w-4 h-4" />,
      // dietType replaces category
      render: (box) => (
        <span className="badge bg-brand-500 text-white capitalize">{t(`boxes.diet${box.dietType.charAt(0).toUpperCase() + box.dietType.slice(1)}`, box.dietType)}</span>
      ),
    },
    {
      label: t('boxDetails.compareTotalCals', 'Total Calories (2 people)'),
      icon: <Flame className="w-4 h-4" />,
      render: (box) => {
        const cal = totalCals(box);
        const isLowest = cal === minCal;
        return cal > 0 ? (
          <div className={isLowest ? 'bg-green-50 rounded-xl p-2' : ''}>
            {isLowest && (
              <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mb-1">
                <Trophy className="w-3 h-3" /> {t('boxDetails.lowestCal', 'Lowest Cal')}
              </div>
            )}
            <span className={`text-lg font-bold ${isLowest ? 'text-green-600' : 'text-orange-500'}`}>
              {Math.round(cal)} {t('boxDetails.cal', 'cal')}
            </span>
          </div>
        ) : <span className="text-gray-400 text-sm">—</span>;
      },
    },
    // One row per unique diet type across all boxes
    ...allDietTypes.map(diet => ({
      label: t(`boxes.diet${diet.charAt(0).toUpperCase() + diet.slice(1)}`, diet),
      icon: null,
      render: (box) => {
        const hasIt = box.meals?.some(m => m.dietType === diet);
        return hasIt
          ? <Check className="w-5 h-5 text-green-500 mx-auto" />
          : <X className="w-5 h-5 text-gray-300 mx-auto" />;
      },
    })),
    // One row per unique allergen across all boxes
    ...allAllergens.map(allergen => ({
      label: t('boxDetails.containsAllergenName', { allergen: t(`allergens.${allergen.toLowerCase()}`, allergen) }),
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      render: (box) => {
        const hasIt = box.meals?.some(m => m.allergens?.includes(allergen));
        return hasIt
          ? <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">{t('boxDetails.yesLabel', '⚠️ Yes')}</span>
          : <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">{t('boxDetails.noLabel', '✓ No')}</span>;
      },
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-6">
          <button onClick={() => navigate('/boxes')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {t('boxDetails.backToBoxes', 'Back to Boxes')}
          </button>
          <h1 className="font-display text-3xl font-bold text-gray-900">{t('boxDetails.compareTitle', 'Compare Boxes')}</h1>
          <p className="text-gray-500 mt-1">{t('boxDetails.compareSubtitle', 'Side-by-side comparison to help you decide')}</p>
        </div>
      </div>

      <div className="page-container py-8">

        {/* ===== MOBILE ===== */}
        <div className="block md:hidden space-y-6">
          {boxes.map((box) => (
            <div key={box._id} className="card overflow-hidden">
              <div className="relative">
                <img
                  src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'}
                  alt={box.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-display font-black text-white text-xl">{box.name}</h3>
                  <p className="text-white/80 text-xs mt-1 line-clamp-2">{box.description}</p>
                </div>
                {priceFor2(box) === minPrice && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Best Value
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {rows.map((row, idx) => (
                  <div key={idx} className={`flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      {row.icon && <span className="text-brand-500">{row.icon}</span>}
                      {row.label}
                    </div>
                    <div className="text-right">{row.render(box)}</div>
                  </div>
                ))}
              </div>

              <div className="p-4">
                <button onClick={() => handleAddToCart(box)} className="btn-primary w-full flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ===== DESKTOP ===== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="w-40 text-left pb-6 pr-4">
                  <span className="text-sm font-medium text-gray-400">{t('boxDetails.compareFeatures', 'Features')}</span>
                </th>
                {boxes.map(box => (
                  <th key={box._id} className="pb-6 px-4">
                    <div className={`card p-4 text-center ${priceFor2(box) === minPrice ? 'ring-2 ring-green-400' : ''}`}>
                      {priceFor2(box) === minPrice && (
                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2">
                          <Trophy className="w-3 h-3" /> {t('boxDetails.bestValue', 'Best Value')}
                        </div>
                      )}
                      <img
                        src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'}
                        alt={box.name}
                        className="w-full h-32 object-cover rounded-xl mb-3"
                      />
                      <h3 className="font-display font-bold text-gray-900 text-base mb-1">{box.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{box.description}</p>
                      <button onClick={() => handleAddToCart(box)} className="btn-primary w-full text-sm py-2">
                        {t('boxDetails.addtocart', 'Add to Cart')}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-4 pr-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {row.icon && <span className="text-brand-500">{row.icon}</span>}
                      {row.label}
                    </div>
                  </td>
                  {boxes.map(box => (
                    <td key={box._id} className="py-4 px-4 text-center">
                      {row.render(box)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}