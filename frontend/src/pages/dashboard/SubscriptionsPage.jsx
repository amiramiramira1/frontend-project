import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import toast from 'react-hot-toast';
import { Repeat, PauseCircle, PlayCircle, XCircle, Calendar, Package, AlertCircle, Pencil } from 'lucide-react';

// Backend serving multipliers (same as backend)
const MULTIPLIERS = { 1: 1, 2: 1.8, 4: 3.2, 6: 4.5 };

const statusColors = {
  active:    'badge-green',
  paused:    'badge-orange',
  cancelled: 'badge-red',
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);

  const fetchSubs = () => {
    api.get('/subscriptions/my')
      .then(({ data }) => setSubs(data.subscriptions || []))
      .catch(() => setError(i18next.t('msg.loadSubsFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSubs();
  }, [user, i18n.language]);

  const handleTogglePause = async (id, currentStatus) => {
    try {
      const { data } = await api.put(`/subscriptions/${id}/pause`);
      toast.success(`Subscription ${data.subscription.status}`);
      fetchSubs();
    } catch (err) {
      toast.error(err.response?.data?.message || i18next.t('msg.subUpdateFailed'));
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/subscriptions/${id}/cancel`);
      toast.success(i18next.t('msg.subCancelled'));
      fetchSubs();
    } catch (err) {
      toast.error(err.response?.data?.message || i18next.t('msg.subCancelFailed'));
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
        <h2 className="font-display text-2xl font-bold">{t('subs.title')}</h2>
        <Link to="/boxes" className="btn-primary !py-2 !px-4 text-sm">{t('subs.newSub')}</Link>
      </div>

      {subs.length === 0 ? (
        <div className="text-center py-14 card">
          <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('subs.noSubsTitle')}</h3>
          <p className="text-gray-400 mb-4">{t('subs.noSubsDesc')}</p>
          <Link to="/boxes" className="btn-primary">{t('subs.browseBoxes')}</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {subs.map(sub => {
            const pricePerDelivery = sub.box?.basePrice
              ? (sub.box.basePrice * (MULTIPLIERS[sub.servingSize] || 1)).toFixed(0)
              : '—';

            return (
              <div key={sub._id} className="card p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-gray-900">
                        {sub.box?.name || 'Meal Box'}
                      </h3>
                      <span className={`badge ${statusColors[sub.status] || 'badge-gray'}`}>
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {sub.frequency} · {sub.servingSize} {sub.servingSize === 1 ? t('subs.person') : t('subs.people')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-black text-brand-600">
                      {pricePerDelivery} EGP
                    </div>
                    <div className="text-xs text-gray-400">{t('subs.perDelivery')}</div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Calendar className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-500">{t('subs.nextDelivery')}</div>
                    <div className="text-sm font-semibold">
                      {sub.nextDeliveryDate
                        ? new Date(sub.nextDeliveryDate).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Repeat className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-500">{t('subs.deliveryDay')}</div>
                    <div className="text-sm font-semibold capitalize">
                      {sub.deliveryDay || '—'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Package className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-500">{t('subs.mealsInBox')}</div>
                    <div className="text-sm font-semibold">
                      {sub.mealRotation?.length || '—'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  {sub.status !== 'cancelled' && (
                    <button
                      onClick={() => navigate('/edit-subscription', { state: { sub } })}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  )}
                  {sub.status === 'active' && (
                    <button
                      onClick={() => handleTogglePause(sub._id, sub.status)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      <PauseCircle className="w-4 h-4" /> {t('subs.pause')}
                    </button>
                  )}
                  {sub.status === 'paused' && (
                    <button
                      onClick={() => handleTogglePause(sub._id, sub.status)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" /> {t('subs.resume')}
                    </button>
                  )}
                  {sub.status !== 'cancelled' && (
                    <button
                      onClick={() => setCancelId(sub._id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> {t('subs.cancel')}
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
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{t('subs.cancelTitle')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('subs.cancelDesc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCancel(cancelId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
              >
                {t('subs.yesCancel')}
              </button>
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-colors"
              >
                {t('subs.keepSub')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
