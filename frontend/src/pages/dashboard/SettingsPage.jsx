import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Save, Bell, Globe, UtensilsCrossed } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateSettings, loading } = useAuth();

  // Initialise from user.settings in the context (from database), falling back to sensible defaults
  const [settings, setSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    language:           user?.settings?.language           ?? 'en',
    defaultServings:    user?.settings?.defaultServings    ?? 2,
  });

  const handleSave = async () => {
    await updateSettings(settings);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-display text-2xl font-bold">{t('settings.title')}</h2>

      {/* Email Notifications */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('settings.notifications')}</p>
              <p className="text-sm text-gray-500">{t('settings.notificationsDesc')}</p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, emailNotifications: !s.emailNotifications }))}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.emailNotifications ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-brand-500" />
          </div>
          <p className="font-medium text-gray-900">{t('settings.language')}</p>
        </div>
        <div className="flex gap-3">
          {['en', 'ar'].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, language: lang }))}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                settings.language === lang
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {lang === 'en' ? t('settings.langEn') : t('settings.langAr')}
            </button>
          ))}
        </div>
      </div>

      {/* Default Serving Size */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-brand-500" />
          </div>
          <p className="font-medium text-gray-900">{t('settings.servings')}</p>
        </div>
        <div className="flex gap-3">
          {[1, 2, 4, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, defaultServings: n }))}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                settings.defaultServings === n
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {t(n === 1 ? 'boxDetails.person1' : `boxDetails.people${n}`)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="btn-primary flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {loading ? `${t('settings.save')}...` : t('settings.save')}
      </button>
    </div>
  );
}