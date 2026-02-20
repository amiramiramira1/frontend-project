import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Package, Clock, MapPin, CheckCircle, Truck, XCircle, ChefHat } from 'lucide-react';

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

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
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
                      {item.boxSnapshot?.name} · {item.mealsCount} meals · {item.servingsPerMeal} {item.servingsPerMeal === 1 ? 'person' : 'people'}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.deliveryAddress?.city}</span>
                  <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {new Date(order.deliveryDate).toLocaleDateString('en-EG')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
