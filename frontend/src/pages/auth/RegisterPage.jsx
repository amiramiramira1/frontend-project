import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError(t('msg.passwordMin6')); return; }
    try {
      await register(form.name, form.email, form.password);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || t('msg.registrationFailed'));
    }
  };

  const perks = [t('register.perk1'), t('register.perk2'), t('register.perk3'), t('register.perk4')];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-hero-pattern items-center justify-center relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative text-white text-center p-12">
          <h2 className="font-display text-4xl font-black mb-6">{t('register.panelTitle')}</h2>
          <ul className="space-y-3 text-left">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-3 text-gray-200">
                <CheckCircle className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Boxify Logo" className="w-14 h-14 object-contain" />
              <span className="font-display text-2xl font-bold">Boxify</span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-gray-900">{t('register.heading')}</h1>
            <p className="text-gray-500 mt-2">{t('register.subheading')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.nameLabel')}</label>
              <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder={t('register.namePlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.emailLabel')}</label>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.passwordLabel')}</label>
              <div className="relative">
                <input type="text" style={{ WebkitTextSecurity: showPw ? 'none' : 'disc' }} required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field pr-12" placeholder={t('register.pwPlaceholder')} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-base mt-2">
              {loading ? t('register.creating') : t('register.create')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('register.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
