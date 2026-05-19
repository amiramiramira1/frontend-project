import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Repeat, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

// Day keys map to locale keys under subscribe.*
const dayKeys = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'];
const dayValues = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export default function SubscribePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ frequency: 'weekly', deliveryDay: 'saturday' });

  const type = searchParams.get('type') || 'pre-made';
  const boxId = searchParams.get('boxId');
  const servings = parseInt(searchParams.get('servings') || '2');
  const name = searchParams.get('name') || 'Meal Box';
  const mealIds = searchParams.get('mealIds')?.split(',').filter(Boolean) || [];

  useEffect(() => { if (!user) navigate('/login'); }, [user]);

  const frequencies = [
    { value: 'weekly',  label: t('subscribe.weekly'),  desc: t('subscribe.weeklyDesc') },
    { value: 'monthly', label: t('subscribe.monthly'), desc: t('subscribe.monthlyDesc') },
  ];

  const perks = [
    t('subscribe.perk1'), t('subscribe.perk2'),
    t('subscribe.perk3'), t('subscribe.perk4'),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boxId) { toast.error(i18next.t('msg.subscribeNoBox')); return; }
    setLoading(true);
    try {
      await api.post('/subscriptions', { boxId, servingSize: servings, frequency: form.frequency });
      toast.success(i18next.t('msg.subscribeCreated'));
      navigate('/dashboard/subscriptions');
    } catch (err) {
      toast.error(err.response?.data?.message || i18next.t('msg.subscribeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const servingLabel = servings === 1
    ? `1 ${t('subscribe.person')}`
    : `${servings} ${t('subscribe.people')}`;

  const typeLabel = type === 'pre-made' ? t('subscribe.preMade') : t('subscribe.custom');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Repeat className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">{t('subscribe.heading')}</h1>
          <p className="text-gray-500 mt-2">{t('subscribe.subheading')}</p>
        </div>

        <div className="card p-6 mb-4">
          <div className="bg-brand-50 rounded-xl p-4 flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="font-semibold text-brand-900">{name}</div>
              <div className="text-sm text-brand-700">{servingLabel} · {typeLabel} Box</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Frequency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('subscribe.freqLabel')}</label>
              <div className="grid grid-cols-2 gap-3">
                {frequencies.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, frequency: f.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.frequency === f.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}
                  >
                    <div className="font-semibold text-gray-900">{f.label}</div>
                    <div className="text-sm text-gray-500">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Day */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('subscribe.dayLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                {dayKeys.map((key, i) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, deliveryDay: dayValues[i] }))}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${form.deliveryDay === dayValues[i] ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-700 hover:border-brand-300'}`}
                  >
                    {t(`subscribe.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Perks */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {perks.map(perk => (
                <div key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {perk}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base">
              {loading ? t('subscribe.creating') : t('subscribe.start')}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 text-center">{t('subscribe.disclaimer')}</p>
      </div>
    </div>
  );
}
