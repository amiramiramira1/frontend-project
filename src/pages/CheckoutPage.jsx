import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { promoCodes, sampleMeals } from '../data/mockData';
import toast from 'react-hot-toast';
import { MapPin, Phone, Truck, CreditCard, Package, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || 'Cairo',
    zip: user?.addresses?.[0]?.zip || '',
    phone: user?.addresses?.[0]?.phone || '',
  });

  const cities = ['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta', 'Zagazig', 'Ismailia', 'Suez'];
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const discountedTotal = appliedPromo
    ? cart.cartTotal - cart.cartTotal * appliedPromo.discount
    : cart.cartTotal;

    const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (promoCodes[code]) {
      setAppliedPromo({ code, ...promoCodes[code] });
      setPromoError('');
      toast.success(`Promo applied: ${promoCodes[code].label}`);
    } else {
      setPromoError('Invalid promo code');
      setAppliedPromo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.street || !form.city || !form.phone) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmitting(true);
    try {
      // Mock order creation
      await new Promise(r => setTimeout(r, 600));
      const mockOrder = {
        _id: 'order-' + Date.now(),
        orderNumber: 'BX-' + Math.floor(100000 + Math.random() * 900000),
        totalPrice: discountedTotal,         
        originalPrice: cart.cartTotal,        
        appliedPromo: appliedPromo || null,   
        deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'cash_on_delivery',
        status: 'pending',
      };
      await clearCart();
      navigate('/order-confirmation', { state: { order: mockOrder } });
    } catch (err) {
      toast.error('Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.items?.length) {
    navigate('/cart'); return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <h1 className="font-display text-4xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="page-container py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-500" /> Delivery Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
                    <input required value={form.street} onChange={e => setForm(p => ({ ...p, street: e.target.value }))} className="input-field" placeholder="15 Tahrir Square, Apt 3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                    <select required value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="input-field">
                      {cities.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code</label>
                    <input value={form.zip} onChange={e => setForm(p => ({ ...p, zip: e.target.value }))} className="input-field" placeholder="11511" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field pl-11" placeholder="01012345678" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-500" /> Payment Method
                </h2>
                <div className="flex items-center gap-4 p-4 bg-brand-50 border-2 border-brand-500 rounded-xl">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-brand-900">Cash on Delivery</div>
                    <div className="text-sm text-brand-700">Pay when your order arrives</div>
                  </div>
                  <div className="ml-auto w-5 h-5 border-2 border-brand-500 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex gap-3">
                <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Estimated Delivery:</strong> 3-5 business days after your order is confirmed.
                  You'll receive a confirmation shortly.
                </div>
              </div>
            </div>

            {/* Summary */}
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
                <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        placeholder="Promo code"
                        className="input-field text-sm flex-1"
                      />
                      <button type="button" onClick={handleApplyPromo} className="btn-primary px-4 text-sm">
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                    {appliedPromo && <p className="text-xs text-green-600 mt-1">✓ {appliedPromo.label} applied!</p>}
                  </div>
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between items-center mt-4 pt-2">
                    <span className="font-bold text-gray-800">Total</span>
                    <div className="text-right">
                        {appliedPromo && (
                          <div className="text-sm text-gray-400 line-through">{cart.cartTotal?.toLocaleString()} EGP</div>
                        )}
                        <div className="text-2xl font-display font-black text-brand-600">{discountedTotal?.toLocaleString()} EGP</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
                  <Package className="w-4 h-4" />
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
