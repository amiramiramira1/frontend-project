import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

function StrengthBar({ password }) {
  const { t } = useTranslation();
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', t('reset.weak'), t('reset.fair'), t('reset.good'), t('reset.strong')];
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  const textColors = ['', 'text-red-500', 'text-yellow-500', 'text-blue-500', 'text-green-600'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordsMatch = form.password && form.confirm && form.password === form.confirm;
  const isStrong = form.password.length >= 8;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error(i18next.t('msg.passwordsMismatch')); return; }
    if (!isStrong) { toast.error(i18next.t('msg.passwordMin8')); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      toast.success(i18next.t('msg.passwordReset'));
      setTimeout(() => navigate('/login'), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-hero-pattern items-center justify-center relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative text-white text-center p-12">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-brand-400" />
          </div>
          <h2 className="font-display text-4xl font-black mb-4">{t('reset.panelTitle')}</h2>
          <p className="text-lg text-gray-300 max-w-sm">{t('reset.panelSubtitle')}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl font-bold">Boxify</span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-gray-900">{t('reset.heading')}</h1>
            <p className="text-gray-500 mt-2">{t('reset.subheading')}</p>
          </div>

          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('reset.newPw')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="input-field pl-11 pr-12" placeholder={t('reset.pwPlaceholder')} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <StrengthBar password={form.password} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('reset.confirmPw')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showConfirm ? 'text' : 'password'} required value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} className={`input-field pl-11 pr-12 transition-colors ${form.confirm && !passwordsMatch ? 'border-red-400 focus:border-red-400' : ''} ${passwordsMatch ? 'border-green-400 focus:border-green-400' : ''}`} placeholder={t('reset.confirmPh')} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirm && !passwordsMatch && <p className="mt-1.5 text-xs text-red-500">{t('reset.noMatch')}</p>}
                {passwordsMatch && <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t('reset.match')}</p>}
              </div>

              <button type="submit" disabled={loading || !passwordsMatch || !isStrong} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('reset.resetting')}</>) : t('reset.reset')}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-1">{t('reset.doneHeading')}</h2>
                <p className="text-sm text-gray-500">{t('reset.doneSubtext')}</p>
              </div>
              <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">{t('reset.goSignIn')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
