import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../public/locales/en.json';
import ar from '../public/locales/ar.json';

// ─────────────────────────────────────────────────────────────────────────────
// HOW TRANSLATIONS WORK IN THIS APP
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. LOCALE FILES — public/locales/{en,ar}.json
//    Both are statically imported below so i18next is synchronously ready
//    before any React component renders. This avoids Suspense complexity.
//    Vite tree-shakes unused locale strings at build time.
//
// 2. IN COMPONENTS (React render context) — use the hook:
//      import { useTranslation } from 'react-i18next';
//      const { t } = useTranslation();
//      <h1>{t('nav.login')}</h1>
//      <h1>{t('msg.welcomeBack', { name: user.name })}</h1>
//
// 3. IN CONTEXTS / UTILITIES (outside render) — use the singleton:
//      import i18next from 'i18next';
//      toast.error(i18next.t('msg.loginFailed'));
//    Necessary for AuthContext, CartContext, etc. — hooks cannot be called
//    outside React components, and these contexts fire toasts in async callbacks.
//
// 4. ADDING A NEW STRING
//    a. Add the key to BOTH public/locales/en.json and public/locales/ar.json
//    b. Use t('section.key') or i18next.t('section.key') — never hardcode strings
//
// ─────────────────────────────────────────────────────────────────────────────

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Reads/writes to localStorage key 'i18nextLng' (i18next default)
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// ── RTL management ────────────────────────────────────────────────────────────
// Runs once on init and on every language change.
// Kept outside React so it always fires, even from i18next.t() calls in contexts.
function applyDirection(lng) {
  const isAr = (lng ?? '').startsWith('ar'); // handles 'ar', 'ar-EG', 'ar-SA', etc.
  document.documentElement.dir  = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = lng ?? 'en';
  document.documentElement.classList.toggle('arabic', isAr);
}

i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language ?? 'en');

export default i18n;
