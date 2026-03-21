/**
 * RegisterPage — new account creation form.
 *
 * Features:
 *  - Full Name / Email / Password / Confirm Password fields
 *  - react-hook-form validation (inline error messages per field)
 *  - Confirm password cross-field validation
 *  - API error banner above the form
 *  - Loading spinner on the submit button
 *  - Google OAuth shortcut (same path as LoginPage)
 *  - Guards: already-authenticated users are bounced to /dashboard
 *  - Password strength indicator (progress bar + checklist) beneath the password field
 *  - Show / hide password toggle on both password fields
 *
 * Rules:
 *  - ALL hooks are called unconditionally before any early returns to satisfy
 *    the Rules of Hooks.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// ── Local form type (adds confirmPassword for client-side validation only) ────
// RegisterRequest from @/types only has { fullName, email, password }.
// We define a superset here and strip confirmPassword before calling the API.

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ── Password strength logic ───────────────────────────────────────────────────

interface StrengthCriteria {
  label: string;
  met:   boolean;
}

interface StrengthResult {
  score:      number;           // 0–4: number of criteria met
  label:      string;           // "Weak" | "Fair" | "Good" | "Strong"
  barWidth:   string;           // Tailwind width class
  barColour:  string;           // Tailwind bg colour class
  labelColor: string;           // Tailwind text colour class
  criteria:   StrengthCriteria[];
}

/**
 * Evaluates password strength against 4 criteria and returns display metadata.
 * The validation rules are intentionally separate from react-hook-form's rules —
 * the indicator is informational only; the form only enforces minLength: 8.
 */
function evaluateStrength(password: string): StrengthResult {
  const criteria: StrengthCriteria[] = [
    { label: 'At least 8 characters',  met: password.length >= 8 },
    { label: 'Uppercase letter (A–Z)',  met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)',  met: /[a-z]/.test(password) },
    { label: 'Contains a number (0–9)', met: /[0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  const META: Record<number, { label: string; barWidth: string; barColour: string; labelColor: string }> = {
    0: { label: '',       barWidth: 'w-0',    barColour: 'bg-gray-200',   labelColor: 'text-gray-400'  },
    1: { label: 'Weak',   barWidth: 'w-1/4',  barColour: 'bg-red-500',    labelColor: 'text-red-600'   },
    2: { label: 'Fair',   barWidth: 'w-1/2',  barColour: 'bg-orange-400', labelColor: 'text-orange-600' },
    3: { label: 'Good',   barWidth: 'w-3/4',  barColour: 'bg-yellow-400', labelColor: 'text-yellow-600' },
    4: { label: 'Strong', barWidth: 'w-full', barColour: 'bg-green-500',  labelColor: 'text-green-600'  },
  };

  return { score, criteria, ...META[score] };
}

// ── Eye-icon SVG components ───────────────────────────────────────────────────

function EyeOpenIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {

  // ── All hooks unconditionally at the top ─────────────────────────────────
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [serverError,      setServerError]      = useState<string | null>(null);
  const [showPassword,     setShowPassword]      = useState(false);
  const [showConfirmPw,    setShowConfirmPw]      = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  // Watch both password fields.
  const passwordValue = watch('password', '');

  // Derive strength result on every render (cheap pure function, no memo needed).
  const strength = evaluateStrength(passwordValue ?? '');

  // ── Guards (after all hooks) ──────────────────────────────────────────────

  // Defer rendering until the stored token has been validated on app start.
  if (isLoading) return null;

  // Bounce already-authenticated users straight to the dashboard.
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  // ── Submit handler ────────────────────────────────────────────────────────

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      // Strip confirmPassword — the backend does not expect it.
      await registerUser({
        fullName: data.fullName,
        email:    data.email,
        password: data.password,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      // Surface the server message when available; fall back to a generic string.
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setServerError(message);
    }
  };

  /** Kick off the Spring Security Google OAuth2 flow — same path as LoginPage. */
  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/oauth2/google';
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* ── Header ── */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join Smart Campus Hub</p>
        </div>

        {/* ── Server error banner ── */}
        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* ── Registration form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              {...register('fullName', {
                required:  'Full name is required',
                minLength: { value: 2,   message: 'Name must be at least 2 characters' },
                maxLength: { value: 100, message: 'Name must be at most 100 characters' },
              })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern:  { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
              })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password + strength indicator */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>

            {/* Input with show/hide toggle */}
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password', {
                  required:  'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}

            {/* ── Strength indicator — only visible once the user has started typing ── */}
            {passwordValue.length > 0 && (
              <div className="mt-2 space-y-2">

                {/* Progress bar + label */}
                <div className="flex items-center gap-3">
                  {/* Track */}
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={[
                        'h-full rounded-full transition-all duration-300',
                        strength.barColour,
                        strength.barWidth,
                      ].join(' ')}
                    />
                  </div>
                  {/* Label */}
                  {strength.label && (
                    <span className={['text-xs font-semibold', strength.labelColor].join(' ')}>
                      {strength.label}
                    </span>
                  )}
                </div>

                {/* Criteria checklist */}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {strength.criteria.map((c) => (
                    <li key={c.label} className="flex items-center gap-1.5">
                      {c.met ? (
                        <svg className="h-3 w-3 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                      <span className={['text-xs', c.met ? 'text-green-600' : 'text-gray-400'].join(' ')}>
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>

              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>

            {/* Input with show/hide toggle */}
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                type={showConfirmPw ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate:  (value) =>
                    value === passwordValue || 'Passwords do not match',
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex={-1}
              >
                {showConfirmPw ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-2">or continue with</span>
          </div>
        </div>

        {/* ── Google OAuth button ── */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {/* Google "G" SVG logo */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        {/* ── Login link ── */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
