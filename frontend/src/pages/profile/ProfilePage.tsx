/**
 * ProfilePage — account overview for the currently authenticated user.
 *
 * Sections:
 *  1. Profile card  — avatar, name, email, role badge, member-since, status
 *  2. Account info  — login method, account creation date
 *  3. Edit profile  — fullName editable; email read-only; PATCH /users/profile
 *  4. Change password — POST /auth/change-password
 *                       Hidden for Google-OAuth accounts that have no password.
 *  5. Danger zone   — "Sign out of all devices" calls POST /auth/logout
 *                     then clears the AuthContext and redirects to /login.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient, { REFRESH_TOKEN_KEY } from '../../api/axiosClient';
import type { UserRole } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format an ISO-8601 date string as a human-readable date. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Derive up to 2 initials from a full name for the avatar fallback. */
function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/** Role badge display config — mirrors the Sidebar role colours. */
const ROLE_BADGE: Record<UserRole, { label: string; classes: string }> = {
  ADMIN:      { label: 'Administrator',   classes: 'bg-red-100 text-red-700' },
  TECHNICIAN: { label: 'Technician',      classes: 'bg-purple-100 text-purple-700' },
  USER:       { label: 'User', classes: 'bg-green-100 text-green-700' },
};

// ── Section card wrapper ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Read-only field ───────────────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────

function InputField({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  type = 'text',
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        autoComplete={autoComplete}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none',
          readOnly
            ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
            : 'border-gray-300 bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-100',
        ].join(' ')}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Section: Edit Profile ─────────────────────────────────────────────────
  const [profileName, setProfileName]       = useState(user?.fullName ?? '');
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError]     = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) { setProfileError('Full name is required.'); return; }
    setProfileSaving(true); setProfileError(null); setProfileSuccess(null);
    try {
      await axiosClient.patch('/users/profile', { fullName: profileName.trim() });
      setProfileSuccess('Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err.response?.data?.message ?? 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Section: Change Password ──────────────────────────────────────────────
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwSuccess, setPwSuccess]   = useState<string | null>(null);
  const [pwError, setPwError]       = useState<string | null>(null);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true); setPwError(null); setPwSuccess(null);
    try {
      await axiosClient.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setPwError(err.response?.data?.message ?? 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Section: Danger Zone ──────────────────────────────────────────────────
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOutAll = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // If the server-side revocation fails (token already expired, network error)
      // we still clear local state — the user should not be stuck on the page.
    } finally {
      logout();
      navigate('/login', { replace: true });
      setIsSigningOut(false);
    }
  };

  // Guard — should never render without a user but protects against edge cases.
  if (!user) return null;

  const badge    = ROLE_BADGE[user.role];
  const initials = getInitials(user.fullName);

  // Detect Google-OAuth accounts by the profile picture host.
  // OAuth users have no local password, so the Change Password section is hidden.
  const isOAuthUser =
    !!user.profilePicture && user.profilePicture.includes('googleusercontent.com');

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">

      {/* ── Page title ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Your account details and preferences.</p>
      </div>

      <div className="space-y-6">

        {/* ══ 1. Profile card ══════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-5">

            {/* Avatar */}
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.fullName}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amber-700 text-xl font-bold text-white shadow">
                {initials}
              </div>
            )}

            {/* Details */}
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{user.fullName}</h2>
              <p className="mt-0.5 text-sm text-gray-500">{user.email}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {/* Role badge */}
                <span className={['rounded-full px-2.5 py-0.5 text-xs font-semibold', badge.classes].join(' ')}>
                  {badge.label}
                </span>

                {/* Status badge */}
                {user.isActive ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                    Inactive
                  </span>
                )}

                {/* OAuth badge */}
                {isOAuthUser && (
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                    Google Account
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* ══ 2. Account info ══════════════════════════════════════════════════ */}
        <Section title="Account Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField
              label="Login method"
              value={isOAuthUser ? 'Google OAuth' : 'Email & Password'}
            />
            <ReadOnlyField
              label="Account created"
              value={formatDate(user.createdAt)}
            />
            <ReadOnlyField label="Email address" value={user.email} />
            <ReadOnlyField label="User ID" value={user.id} />
          </div>
        </Section>

        {/* ══ 3. Edit profile ══════════════════════════════════════════════════ */}
        <Section title="Edit Profile">
          {profileSuccess && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{profileSuccess}</div>
          )}
          {profileError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</div>
          )}
          <div className="space-y-4">
            <InputField
              id="fullName"
              label="Full Name"
              value={profileName}
              onChange={setProfileName}
            />
            <InputField
              id="email"
              label="Email Address"
              value={user.email}
              readOnly
              type="email"
            />
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={profileSaving}
              onClick={handleSaveProfile}
              className="rounded-full bg-amber-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
            >
              {profileSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Section>

        {/* ══ 4. Change password — hidden for OAuth accounts ═══════════════════ */}
        {!isOAuthUser && (
          <Section title="Change Password">
            {pwSuccess && (
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{pwSuccess}</div>
            )}
            {pwError && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pwError}</div>
            )}
            <div className="space-y-4">
              <InputField
                id="currentPassword"
                label="Current Password"
                value={currentPw}
                onChange={setCurrentPw}
                type="password"
                autoComplete="current-password"
              />
              <InputField
                id="newPassword"
                label="New Password"
                value={newPw}
                onChange={setNewPw}
                type="password"
                autoComplete="new-password"
              />
              <InputField
                id="confirmPassword"
                label="Confirm New Password"
                value={confirmPw}
                onChange={setConfirmPw}
                type="password"
                autoComplete="new-password"
                error={confirmPw && newPw !== confirmPw ? 'Passwords do not match.' : undefined}
              />
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={pwSaving}
                onClick={handleChangePassword}
                className="rounded-full bg-amber-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
              >
                {pwSaving ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </Section>
        )}

        {/* ══ 5. Danger zone ═══════════════════════════════════════════════════ */}
        <Section title="Danger Zone">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Sign out of all devices</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Revokes all active refresh tokens. You will be signed out everywhere.
              </p>
              {signOutError && (
                <p className="mt-1 text-xs text-red-600">{signOutError}</p>
              )}
            </div>
            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOutAll}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              {isSigningOut ? 'Signing out…' : 'Sign out all'}
            </button>
          </div>
        </Section>

      </div>
    </div>
  );
}
