import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { sampleBoxes } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import toast from 'react-hot-toast';
import { ChevronLeft, Users, Clock, Flame, ShoppingCart, Repeat, Star, ChefHat, AlertCircle, PenLine, X, CheckCircle, ArrowUpDown, Heart } from 'lucide-react';
import StarRating from '../components/StarRating';

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

const avatarColors = [
  'bg-purple-100 text-purple-600',
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-pink-100 text-pink-600',
  'bg-orange-100 text-orange-600',
];

function getAvatarColor(name) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

export default function BoxDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);
  const [adding, setAdding] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    setTimeout(() => {
      const found = sampleBoxes.find(b => b._id === id);
      if (found) {
        setBox(found);
        setReviews(found.reviews || []);
      } else navigate('/boxes');
      setLoading(false);
    }, 200);
  }, [id]);

  const currentPricing = box?.pricingOptions?.[servings];
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const favorited = box ? isFavorite(box._id) : false;

  const handleFavorite = () => {
    if (!user) {
      toast.error('Please log in to save favorites');
      return;
    }
    toggleFavorite(box._id);
    toast.success(favorited ? 'Removed from favorites' : 'Added to favorites! ❤️');
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return 0;
  });

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

  const handleSubmitReview = () => {
    if (newRating === 0) { toast.error('Please select a star rating!'); return; }
    if (!newComment.trim()) { toast.error('Please write a comment!'); return; }

    const alreadyReviewed = reviews.some(r => r.name === user?.name);
    if (alreadyReviewed) {
      toast.error('You have already reviewed this box!');
      return;
    }

    const review = {
      _id: `r-new-${Date.now()}`,
      name: user?.name || 'Anonymous',
      rating: newRating,
      comment: newComment.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
    setReviews(prev => [review, ...prev]);
    setNewRating(0);
    setHoverRating(0);
    setNewComment('');
    setShowForm(false);
    toast.success('Review submitted successfully! 🎉');
  };

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
  const charLimit = 500;
  const charsLeft = charLimit - newComment.length;

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
      <Helmet>
        <title>{box ? `${box.name} — Boxify` : 'Boxify'}</title>
        <meta name="description" content={box?.description || ''} />
        <link rel="canonical" href={`https://boxify.com/boxes/${box?._id}`} />
        <meta property="og:title" content={box ? `${box.name} — Boxify` : 'Boxify'} />
        <meta property="og:description" content={box?.description || ''} />
        <meta property="og:image" content={box?.image || ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={box ? `${box.name} — Boxify` : 'Boxify'} />
        <meta name="twitter:description" content={box?.description || ''} />
        <meta name="twitter:image" content={box?.image || ''} />
      </Helmet>

      {/* Header Image */}
      <div className="relative h-72 md:h-96">
        <img src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200'} alt={box.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back + Heart على الصورة */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <button onClick={() => navigate('/boxes')} className="bg-white/90 backdrop-blur-sm text-gray-800 font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {/* ✅ Heart Button على الصورة */}
          <button
            onClick={handleFavorite}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
              favorited
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white/90 text-gray-400 hover:text-red-500 hover:scale-110'
            }`}
          >
            <Heart className={`w-5 h-5 ${favorited ? 'fill-white' : ''}`} />
          </button>
        </div>

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
              <div className="grid grid-cols-1 gap-4">
                {box.pricingOptions?.[servings]?.mealDetails?.map((meal) => (
                  <div key={meal._id} className="card p-4 flex gap-4">
                    <img src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} alt={meal.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{meal.name}</h3>
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

            {/* REVIEWS SECTION */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>
                <button
                  onClick={() => setShowForm(prev => !prev)}
                  className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2 whitespace-nowrap"
                >
                  <PenLine className="w-4 h-4 flex-shrink-0" />
                  <span>Review</span>
                </button>
              </div>

              {/* Rating Summary */}
              {avgRating && (
                <div className="card p-6 mb-4">
                  <div className="flex items-center gap-8">
                    <div className="text-center flex-shrink-0">
                      <div className="text-6xl font-display font-black text-gray-900 leading-none mb-2">{avgRating}</div>
                      <StarRating rating={Math.round(avgRating)} size="md" />
                      <div className="text-sm text-gray-400 mt-2">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3 mb-2">
                            <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-4">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Write Review Form */}
              {showForm && (
                <div className="card p-6 mb-6 border-2 border-brand-200 bg-brand-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-gray-900 text-lg">Write Your Review</h3>
                    <button onClick={() => { setShowForm(false); setNewRating(0); setHoverRating(0); setNewComment(''); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Your Rating</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-8 h-8 cursor-pointer transition-all duration-150 ${
                              star <= (hoverRating || newRating)
                                ? 'text-yellow-400 fill-yellow-400 scale-110'
                                : 'text-gray-300 fill-gray-200'
                            }`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setNewRating(star)}
                          />
                        ))}
                      </div>
                      {(hoverRating || newRating) > 0 && (
                        <span className="text-sm font-medium text-brand-600 ml-2">
                          {ratingLabels[hoverRating || newRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Review</p>
                    <textarea
                      value={newComment}
                      onChange={e => { if (e.target.value.length <= charLimit) setNewComment(e.target.value); }}
                      placeholder="Share your experience — what did you love about this box?"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-brand-400 resize-none bg-white"
                    />
                    <div className={`text-xs text-right mt-1 ${charsLeft <= 50 ? 'text-red-400' : 'text-gray-400'}`}>
                      {charsLeft} characters remaining
                    </div>
                  </div>

                  <button onClick={handleSubmitReview} className="btn-primary w-full py-3">
                    Submit Review
                  </button>
                </div>
              )}

              {/* Empty State */}
              {reviews.length === 0 && !showForm && (
                <div className="card p-10 text-center">
                  <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="font-display font-bold text-gray-900 text-lg mb-2">No reviews yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Be the first to review this box and help others decide!</p>
                  <button onClick={() => setShowForm(true)} className="btn-primary px-6">
                    Write the First Review
                  </button>
                </div>
              )}

              {/* Sort + Review Cards */}
              {reviews.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-400 bg-white"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sortedReviews.map(review => (
                      <div key={review._id} className="card p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getAvatarColor(review.name)}`}>
                              {review.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-900 whitespace-nowrap">{review.name}</span>
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">{review.date}</div>
                            </div>
                          </div>
                          <StarRating rating={review.rating} size="md" />
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
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
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
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

              {avgRating && (
                <div className="flex items-center gap-2 mb-4 bg-yellow-50 rounded-xl px-3 py-2">
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <span className="text-sm font-medium text-gray-700">{avgRating}</span>
                  <span className="text-sm text-gray-400">({reviews.length} reviews)</span>
                </div>
              )}

              <button onClick={handleAddToCart} disabled={adding} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>

              {/* ✅ Heart Button في الـ Order Panel */}
              <button
                onClick={handleFavorite}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all mb-3 ${
                  favorited
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`} />
                {favorited ? 'Saved to Favorites' : 'Save to Favorites'}
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