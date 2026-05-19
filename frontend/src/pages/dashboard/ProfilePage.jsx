import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Plus, Trash2, Save } from 'lucide-react';
import i18next from 'i18next';

export default function ProfilePage() {
  const { user, refreshUser, deleteAccount } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', street: '', city: 'Cairo', zip: '', phone: '', isDefault: false });
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { name, addresses });
      await refreshUser();
      toast.success(i18next.t('msg.profileUpdated'));
    } catch {
      toast.error(i18next.t('msg.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addAddress = () => {
    if (!newAddr.street || !newAddr.phone) { toast.error(i18next.t('msg.addressRequired')); return; }
    setAddresses((prev) => [...prev, { ...newAddr, _id: Date.now().toString() }]);
    setNewAddr({ label: 'Home', street: '', city: 'Cairo', zip: '', phone: '', isDefault: false });
    setShowAddForm(false);
    toast.success(i18next.t('msg.addressAdded'));
  };

  const removeAddress = (idx) => setAddresses((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">{t('profile.title')}</h2>

      <div className="card p-6">
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" /> {t('profile.personalInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.nameLabel')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.emailLabel')}</label>
            <input value={user?.email || ''} readOnly className="input-field bg-gray-50 cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" /> {t('profile.addresses')}
          </h3>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-outline !py-1.5 !px-4 text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t('profile.add')}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder={t('profile.labelPh')} value={newAddr.label} onChange={(e) => setNewAddr((p) => ({ ...p, label: e.target.value }))} className="input-field" />
            <input placeholder={t('profile.streetPh')} value={newAddr.street} onChange={(e) => setNewAddr((p) => ({ ...p, street: e.target.value }))} className="input-field" />
            <input placeholder={t('profile.cityPh')} value={newAddr.city} onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))} className="input-field" />
            <input placeholder={t('profile.phonePh')} value={newAddr.phone} onChange={(e) => setNewAddr((p) => ({ ...p, phone: e.target.value }))} className="input-field" />
            <button onClick={addAddress} className="btn-primary text-sm">{t('profile.addAddress')}</button>
          </div>
        )}

        {addresses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t('profile.noAddresses')}</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="font-medium text-gray-800">{addr.label} — {addr.street}, {addr.city}</p>
                  <p className="text-sm text-gray-500">{addr.phone}</p>
                </div>
                <button onClick={() => removeAddress(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> {saving ? t('profile.saving') : t('profile.saveChanges')}
      </button>

      <div className="mt-10 card border border-red-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-red-600 font-bold text-lg">{t('profile.dangerZone')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('profile.dangerDesc')}</p>
          </div>
          <button onClick={() => setShowDelete(true)} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-medium transition">
            {t('profile.deleteAccount')}
          </button>
        </div>

        {showDelete && (
          <div className="mt-6 border-t pt-5 space-y-4">
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-xl">{t('profile.deleteWarning')}</div>
            <p className="text-sm text-gray-600">{t('profile.typeToConfirm')}</p>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input-field" placeholder={t('profile.typePh')} />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDelete(false); setConfirmText(''); }} className="px-4 py-2 rounded-xl border text-gray-600 hover:bg-gray-50">
                {t('profile.cancel')}
              </button>
              <button
                disabled={confirmText !== 'DELETE'}
                onClick={async () => { await deleteAccount(); toast.success(i18next.t('msg.accountDeleted')); navigate('/'); }}
                className={`px-4 py-2 rounded-xl text-white transition ${confirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {t('profile.deletePerm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}