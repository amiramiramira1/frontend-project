import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success('Password reset successfully!');
      setPassword('');
      setConfirm('');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-96 bg-white p-6 rounded-xl shadow">

        <h1 className="text-xl font-bold mb-4">Reset Password</h1>

        <input
          type="password"
          placeholder="New Password"
          className="input-field w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="input-field w-full mb-4"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Saving...' : 'Reset Password'}
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