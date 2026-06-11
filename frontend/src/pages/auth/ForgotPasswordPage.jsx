import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword(email);
      setSent(true); // Always show success — server never reveals if email exists
    } catch (err) {
      setError(err.response?.data?.message || t('msg.genericError'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-hero-pattern items-center justify-center relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative text-white text-center p-12">
          <img src="/logo.png" alt="Boxify Logo" className="w-28 h-28 object-contain mx-auto mb-6 bg-white/20 backdrop-blur-sm p-4 rounded-3xl" />
          <h2 className="font-display text-4xl font-black mb-4">{t('forgot.panelTitle')}</h2>
          <p className="text-lg text-gray-300 max-w-sm">{t('forgot.panelSubtitle')}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Boxify Logo" className="w-14 h-14 object-contain" />
              <span className="font-display text-2xl font-bold">Boxify</span>
            </Link>

            {!sent ? (
              <>
                <h1 className="font-display text-3xl font-bold text-gray-900">{t('forgot.heading')}</h1>
                <p className="text-gray-500 mt-2">{t('forgot.subheading')}</p>
              </>
            ) : (
              <>
                <h1 className="font-display text-3xl font-bold text-gray-900">{t('forgot.sentHeading')}</h1>
                <p className="text-gray-500 mt-2">{t('forgot.sentSub')} <span className="font-semibold text-gray-700">{email}</span></p>
              </>
            )}
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('forgot.emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-11" placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('forgot.sending')}</>
                ) : t('forgot.sendLink')}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-sm text-gray-500">
                {t('forgot.noEmail')}{' '}
                <button onClick={() => setSent(false)} className="text-brand-600 font-semibold hover:underline">{t('forgot.tryAgain')}</button>
              </p>
              <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">{t('forgot.backToSignIn')}</Link>
            </div>
          )}

          {!sent && (
            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />{t('forgot.backToSignIn')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
