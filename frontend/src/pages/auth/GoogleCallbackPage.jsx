import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';

/**
 * GoogleCallbackPage
 * Rendered at /auth/google/success after the backend OAuth callback.
 * The backend redirects here with ?token=JWT&user=JSON in the URL.
 * We read those params, persist them, and forward the user into the app.
 */
export default function GoogleCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const rawUser = params.get('user');

    if (!token || !rawUser) {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(rawUser));

      // Persist exactly like the normal login flow does
      localStorage.setItem('boxify_token', token);
      localStorage.setItem('boxify_user', JSON.stringify(user));

      toast.success(`Welcome, ${user.name}! 🎉`);

      // Clean the URL and redirect
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <img src="/logo.png" alt="Boxify Logo" className="w-20 h-20 object-contain animate-pulse mx-auto mb-4" />
      <p className="text-gray-600 font-medium text-lg">Signing you in with Google…</p>
    </div>
  );
}
