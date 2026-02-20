import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package } from 'lucide-react';

export default function CartPage() {
  const { cart, removeItem, updateItem, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleRemove = async (id) => {
    await removeItem(id);
    toast.success('Removed from cart');
  };

  return (
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
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-100 to-brand-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-7 h-7 text-brand-600" />
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
                          <span className={`text-xs mt-1 inline-block badge ${item.type === 'custom-box' ? 'badge-blue' : 'badge-orange'}`}>
                            {item.type === 'custom-box' ? 'Custom Box' : 'Pre-Made Box'}
                          </span>
                        </div>
                        <button onClick={() => handleRemove(item._id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                      <div className="text-2xl font-display font-black text-brand-600">{cart.cartTotal?.toLocaleString()} EGP</div>
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
  );
}
