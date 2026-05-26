import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { login, loginWithGoogle, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch {
      setError(t('msg.loginFailed'));
    }
  };

  const handleGoogle = () => {
    // loginWithGoogle does a full browser redirect — no async/try-catch needed
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-pattern items-center justify-center relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative text-white text-center p-12">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-brand-400" />
          </div>
          <h2 className="font-display text-4xl font-black mb-4">
            {t('login.panelTitle')}
          </h2>
          <p className="text-lg text-gray-300 max-w-sm">
            {t('login.panelSubtitle')}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo + heading */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl font-bold">Boxify</span>
            </Link>

            <h1 className="font-display text-3xl font-bold text-gray-900">
              {t('login.heading')}
            </h1>
            <p className="text-gray-500 mt-2">
              {t('login.subheading')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('login.emailLabel')}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input-field"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  style={{ WebkitTextSecurity: showPw ? 'none' : 'disc' }}
                  required
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline font-medium">
                {t('login.forgotPassword')}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* OAuth */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full border border-gray-300 rounded-xl py-2 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <img
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="google"
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('login.continueGoogle')}
                </span>
              </button>
            </div>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              {t('login.createOne')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}