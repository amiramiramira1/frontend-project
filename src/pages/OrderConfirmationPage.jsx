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
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT COLUMN */}
          <div className="card p-8">
            {/* Success icon + heading */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shrink-0">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-black text-gray-900">Order Confirmed! 🎉</h1>
                <p className="text-gray-500 text-sm">Your meal box is being prepared with fresh ingredients.</p>
              </div>
            </div>

            {/* Order details */}
            <div className="bg-brand-50 rounded-2xl p-5 mb-4 text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-600">Order Number</span>
                <span className="font-display font-bold text-brand-700 text-lg">{order.orderNumber}</span>
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

            {/* Delivery details */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-4 text-left">
              <h3 className="font-semibold text-gray-700 mb-3">Delivery Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-900">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{order.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-900">{order.deliveryAddress?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-gray-900 text-right">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</span>
                </div>
              </div>
            </div>

            {/* Delivery date + time slot */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 text-sm mb-3">
                <Truck className="w-5 h-5 text-brand-500 shrink-0" />
                <div>
                  <div className="font-medium text-gray-700">Estimated Delivery</div>
                  <div className="text-brand-600 font-semibold">{formatted}</div>
                </div>
              </div>
              {order.timeSlot && (
                <div className="flex items-center gap-3 text-sm border-t border-gray-200 pt-3">
                  <Clock className="w-5 h-5 text-brand-500 shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">Time Slot</div>
                    <div className="text-brand-600 font-semibold">{order.timeSlot}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Timeline */}
            {/*<OrderTimeline status={order.status} />*/}
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
          </div>

          {/* RIGHT COLUMN */}
          <div className="card p-8">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-5">Order Summary</h2>

            {/* Items list */}
            <div className="space-y-3 mb-6">
              {order.items?.map(item => (
                <div key={item._id} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {item.type === 'pre-made-box' ? item.boxName : 'Custom Box'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity || 1}</div>
                  </div>
                  <span className="font-semibold text-gray-900">{item.totalPrice?.toLocaleString()} EGP</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{order.totalPrice?.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span className="text-brand-600 text-lg">{order.totalPrice?.toLocaleString()} EGP</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Link to="/dashboard/orders" className="btn-primary flex items-center justify-center gap-2">
                <Package className="w-4 h-4" /> Track Order
              </Link>
              <Link to="/boxes" className="btn-secondary text-center">
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
