import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Package, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, loginWithGoogle, loginWithFacebook, loading } = useAuth();
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
    } catch (err) {
      setError('Login failed');
    }
  };

  const handleGoogle = async () => {
    try {
      const user = await loginWithGoogle();
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch {
      setError('Google login failed');
    }
  };

  const handleFacebook = async () => {
    try {
      const user = await loginWithFacebook();
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch {
      setError('Facebook login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Left Side */}
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
            Welcome Back!
          </h2>
          <p className="text-lg text-gray-300 max-w-sm">
            Fresh meal kits waiting for you. Log in to continue your Boxify journey.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl font-bold">Boxify</span>
            </Link>

            <h1 className="font-display text-3xl font-bold text-gray-900">
              Sign In
            </h1>

            <p className="text-gray-500 mt-2">
              Enter your credentials to continue
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
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full border border-gray-300 rounded-xl py-2 flex items-center justify-center gap-3 hover:bg-gray-50"
              >
                <img
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="google"
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">
                  Continue with Google
                </span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="w-full bg-[#1877f2] text-white rounded-xl py-2 flex items-center justify-center gap-3 hover:opacity-90"
              >
                <img
                  src="https://www.svgrepo.com/show/183607/facebook.svg"
                  alt="facebook"
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">
                  Continue with Facebook
                </span>
              </button>

            </div>
          </form>

          {/* Register */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Create one
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}