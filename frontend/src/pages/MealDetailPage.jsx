import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { ChevronLeft, Flame, DollarSign, ChefHat, CheckCircle2, AlertTriangle, Scale, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

const dietTagColors = {
  'vegetarian': 'bg-green-50 text-green-700 border-green-200',
  'vegan':      'bg-green-100 text-green-800 border-green-300',
  'keto':       'bg-amber-50 text-amber-700 border-amber-200',
  'paleo':      'bg-orange-50 text-orange-700 border-orange-200',
  'standard':   'bg-blue-50 text-blue-700 border-blue-200',
};

export default function MealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);

  useEffect(() => {
    const fetchMeal = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/meals/${id}`);
        setMeal(data.meal);
      } catch (err) {
        toast.error(t('msg.loadMealsFailed') || 'Failed to load meal details');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchMeal();
  }, [id, navigate, t, i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!meal) return null;

  // Quantitative stock categorization
  let stockStatus = 'inStock';
  let badgeColor = 'bg-green-100 text-green-800 border-green-200';
  
  if (meal.inStock === false || meal.stockQuantity === 0) {
    stockStatus = 'outOfStock';
    badgeColor = 'bg-red-100 text-red-800 border-red-200';
  } else if (meal.stockQuantity > 0 && meal.stockQuantity <= 5) {
    stockStatus = 'lowStock';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  }

  // Calculate pricing based on servings
  const multiplier = MULTIPLIERS[servings] || 1;
  const currentPricePerServing = parseFloat((meal.pricePerServing * multiplier).toFixed(2));
  const currentCalories = Math.round(meal.caloriesPerServing * multiplier);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Helmet>
        <title>{meal.name} — Boxify</title>
        <meta name="description" content={meal.description || ''} />
      </Helmet>

      {/* Hero Image Section */}
      <div className="relative h-80 md:h-[450px]">
        <img 
          src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200'} 
          alt={meal.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm text-gray-800 font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-md text-sm border border-gray-100"
        >
          <ChevronLeft className="w-4 h-4" /> {t('verify.goBack', { defaultValue: 'Back' })}
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-sm ${badgeColor}`}>
              {t(`mealDetails.${stockStatus}`)}
            </span>
            {meal.dietType && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-sm ${dietTagColors[meal.dietType] || 'bg-gray-100 text-gray-700'}`}>
                {t(`boxes.diet${meal.dietType.charAt(0).toUpperCase() + meal.dietType.slice(1)}`, { defaultValue: meal.dietType })}
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-white drop-shadow-md">{meal.name}</h1>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Center - Meal Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description */}
            <div className="card p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">{t('mealDetails.title')}</h2>
              <p className="text-gray-600 text-lg leading-relaxed">{meal.description}</p>
            </div>

            {/* Scale Ingredients & Serving Multiplier selector */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-brand-500" />
                    {t('mealDetails.ingredients')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{t('mealDetails.scalingDesc', 'Scale ingredient amounts based on your portion size')}</p>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-xl self-start sm:self-center">
                  {[1, 2, 4, 6].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setServings(opt)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        servings === opt 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {opt} {opt === 1 ? t('subs.person') : t('subs.people')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients List */}
              <div className="divide-y divide-gray-100">
                {meal.ingredients?.map((item) => {
                  const ing = item.ingredient;
                  if (!ing) return null;
                  const computedQty = parseFloat((item.quantity * multiplier).toFixed(1));
                  return (
                    <div key={ing._id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                          {ing.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{ing.name}</span>
                      </div>
                      <span className="text-sm text-gray-600 font-semibold bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                        {computedQty} {ing.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Allergens warning */}
            {meal.allergens && meal.allergens.length > 0 && (
              <div className="card p-5 border-l-4 border-amber-400 bg-amber-50/50 flex gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 text-sm mb-1">{t('mealDetails.allergens')}</h4>
                  <p className="text-sm text-amber-700 capitalize leading-relaxed">
                    {meal.allergens.map(a => t(`allergens.${a.toLowerCase()}`, a)).join(' · ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Summary & CTA */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24 space-y-6">
              
              {/* Quick nutritional stats */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">{t('mealDetails.nutritionalSpecs', 'Nutritional Specs')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                    <div className="font-black text-gray-900 text-xl">{currentCalories}</div>
                    <div className="text-xs text-gray-400 mt-1">{t('mealDetails.calories')}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
                    <Utensils className="w-5 h-5 text-brand-500 mx-auto mb-2" />
                    <div className="font-black text-gray-900 text-xl capitalize">{t(`cuisine.${meal.cuisine?.toLowerCase()}`, meal.cuisine)}</div>
                    <div className="text-xs text-gray-400 mt-1">{t('mealDetails.cuisine')}</div>
                  </div>
                </div>
              </div>

              {/* Price display */}
              <div className="bg-brand-50/50 border border-brand-100 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-brand-700 font-semibold">{t('mealDetails.price')}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t('mealDetails.scaledFor', 'scaled for')} {servings} {servings === 1 ? t('subs.person') : t('subs.people')}</div>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-brand-600 text-2xl">{currentPricePerServing.toFixed(0)}</span>
                  <span className="text-xs font-semibold text-brand-600 ml-1">EGP</span>
                </div>
              </div>

              {/* CTA button */}
              <button 
                onClick={() => navigate('/build-box')}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 text-sm"
              >
                <ChefHat className="w-4 h-4" />
                {t('home.buildCustom')}
              </button>

              <p className="text-xs text-gray-400 text-center">
                {t('mealDetails.portionedWith', 'Portioned with fresh, locally sourced Egyptian ingredients.')}
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
