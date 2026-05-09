import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Repeat, PauseCircle, PlayCircle, XCircle, Calendar, Package, AlertCircle } from 'lucide-react';

// Backend serving multipliers (same as backend)
const MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

const statusColors = {
  active:    'badge-green',
  paused:    'badge-orange',
  cancelled: 'badge-red',
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);

  // GET /api/subscriptions/my → { subscriptions: [...] }
  // sub.box is populated with { _id, name, image, basePrice }
  const fetchSubs = () => {
    api.get('/subscriptions/my')
      .then(({ data }) => setSubs(data.subscriptions || []))
      .catch(() => setError('Failed to load subscriptions.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSubs();
  }, [user]);

  // PUT /api/subscriptions/:id/pause
  // This endpoint TOGGLES: active → paused, paused → active
  // So it handles both "Pause" and "Resume" — no separate resume endpoint exists
  const handleTogglePause = async (id, currentStatus) => {
    try {
      const { data } = await api.put(`/subscriptions/${id}/pause`);
      toast.success(`Subscription ${data.subscription.status}`);
      fetchSubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    }
  };

  // PUT /api/subscriptions/:id/cancel
  const handleCancel = async (id) => {
    try {
      await api.put(`/subscriptions/${id}/cancel`);
      toast.success('Subscription cancelled');
      fetchSubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
    }
    setCancelId(null);
  };

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
          {subs.map(sub => {
            // Compute price from box.basePrice × serving multiplier
            // sub.box is populated with { _id, name, image, basePrice }
            const pricePerDelivery = sub.box?.basePrice
              ? (sub.box.basePrice * (MULTIPLIERS[sub.servingSize] || 1)).toFixed(0)
              : '—';

            return (
              <div key={sub._id} className="card p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {/* sub.box.name replaces sub.boxName */}
                      <h3 className="font-display font-bold text-gray-900">
                        {sub.box?.name || 'Meal Box'}
                      </h3>
                      <span className={`badge ${statusColors[sub.status] || 'badge-gray'}`}>
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {/* sub.servingSize replaces sub.servingsPerMeal */}
                      {sub.frequency} · {sub.servingSize} {sub.servingSize === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-black text-brand-600">
                      {pricePerDelivery} EGP
                    </div>
                    <div className="text-xs text-gray-400">per delivery</div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Calendar className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-500">Next Delivery</div>
                    <div className="text-sm font-semibold">
                      {sub.nextDeliveryDate
                        ? new Date(sub.nextDeliveryDate).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Package className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-500">Meals in Box</div>
                    <div className="text-sm font-semibold">
                      {sub.mealRotation?.length || '—'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  {/* Pause/Resume — same endpoint (toggle) */}
                  {sub.status === 'active' && (
                    <button
                      onClick={() => handleTogglePause(sub._id, sub.status)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      <PauseCircle className="w-4 h-4" /> Pause
                    </button>
                  )}
                  {sub.status === 'paused' && (
                    <button
                      onClick={() => handleTogglePause(sub._id, sub.status)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" /> Resume
                    </button>
                  )}
                  {sub.status !== 'cancelled' && (
                    <button
                      onClick={() => setCancelId(sub._id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">Cancel Subscription?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will cancel your subscription. You won't be charged for future deliveries.
            </p>
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
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
