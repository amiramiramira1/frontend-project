import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Pencil, X, Check } from 'lucide-react';

export default function CartPage() {
  const { cart, removeItem, updateItem, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState([]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Please sign in</h2>
          <p className="text-gray-500 mb-6">You need to be logged in to view your cart.</p>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const isEmpty = !cart.items || cart.items.length === 0;

  const handleQuantityChange = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) {
      await removeItem(item._id);
      toast.success('Item removed');
    } else {
      await updateItem(item._id, { quantity: newQty });
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setSelectedMeals((item.meals || []).map(m => m._id));
  };

  const handleToggleMeal = (mealId) => {
    setSelectedMeals(prev =>
      prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
    );
  };

  const handleSaveEdit = async () => {
    if (selectedMeals.length === 0) return;
    const updatedMeals = sampleMeals.filter(m => selectedMeals.includes(m._id));
    const newTotalPrice = updatedMeals.reduce(
      (sum, m) => sum + m.pricePerServing * editingItem.servingsPerMeal, 0
    ) * (editingItem.quantity || 1);
    await updateItem(editingItem._id, {
      meals: updatedMeals,
      mealsCount: updatedMeals.length,
      totalPrice: newTotalPrice,
    });
    toast.success('Box updated!');
    setEditingItem(null);
  };

  const handleRemove = async (id) => {
    await removeItem(id);
    toast.success('Removed from cart');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100">
          <div className="page-container py-8">
            <h1 className="font-display text-4xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-brand-500" /> Your Cart
            </h1>
          </div>
        </div>

        <div className="page-container py-8">
          {isEmpty ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-700 mb-3">Your cart is empty</h2>
              <p className="text-gray-400 mb-6">Add some delicious meal boxes to get started!</p>
              <Link to="/boxes" className="btn-primary">Browse Meal Boxes</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => (
                  <div key={item._id} className="card p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex gap-1 flex-shrink-0">
                        {(item.meals || []).slice(0, 3).map((meal, idx) => (
                          <div key={meal._id || idx} className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {meal.image
                              ? <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                            }
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display font-bold text-gray-900">
                              {item.type === 'pre-made-box' ? item.boxName : (item.customBox?.name || 'Custom Box')}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {item.mealsCount} meals · {item.servingsPerMeal} {item.servingsPerMeal === 1 ? 'person' : 'people'}
                            </p>
                            {item.meals && (
                              <div className="mt-2 text-xs text-gray-500">
                                <div className="font-medium text-gray-700 mb-1">Box Contents:</div>
                                <div className="flex flex-wrap gap-1">
                                  {item.meals.map(m => (
                                    <span key={m._id} className="px-1 py-1 bg-gray-100 text-gray-700 rounded">
                                      {m.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <span className={`text-xs mt-1 inline-block badge ${item.type === 'custom-box' ? 'badge-blue' : 'badge-orange'}`}>
                              {item.type === 'custom-box' ? 'Custom Box' : 'Pre-Made Box'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleOpenEdit(item)} className="text-gray-400 hover:text-brand-500 transition-colors p-1">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemove(item._id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleQuantityChange(item, -1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-semibold text-gray-900 w-6 text-center">{item.quantity || 1}</span>
                            <button onClick={() => handleQuantityChange(item, 1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-display font-bold text-lg text-brand-600">{item.totalPrice?.toLocaleString()} EGP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="card p-6 sticky top-24">
                  <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {cart.items.map(item => (
                      <div key={item._id} className="flex justify-between">
                        <span className="truncate pr-2">{item.type === 'pre-made-box' ? item.boxName : 'Custom Box'} ×{item.quantity || 1}</span>
                        <span className="font-medium text-gray-900">{item.totalPrice?.toLocaleString()} EGP</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="font-semibold text-gray-700">Total</span>
                      <div className="text-right">
                          <span className="text-2xl font-display font-black text-brand-600">{cart.cartTotal?.toLocaleString()} EGP</span>
                        <div className="text-xs text-gray-400">Cash on Delivery</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2">
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link to="/boxes" className="btn-secondary w-full text-center block mt-3">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Box Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-display font-bold text-lg text-gray-900">Edit Box</h2>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-3 flex-1">
              {sampleMeals.map(meal => {
                const isSelected = selectedMeals.includes(meal._id);
                return (
                  <div
                    key={meal._id}
                    onClick={() => handleToggleMeal(meal._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected ? 'border-brand-400 bg-brand-50' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      {meal.image
                        ? <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{meal.name}</p>
                      <p className="text-xs text-gray-500">{meal.pricePerServing} EGP · {meal.caloriesPerServing} cal</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3 text-center">
                {selectedMeals.length} meal{selectedMeals.length !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={handleSaveEdit}
                disabled={selectedMeals.length === 0}
                className="btn-primary w-full disabled:opacity-40"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}