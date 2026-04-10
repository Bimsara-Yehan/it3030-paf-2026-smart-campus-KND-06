import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function ResetPasswordPage() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const token                       = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState(false);

  // No token in URL — show a helpful error instead of a broken form
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg border border-gray-100 text-center space-y-4">
          <p className="text-red-600 font-medium">Invalid or missing reset link.</p>
          <Link to="/forgot-password" className="text-sm text-amber-700 hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { setError('Both fields are required.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError(null);
    try {
      await axiosClient.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Smart Campus Hub</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a new password</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-100">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Password updated!</h2>
            <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
            <Link to="/login" className="inline-block text-sm font-medium text-amber-700 hover:underline">
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-amber-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
              >
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link to="/login" className="font-medium text-amber-700 hover:underline">Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
