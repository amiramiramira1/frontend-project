import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    language: 'en',
    servings: 2,
  });

  // load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // save
  const handleSave = () => {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="p-6 max-w-2xl">

      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Notifications */}
      <div className="mb-6">
        <label className="flex items-center justify-between">
          <span>Email Notifications</span>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) =>
              setSettings({ ...settings, notifications: e.target.checked })
            }
          />
        </label>
      </div>

      {/* Language */}
      <div className="mb-6">
        <label className="block mb-2">Preferred Language</label>
        <select
          value={settings.language}
          onChange={(e) =>
            setSettings({ ...settings, language: e.target.value })
          }
          className="border p-2 rounded w-full"
        >
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
      </div>

      {/* Servings */}
      <div className="mb-6">
        <label className="block mb-2">Default Serving Size</label>
        <input
          type="number"
          min="1"
          value={settings.servings}
          onChange={(e) =>
            setSettings({ ...settings, servings: e.target.value })
          }
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
        Save Settings
      </button>

    </div>
  );
}