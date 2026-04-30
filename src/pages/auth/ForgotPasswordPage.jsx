import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success('Reset link sent to your email!');
      setEmail('');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-96 bg-white p-6 rounded-xl shadow">
        
        <h1 className="text-xl font-bold mb-4">Forgot Password</h1>

        <input
          type="email"
          placeholder="Enter your email"
          className="input-field w-full mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        {/* Back to login */}
        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-gray-500 hover:underline">
            Back to Login
          </Link>
        </div>

      </form>
    </div>
  );
}