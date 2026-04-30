import { useState , useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { User, MapPin, Plus, Trash2, Save, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', street: '', city: 'Cairo', zip: '', phone: '', isDefault: false });

  const [preferences, setPreferences] = useState(() => {
  const saved = localStorage.getItem('boxify_preferences');
  return saved
    ? JSON.parse(saved)
    : {
        emailNotifications: true,
        language: 'English',
        servingSize: '2',
      };
});

    useEffect(() => {
    if (user) {
    setName(user.name || '');
    setAddresses(user.addresses || []);
        }
    }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { name, addresses });
      await refreshUser();
      localStorage.setItem('boxify_preferences', JSON.stringify(preferences));
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const addAddress = () => {
    if (!newAddr.street || !newAddr.phone) { toast.error('Street and phone required'); return; }
    setAddresses(prev => [...prev, { ...newAddr, _id: Date.now().toString() }]);
    setNewAddr({ label: 'Home', street: '', city: 'Cairo', zip: '', phone: '', isDefault: false });

    setShowAddForm(false);
    toast.success('Address added — save your profile to keep it');
  };

  const removeAddress = (idx) => setAddresses(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">My Profile</h2>

      {/* Basic Info */}
      <div className="card p-6">
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><User className="w-5 h-5 text-brand-500" /> Personal Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (read-only)</label>
            <input value={user?.email || ''} readOnly className="input-field bg-gray-50 cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-500" /> Delivery Addresses</h3>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-outline !py-1.5 !px-4 text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Label (Home/Work)" value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} className="input-field" />
            <input placeholder="Street *" value={newAddr.street} onChange={e => setNewAddr(p => ({ ...p, street: e.target.value }))} className="input-field" />
            <input placeholder="City" value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} className="input-field" />
            <input placeholder="Phone *" value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} className="input-field" />
            <button onClick={addAddress} className="btn-primary text-sm">Add Address</button>
          </div>
        )}

        {addresses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No addresses saved yet</p>
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

      {/* Settings */}
    <div className="card p-6">
      <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
    <Settings className="w-5 h-5 text-brand-500" /> User Settings
      </h3>

    <div className="space-y-4">
    {/* Email Notifications */}
    <label className="flex items-center justify-between">
      <span className="text-gray-700 font-medium">Email Notifications</span>
      <input
        type="checkbox"
        checked={preferences.emailNotifications}
        onChange={e =>
          setPreferences(prev => ({
            ...prev,
            emailNotifications: e.target.checked,
          }))
        }
        className="w-4 h-4"
      />
     </label>

    {/* Language */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Preferred Language
      </label>
      <select
        value={preferences.language}
        onChange={e =>
          setPreferences(prev => ({
            ...prev,
            language: e.target.value,
          }))
        }
        className="input-field"
      >
        <option value="English">English</option>
        <option value="Arabic">Arabic</option>
      </select>
    </div>

    {/* Serving Size */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Default Serving Size
      </label>
      <select
        value={preferences.servingSize}
        onChange={e =>
          setPreferences(prev => ({
            ...prev,
            servingSize: e.target.value,
          }))
        }
        className="input-field"
      >
        <option value="2">2 Servings</option>
        <option value="4">4 Servings</option>
        <option value="6">6 Servings</option>
      </select>
    </div>
  </div>
</div>

      <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
