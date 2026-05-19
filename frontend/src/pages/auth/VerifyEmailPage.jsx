import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, Mail, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || 'your email';

  const [resent, setResent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleResend = () => {
    setResent(true);
    toast.success(i18next.t('msg.verificationResent'));
    setTimeout(() => setResent(false), 4000);
  };

  const handleTestVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      toast.success(i18next.t('msg.emailVerified'));
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl font-bold">Boxify</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-brand-500" />
          </div>

          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">{t('verify.heading')}</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-1">{t('verify.sent')}</p>
          <p className="font-semibold text-gray-900 mb-6 break-all">{email}</p>

          <p className="text-xs text-gray-400 mb-6">
            {t('verify.clickLink')}{' '}
            <span className="block mt-1">{t('verify.checkSpam')}</span>
          </p>

          <button onClick={handleResend} disabled={resent} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3">
            {resent
              ? <><CheckCircle className="w-4 h-4 text-green-500" />{t('verify.emailSent')}</>
              : <><RefreshCw className="w-4 h-4" />{t('verify.resend')}</>
            }
          </button>

          <button onClick={handleTestVerify} disabled={verifying} className="btn-primary w-full flex items-center justify-center gap-2">
            {verifying
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t('verify.verifying')}</>
              : t('verify.verifyBtn')
            }
          </button>

          <p className="mt-2 text-xs text-gray-400">{t('verify.testNote')}</p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('verify.wrongEmail')}{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">{t('verify.goBack')}</Link>
        </p>
      </div>
    </div>
  );
}