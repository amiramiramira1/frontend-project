import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success(i18next.t('msg.resetLinkSent'));
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
          <h2 className="font-display text-4xl font-black mb-4">{t('forgot.panelTitle')}</h2>
          <p className="text-lg text-gray-300 max-w-sm">{t('forgot.panelSubtitle')}</p>
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
