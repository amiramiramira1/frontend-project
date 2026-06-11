import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const { resendVerification, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');

  // Email passed via router state when coming from RegisterPage
  const [email] = useState(() => {
    try { return window.history.state?.usr?.email || ''; } catch { return ''; }
  });

  // State for auto-verification
  const [verifyState, setVerifyState] = useState(
    token ? 'loading' : (errorParam ? 'error' : 'pending')
  ); // 'loading' | 'success' | 'error' | 'pending'

  const [resent, setResent] = useState(false);
  const [resendEmail, setResendEmail] = useState(email);
  const [showResendInput, setShowResendInput] = useState(!email);

  // ── Auto-verify when token is present in URL ─────────────────────────────
  useEffect(() => {
    if (!token) return;

    setVerifyState('loading');
    // The backend's GET /api/auth/verify-email redirects the browser to /login?verified=true
    // or back to /verify-email?error=... . Since we're already on the verify page and
    // the browser followed the redirect, we read the ?error= param to show the result.
    // If there's no error param and no token but we got here from a redirect, show success.
    // We detect the "redirect came back" case by checking for ?error in the URL.
    if (errorParam) {
      setVerifyState('error');
    } else {
      // Token is present — let's call the backend directly via fetch (no auth needed)
      // We use a direct URL call since this is a browser-navigable GET endpoint
      const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      fetch(`${backendURL}/api/auth/verify-email?token=${token}`)
        .then((res) => {
          // The backend redirects — fetch follows redirects, so we check the final URL
          if (res.url.includes('verified=true')) {
            setVerifyState('success');
            toast.success(i18next.t('msg.emailVerified'));
          } else if (res.url.includes('error=')) {
            setVerifyState('error');
          } else {
            // Fallback: assume success if we got a 200 with no obvious error
            setVerifyState(res.ok ? 'success' : 'error');
          }
        })
        .catch(() => setVerifyState('error'));
    }
  }, [token, errorParam]);

  const handleResend = async () => {
    if (!resendEmail) { toast.error(t('verify.enterEmail')); return; }
    try {
      await resendVerification(resendEmail);
      setResent(true);
      toast.success(i18next.t('msg.verificationResent'));
      setTimeout(() => setResent(false), 5000);
    } catch {
      toast.error(t('msg.genericError'));
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (verifyState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="Boxify Logo" className="w-14 h-14 object-contain" />
            <span className="font-display text-2xl font-bold">Boxify</span>
          </Link>
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">{t('verify.successHeading')}</h1>
            <p className="text-gray-500 text-sm">{t('verify.successSubtext')}</p>
          </div>
          <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
            {t('verify.goSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading screen (while verifying) ─────────────────────────────────────
  if (verifyState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto" />
          <p className="text-gray-600 font-medium">{t('verify.verifying')}</p>
        </div>
      </div>
    );
  }

  // ── Error screen (invalid/expired token) ─────────────────────────────────
  if (verifyState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Boxify Logo" className="w-14 h-14 object-contain" />
              <span className="font-display text-2xl font-bold">Boxify</span>
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="font-display text-xl font-bold text-gray-900">{t('verify.errorHeading')}</h1>
            <p className="text-gray-500 text-sm">{t('verify.errorSubtext')}</p>

            {/* Resend form */}
            <div className="pt-2 space-y-3">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="input-field text-sm"
                placeholder="your@email.com"
              />
              <button
                onClick={handleResend}
                disabled={authLoading || resent}
                className="w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-60"
              >
                {resent
                  ? <><CheckCircle className="w-4 h-4" />{t('verify.emailSent')}</>
                  : authLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{t('verify.resending')}</>
                  : <><RefreshCw className="w-4 h-4" />{t('verify.resendNew')}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending screen (just registered — waiting for email click) ────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="Boxify Logo" className="w-14 h-14 object-contain" />
            <span className="font-display text-2xl font-bold">Boxify</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-brand-500" />
          </div>

          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">{t('verify.heading')}</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-1">{t('verify.sent')}</p>
          {email && <p className="font-semibold text-gray-900 mb-6 break-all">{email}</p>}

          <p className="text-xs text-gray-400 mb-6">
            {t('verify.clickLink')}{' '}
            <span className="block mt-1">{t('verify.checkSpam')}</span>
          </p>

          {/* Resend section */}
          {showResendInput && (
            <div className="mb-3">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="input-field text-sm mb-2"
                placeholder="Enter your email to resend"
              />
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={authLoading || resent}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resent
              ? <><CheckCircle className="w-4 h-4 text-green-500" />{t('verify.emailSent')}</>
              : authLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t('verify.resending')}</>
              : <><RefreshCw className="w-4 h-4" />{t('verify.resend')}</>
            }
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('verify.wrongEmail')}{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">{t('verify.goBack')}</Link>
        </p>
      </div>
    </div>
  );
}