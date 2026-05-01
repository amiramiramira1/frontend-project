import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Repeat, CheckCircle, Link } from 'lucide-react';

const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
const frequencies = [
    { value: 'weekly', label: 'Weekly', desc: 'Every week' },
    { value: 'monthly', label: 'Monthly', desc: 'Every month' }
];
const servingOptions = [1, 2, 4, 6];

export default function EditSubscriptionPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const sub = state?.sub;

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        frequency: sub?.frequency || 'weekly',
        deliveryDay: sub?.deliveryDay || 'saturday',
        servingsPerMeal: sub?.servingsPerMeal || 2,
    });

    if (!sub) { navigate('/dashboard/subscriptions'); return null; }

    const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await api.patch(`/subscriptions/${sub._id}`, form);
        toast.success('Subscription updated!');
        navigate('/dashboard/subscriptions');
    } catch {
        // Backend not ready — update localStorage directly
        const saved = JSON.parse(localStorage.getItem('boxify_subs') || '[]');
        const updated = saved.map(s => s._id === sub._id ? { ...s, ...form } : s);
        localStorage.setItem('boxify_subs', JSON.stringify(updated));
        toast.success('Subscription updated!');
        navigate('/dashboard/subscriptions');
    } finally {
        setLoading(false);
    }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Repeat className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-gray-900">Edit Subscription</h1>
                    <p className="text-gray-500 mt-2">Update your delivery preferences</p>
                </div>

                <div className="card p-6">
                {/* Current box info */}
                    <div className="bg-brand-50 rounded-xl p-4 flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-brand-900">
                            {sub.boxName || 'Custom Box'}
                        </div>
                        <div className="text-sm text-brand-700">
                            {sub.boxType === 'pre-made' ? 'Pre-Made Box' : 'Custom Box'}
                        </div>
                    </div>
                        {sub.boxType === 'pre-made' && (
                        <a href="/boxes" className="text-xs text-brand-600 font-semibold hover:underline">
                        Change Box
                        </a>
                        )}
                    </div>

                    <form onSubmit={handleSave} className="space-y-5">
                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Frequency</label>
                            <div className="grid grid-cols-2 gap-3">
                                {frequencies.map(f => (
                                    <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, frequency: f.value }))}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        form.frequency === f.value
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-gray-200 hover:border-brand-300'
                                    }`}
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
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border capitalize ${
                                        form.deliveryDay === day
                                        ? 'bg-brand-500 text-white border-brand-500'
                                        : 'border-gray-200 text-gray-700 hover:border-brand-300'
                                    }`}
                                    >
                                    {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Serving Size */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Serving Size</label>
                            <div className="grid grid-cols-4 gap-2">
                                {servingOptions.map(size => (
                                    <button
                                    key={size}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, servingsPerMeal: size }))}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                        form.servingsPerMeal === size
                                        ? 'bg-brand-500 text-white border-brand-500'
                                        : 'border-gray-200 text-gray-700 hover:border-brand-300'
                                    }`}
                                    >
                                    {size} {size === 1 ? 'person' : 'people'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard/subscriptions')}
                                className="flex-1 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-colors"
                            >
                            Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-primary"
                            >
                            {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}