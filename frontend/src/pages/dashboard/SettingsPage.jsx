import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({ notifications: true, language: 'en', servings: 2 });

  useEffect(() => {
    const saved = localStorage.getItem('user_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    toast.success(i18next.t('msg.settingsSaved'));
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="mb-6">
        <label className="flex items-center justify-between">
          <span>{t('settings.notifications')}</span>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
          />
        </label>
      </div>

      <div className="mb-6">
        <label className="block mb-2">{t('settings.language')}</label>
        <select
          value={settings.language}
          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="en">{t('settings.langEn')}</option>
          <option value="ar">{t('settings.langAr')}</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2">{t('settings.servings')}</label>
        <input
          type="number"
          min="1"
          value={settings.servings}
          onChange={(e) => setSettings({ ...settings, servings: e.target.value })}
          className="border p-2 rounded w-full"
        />
      </div>

      <button onClick={handleSave} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
        {t('settings.save')}
      </button>
    </div>
  );
}