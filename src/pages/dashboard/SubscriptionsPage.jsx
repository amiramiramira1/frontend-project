import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Repeat, PauseCircle, PlayCircle, XCircle, ChefHat, Calendar, Package, DollarSign } from 'lucide-react';

const statusColors = {
  active: 'badge-green',
  paused: 'badge-orange',
  cancelled: 'badge-red',
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => api.get('/subscriptions').then(({ data }) => setSubs(data)).finally(() => setLoading(false));
  useEffect(() => { if (!user) { navigate('/login'); return; } fetch(); }, [user]);

  const handlePause = async (id) => {
    try {
      await api.patch(`/subscriptions/${id}/pause`);
      toast.success('Subscription paused');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleResume = async (id) => {
    try {
      await api.patch(`/subscriptions/${id}/resume`);
      toast.success('Subscription resumed');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      toast.success('Subscription cancelled');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">My Subscriptions</h2>
        <Link to="/boxes" className="btn-primary !py-2 !px-4 text-sm">+ New Subscription</Link>
      </div>

      {subs.length === 0 ? (
        <div className="text-center py-14 card">
          <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No subscriptions yet</h3>
          <p className="text-gray-400 mb-4">Subscribe to a box for weekly fresh meal delivery!</p>
          <Link to="/boxes" className="btn-primary">Browse Boxes</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {subs.map(sub => (
            <div key={sub._id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-gray-900">
                      {sub.boxType === 'pre-made' ? sub.boxName : (sub.customBox?.name || 'Custom Box')}
                    </h3>
                    <span className={`badge ${statusColors[sub.status] || 'badge-gray'}`}>{sub.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {sub.boxType === 'pre-made' ? 'Pre-Made Box' : 'Custom Box'} · {sub.frequency} · {sub.servingsPerMeal} {sub.servingsPerMeal === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-black text-brand-600">{sub.fixedPricePerDelivery?.toLocaleString()} EGP</div>
                  <div className="text-xs text-gray-400">per delivery</div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Delivery Day</div>
                  <div className="text-sm font-semibold">{sub.deliveryDay}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Package className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Meals/Delivery</div>
                  <div className="text-sm font-semibold">{sub.mealsPerDelivery}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <ChefHat className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Deliveries</div>
                  <div className="text-sm font-semibold">{sub.totalDeliveries}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Next Delivery</div>
                  <div className="text-sm font-semibold">
                    {sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {sub.status === 'active' && (
                  <button onClick={() => handlePause(sub._id)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors">
                    <PauseCircle className="w-4 h-4" /> Pause
                  </button>
                )}
                {sub.status === 'paused' && (
                  <button onClick={() => handleResume(sub._id)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
                    <PlayCircle className="w-4 h-4" /> Resume
                  </button>
                )}
                {sub.status !== 'cancelled' && (
                  <button onClick={() => handleCancel(sub._id)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
