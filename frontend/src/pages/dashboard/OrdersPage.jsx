import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Package, Clock, MapPin, CheckCircle, Truck, XCircle, ChefHat, Download, AlertCircle } from 'lucide-react';
import { generateReceipt } from '../../utils/generateReceipt';
import OrderTimeline from '../../components/OrderTimeline';

export default function OrdersPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const statusConfig = {
    pending:          { labelKey: 'orders.pending',        color: 'badge-orange', icon: Clock },
    confirmed:        { labelKey: 'orders.confirmed',       color: 'badge-blue',   icon: CheckCircle },
    preparing:        { labelKey: 'orders.preparing',       color: 'badge-blue',   icon: ChefHat },
    shipped:          { labelKey: 'orders.shipped',         color: 'badge-blue',   icon: Truck },
    out_for_delivery: { labelKey: 'orders.outForDelivery',  color: 'badge-blue',   icon: Truck },
    delivered:        { labelKey: 'orders.delivered',       color: 'badge-green',  icon: CheckCircle },
    cancelled:        { labelKey: 'orders.cancelled',       color: 'badge-red',    icon: XCircle },
  };

  const shortId = (id) => id?.slice(-8).toUpperCase() ?? '—';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => setError(t('msg.loadOrdersFailed')))
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
      <h2 className="font-display text-2xl font-bold mb-6">{t('orders.title')}</h2>
      {orders.length === 0 ? (
        <div className="text-center py-14 card">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('orders.emptyTitle')}</h3>
          <p className="text-gray-400 mb-4">{t('orders.emptyDesc')}</p>
          <Link to="/boxes" className="btn-primary">{t('orders.browse')}</Link>
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
                    <h3 className="font-display font-bold text-gray-900">{t('orders.orderHash')}{shortId(order._id)}</h3>
                    <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${st.color} flex items-center gap-1.5`}><Icon className="w-3 h-3" /> {t(st.labelKey)}</span>
                    <span className="font-display font-bold text-brand-600">{order.totalPrice?.toLocaleString()} EGP</span>
                    <button onClick={() => generateReceipt(order)} title="Download Receipt" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <Link to={`/boxes/${item.box?._id}`} className="text-brand-600 hover:underline font-medium">{item.box?.name || 'Meal Box'}</Link>
                      <span className="text-gray-400">× {item.quantity || 1} · {item.servingSize} {item.servingSize === 1 ? t('orders.person') : t('orders.people')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.deliveryAddress?.city || 'Cairo'}</span>
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {order.orderType === 'subscription' ? t('orders.subscription') : t('orders.oneTime')}</span>
                  </div>
                  <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)} className="text-xs text-brand-600 font-semibold hover:underline">
                    {expandedOrder === order._id ? t('orders.hideTracking') : t('orders.trackOrder')}
                  </button>
                </div>
                {expandedOrder === order._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100"><OrderTimeline status={order.status} /></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
