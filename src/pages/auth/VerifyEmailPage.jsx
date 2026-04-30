import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success('Email verified successfully!');
      navigate('/login');
    }, 1500);
  };

  const handleResend = () => {
    toast.success('Verification email resent!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow w-96 text-center">

        <h1 className="text-xl font-bold mb-2">
          Verify Your Email
        </h1>

        <p className="text-gray-600 mb-2">
          We sent a verification link to:
        </p>

        <p className="font-semibold mb-4 text-brand-600">
          {email}
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Please check your inbox and spam folder.
        </p>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="btn-primary w-full mb-3"
        >
          {loading ? 'Verifying...' : 'Verify for Testing'}
        </button>

        <button
          onClick={handleResend}
          className="text-sm text-brand-600 hover:underline"
        >
          Resend Email
        </button>

      </div>
    </div>
  );
}