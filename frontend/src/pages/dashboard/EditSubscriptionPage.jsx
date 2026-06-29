import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Repeat, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EditSubscriptionPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const sub = state?.sub;

    const { t } = useTranslation();
    const frequencies = [
        { value: 'weekly',  label: t('editSub.weekly', 'Weekly'),   desc: t('editSub.everyWeek', 'Every week') },
        { value: 'monthly', label: t('editSub.monthly', 'Monthly'), desc: t('editSub.everyMonth', 'Every month') },
    ];
    const days = [
        { value: 'saturday',  label: t('editSub.saturday',  'Saturday') },
        { value: 'sunday',    label: t('editSub.sunday',    'Sunday') },
        { value: 'monday',    label: t('editSub.monday',    'Monday') },
        { value: 'tuesday',   label: t('editSub.tuesday',   'Tuesday') },
        { value: 'wednesday', label: t('editSub.wednesday', 'Wednesday') },
        { value: 'thursday',  label: t('editSub.thursday',  'Thursday') },
        { value: 'friday',    label: t('editSub.friday',    'Friday') },
        ];
    const servingOptions = [1, 2, 4, 6];

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        frequency: sub?.frequency || 'weekly',
        deliveryDay: sub?.deliveryDay || 'saturday',
        servingSize: sub?.servingSize || 2,
    });

    if (!sub) { navigate('/dashboard/subscriptions'); return null; }

    const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await api.patch(`/subscriptions/${sub._id}`, form);
        toast.success(t('msg.subUpdated', 'Subscription updated!'));
        navigate('/dashboard/subscriptions');
    } catch (err) {
        toast.error(err.response?.data?.message || t('msg.subUpdateFailed', 'Failed to update subscription.'));
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
                    <h1 className="font-display text-3xl font-bold text-gray-900">{t('editSub.title', 'Edit Subscription')}</h1>
                    <p className="text-gray-500 mt-2">{t('editSub.subtitle', 'Update your delivery preferences')}</p>
                </div>

                <div className="card p-6">
                {/* Current box info */}
                    <div className="bg-brand-50 rounded-xl p-4 flex items-center gap-3 mb-6">
                        {sub.box?.image ? (
                            <img src={sub.box.image} alt={sub.box.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-brand-600" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-brand-900 truncate">
                            {sub.box?.name || sub.boxName || t('editSub.customBox', 'Custom Box')}
                            </div>
                            <div className="text-sm text-brand-700">
                            {sub.box?.type === 'pre-made' ? t('editSub.preMade', 'Pre-Made Box') : t('editSub.customBox', 'Custom Box')}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-5">
                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('editSub.frequency', 'Delivery Frequency')}</label>
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('editSub.deliveryDay', 'Delivery Day')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {days.map(d => (
                                <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, deliveryDay: d.value }))}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                    form.deliveryDay === d.value
                                    ? 'bg-brand-500 text-white border-brand-500'
                                    : 'border-gray-200 text-gray-700 hover:border-brand-300'
                                    }`}
                                >
                                    {d.label}
                                </button>
                                ))}
                            </div>
                        </div>

                        {/* Serving Size */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('editSub.servingSize', 'Serving Size')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {servingOptions.map(size => (
                                    <button
                                    key={size}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, servingSize: size }))}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                        form.servingSize === size
                                        ? 'bg-brand-500 text-white border-brand-500'
                                        : 'border-gray-200 text-gray-700 hover:border-brand-300'
                                    }`}
                                    >
                                    {size} {size === 1 ? t('subs.person', 'person') : t('subs.people', 'people')}
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
                            {t('editSub.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-primary"
                            >
                            {loading ? t('editSub.saving', 'Saving...') : t('editSub.save', 'Save Changes')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}