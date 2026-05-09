import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Package, Clock, MapPin, CheckCircle, Truck, XCircle, ChefHat, Download, AlertCircle } from 'lucide-react';
import { generateReceipt } from '../../utils/generateReceipt';
import OrderTimeline from '../../components/OrderTimeline';

// All statuses from the backend Order model
const statusConfig = {
  pending:          { label: 'Pending',          color: 'badge-orange', icon: Clock },
  confirmed:        { label: 'Confirmed',         color: 'badge-blue',   icon: CheckCircle },
  preparing:        { label: 'Preparing',         color: 'badge-blue',   icon: ChefHat },
  shipped:          { label: 'Shipped',           color: 'badge-blue',   icon: Truck },
  out_for_delivery: { label: 'Out for Delivery',  color: 'badge-blue',   icon: Truck },
  delivered:        { label: 'Delivered',         color: 'badge-green',  icon: CheckCircle },
  cancelled:        { label: 'Cancelled',         color: 'badge-red',    icon: XCircle },
};

// Show a short, readable order reference from the MongoDB _id
const shortId = (id) => id?.slice(-8).toUpperCase() ?? '—';

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    // GET /api/orders/my → { orders: [...], pagination: {} }
    // Each item: { box: { _id, name, image }, servingSize, quantity, priceAtPurchase }
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="card p-6 flex items-center gap-3 text-red-600 bg-red-50 border border-red-200">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm">{error}</p>
    </div>
  );

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">My Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-14 card">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders yet</h3>
          <p className="text-gray-400 mb-4">Start browsing and place your first order!</p>
          <Link to="/boxes" className="btn-primary">Browse Boxes</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = statusConfig[order.status] || statusConfig.pending;
            const Icon = st.icon;

            return (
              <div key={order._id} className="card p-5">
                {/* Header row */}
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    {/* Backend has no orderNumber — show last 8 chars of _id */}
                    <h3 className="font-display font-bold text-gray-900">
                      Order #{shortId(order._id)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-EG', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${st.color} flex items-center gap-1.5`}>
                      <Icon className="w-3 h-3" /> {st.label}
                    </span>
                    <span className="font-display font-bold text-brand-600">
                      {order.totalPrice?.toLocaleString()} EGP
                    </span>
                    <button
                      onClick={() => generateReceipt(order)}
                      title="Download Receipt"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Order items — item.box is populated with { _id, name, image } */}
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <Link
                        to={`/boxes/${item.box?._id}`}
                        className="text-brand-600 hover:underline font-medium"
                      >
                        {item.box?.name || 'Meal Box'}
                      </Link>
                      <span className="text-gray-400">
                        × {item.quantity || 1} · {item.servingSize} {item.servingSize === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {order.deliveryAddress?.city || 'Cairo'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {order.orderType === 'subscription' ? 'Subscription' : 'One-time'}
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    className="text-xs text-brand-600 font-semibold hover:underline"
                  >
                    {expandedOrder === order._id ? 'Hide Tracking' : 'Track Order'}
                  </button>
                </div>

                {/* Order tracking timeline */}
                {expandedOrder === order._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <OrderTimeline status={order.status} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
