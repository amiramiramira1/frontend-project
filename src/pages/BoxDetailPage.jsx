import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { ChevronLeft, Users, Clock, Flame, ShoppingCart, Repeat, Star, ChefHat, AlertCircle } from 'lucide-react';

const servingOptions = [
  { value: 1, label: '1 Person' },
  { value: 2, label: '2 People', popular: true },
  { value: 4, label: '4 People' },
  { value: 6, label: '6 People' },
];

const dietTagColors = {
  'vegetarian': 'badge-green',
  'vegan': 'badge-green',
  'gluten-free': 'badge-orange',
  'dairy-free': 'badge-blue',
  'high-protein': 'badge-red',
};

export default function BoxDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get(`/boxes/${id}`)
      .then(({ data }) => setBox(data))
      .catch(() => navigate('/boxes'))
      .finally(() => setLoading(false));
  }, [id]);

  const currentPricing = box?.pricingOptions?.[servings];

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart({ type: 'pre-made-box', boxId: box._id, servingsPerMeal: servings });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleSubscribe = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/subscribe?boxId=${box._id}&servings=${servings}&type=pre-made&name=${encodeURIComponent(box.name)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!box) return null;

  const allTags = [...new Set(box.pricingOptions?.[servings]?.mealDetails?.flatMap(m => m.dietaryTags || []) || [])];
  const allergens = [...new Set(box.pricingOptions?.[servings]?.mealDetails?.flatMap(m => m.allergens || []) || [])];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-72 md:h-96">
        <img src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200'} alt={box.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button onClick={() => navigate('/boxes')} className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-gray-800 font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-brand-500 text-white">{box.category}</span>
            {box.featured && <span className="badge bg-yellow-400 text-yellow-900">⭐ Featured</span>}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-white">{box.name}</h1>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <p className="text-gray-600 text-lg leading-relaxed mb-4">{box.description}</p>
              <div className="flex gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><ChefHat className="w-4 h-4 text-brand-500" /> {box.mealsCount} Meals</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-500" /> Serves {box.availableServings?.join(', ')}</span>
              </div>
            </div>

            {/* Meals */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">What's Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {box.pricingOptions?.[servings]?.mealDetails?.map((meal) => (
                  <div key={meal._id} className="card p-4 flex gap-4">
                    <img src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} alt={meal.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{meal.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 mb-2 line-clamp-2">{meal.description}</p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meal.prepTime}m</span>
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {meal.caloriesPerServing} cal</span>
                        <span className="font-medium text-brand-600">{(meal.pricePerServing * servings).toFixed(0)} EGP</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {meal.dietaryTags?.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${dietTagColors[tag] || 'badge-gray'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Allergens */}
            {allergens.length > 0 && (
              <div className="card p-4 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="flex items-center gap-2 font-semibold text-yellow-800 mb-1">
                  <AlertCircle className="w-4 h-4" /> Contains Allergens
                </div>
                <p className="text-sm text-yellow-700">{allergens.join(' · ')}</p>
              </div>
            )}
          </div>

          {/* Right: Order Panel */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold mb-4">Choose Serving Size</h2>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {servingOptions.filter(o => box.availableServings?.includes(o.value)).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setServings(opt.value)}
                    className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                      servings === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 hover:border-brand-300 text-gray-700'
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-brand-500 text-white rounded-full px-2 py-0.5">Popular</span>
                    )}
                    <Users className="w-4 h-4 mx-auto mb-1 text-current" />
                    <span className="font-medium text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{box.mealsCount} meals × {servings} {servings === 1 ? 'person' : 'people'}</span>
                  <span>{currentPricing?.pricePerServing?.toFixed(0)} EGP/serving</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <div className="text-right">
                    <span className="text-3xl font-display font-black text-brand-600">
                      {currentPricing?.totalPrice?.toLocaleString() || '—'}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">EGP</span>
                  </div>
                </div>
                {currentPricing?.totalCalories && (
                  <div className="text-xs text-gray-400 text-right mt-1">{currentPricing.totalCalories.toLocaleString()} total calories</div>
                )}
              </div>

              <button onClick={handleAddToCart} disabled={adding} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>

              <button onClick={handleSubscribe} className="btn-outline w-full flex items-center justify-center gap-2">
                <Repeat className="w-4 h-4" />
                Subscribe Weekly
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">Free delivery • Fresh ingredients</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
