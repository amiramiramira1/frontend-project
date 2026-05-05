import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Package, Clock, MapPin, CheckCircle, Truck, XCircle, ChefHat } from 'lucide-react';
import OrderTimeline from '../../components/OrderTimeline';

const statusConfig = {
  pending: { label: 'Pending', color: 'badge-orange', icon: Clock },
  preparing: { label: 'Preparing', color: 'badge-blue', icon: ChefHat },
  out_for_delivery: { label: 'Out for Delivery', color: 'badge-blue', icon: Truck },
  delivered: { label: 'Delivered', color: 'badge-green', icon: CheckCircle },
  paid: { label: 'Paid', color: 'badge-green', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'badge-red', icon: XCircle },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/orders')
    .then(({ data }) => setOrders(data))
    .catch(() => {
      const saved = JSON.parse(localStorage.getItem('boxify_orders') || '[]');
      setOrders(saved);
    })
    .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );

  const handleCancel = async (id) => {
    try {
      await api.patch(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
    } catch {
      const saved = JSON.parse(localStorage.getItem('boxify_orders') || '[]');
      const updated = saved.map(o => o._id === id ? { ...o, status: 'cancelled' } : o);
      localStorage.setItem('boxify_orders', JSON.stringify(updated));
      setOrders(updated);
      toast.success('Order cancelled');
    }
    setCancelId(null);
  };

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
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <h3 className="font-display font-bold text-gray-900">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-EG', { year:'numeric', month:'long', day:'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${st.color} flex items-center gap-1.5`}>
                      <Icon className="w-3 h-3" /> {st.label}
                    </span>
                    <span className="font-display font-bold text-brand-600">{order.totalPrice?.toLocaleString()} EGP</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-brand-400" />
                      <Link
                        to={`/boxes/${item.boxId}`}
                        className="text-brand-600 hover:underline font-medium"
                      >
                        {item.type === 'pre-made-box' ? item.boxName : 'Custom Box'}
                      </Link>
                      × {item.quantity || 1}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.deliveryAddress?.city || 'Cairo'}</span>
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {new Date(order.deliveryDate).toLocaleDateString('en-EG')}</span>
                </div>
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                {expandedOrder === order._id ? 'Hide Tracking' : 'Track Order'}
                </button>
              </div>

              {expandedOrder === order._id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <OrderTimeline status={order.status} />
                </div>
              )}

              {order.status === 'pending' && (
                <div className="pt-3 border-t border-gray-100 mt-3">
                  <button
                    onClick={() => setCancelId(order._id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </button>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="pt-3 border-t border-gray-100 mt-3">
                  <button
                    onClick={() => {
                      const saved = JSON.parse(localStorage.getItem('boxify_orders') || '[]');
                      const updated = saved.filter(o => o._id !== order._id);
                      localStorage.setItem('boxify_orders', JSON.stringify(updated));
                      setOrders(updated);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Remove
                  </button>
                </div>
              )}

              </div>
            );
          })}
        </div>
      )}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">Cancel Order?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCancel(cancelId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-colors"
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
