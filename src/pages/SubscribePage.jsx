import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, Repeat, Users, CheckCircle } from 'lucide-react';

const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
const frequencies = [{ value: 'weekly', label: 'Weekly', desc: 'Every week' }, { value: 'monthly', label: 'Monthly', desc: 'Every month' }];

export default function SubscribePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    frequency: 'weekly',
    deliveryDay: 'saturday',
  });

  const type = searchParams.get('type') || 'pre-made';
  const boxId = searchParams.get('boxId');
  const servings = parseInt(searchParams.get('servings') || '2');
  const name = searchParams.get('name') || 'Meal Box';
  const mealIds = searchParams.get('mealIds')?.split(',').filter(Boolean) || [];

  useEffect(() => { if (!user) navigate('/login'); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        boxType: type === 'pre-made' ? 'pre-made' : 'custom',
        frequency: form.frequency,
        deliveryDay: form.deliveryDay,
        servingsPerMeal: servings,
      };
      if (type === 'pre-made') payload.boxId = boxId;
      else {
        payload.mealPool = mealIds.map(id => ({ mealId: id }));
        payload.customBox = { name };
      }
      const { data } = await api.post('/subscriptions', payload);
      toast.success('Subscription created! First order generated.');
      navigate('/dashboard/subscriptions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Repeat className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Subscribe to Boxify</h1>
          <p className="text-gray-500 mt-2">Set up your weekly fresh meal delivery</p>
        </div>

        <div className="card p-6 mb-4">
          <div className="bg-brand-50 rounded-xl p-4 flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="font-semibold text-brand-900">{name}</div>
              <div className="text-sm text-brand-700">{servings} {servings === 1 ? 'person' : 'people'} · {type === 'pre-made' ? 'Pre-Made' : 'Custom'} Box</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Frequency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Frequency</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Delivery Day</label>
              <div className="grid grid-cols-3 gap-2">
                {days.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, deliveryDay: day }))}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border capitalize ${form.deliveryDay === day ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-700 hover:border-brand-300'}`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Perks */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {['Lock in today\'s price forever', 'Pause or cancel anytime', 'Fresh delivery every week', 'Automatic order generation'].map(perk => (
                <div key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {perk}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base">
              {loading ? 'Creating Subscription...' : 'Start Subscription'}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 text-center">By subscribing, you agree to weekly charges. Cancel anytime from your dashboard.</p>
      </div>
    </div>
  );
}
