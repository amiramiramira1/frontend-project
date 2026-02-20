import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Clock, ArrowRight } from 'lucide-react';

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) {
    navigate('/');
    return null;
  }

  const deliveryDate = new Date(order.deliveryDate);
  const formatted = deliveryDate.toLocaleDateString('en-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="card p-10">
          {/* Success icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-slow">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="font-display text-3xl font-black text-gray-900 mb-2">Order Confirmed! 🎉</h1>
          <p className="text-gray-500 mb-6">Your meal box is being prepared with fresh ingredients.</p>

          <div className="bg-brand-50 rounded-2xl p-5 mb-6 text-left">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Order Number</span>
              <span className="font-display font-bold text-brand-700 text-lg">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Total Paid</span>
              <span className="font-bold text-gray-900">{order.totalPrice?.toLocaleString()} EGP</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Payment</span>
              <span className="badge badge-orange">Cash on Delivery</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <span className="badge badge-blue">Pending</span>
            </div>
          </div>

          {/* Delivery timeline */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-5 h-5 text-brand-500 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-gray-700">Estimated Delivery</div>
                <div className="text-brand-600 font-semibold">{formatted}</div>
              </div>
            </div>
          </div>

          {/* Order progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Pending', 'Preparing', 'Delivered', 'Paid'].map((step, idx) => (
              <div key={step} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {idx + 1}
                </div>
                {idx < 3 && <div className="w-6 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard/orders" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> Track Order
            </Link>
            <Link to="/boxes" className="btn-secondary flex-1 text-center">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
