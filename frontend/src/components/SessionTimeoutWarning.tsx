/**
 * SessionTimeoutWarning — floating card that warns the user their session is
 * about to expire and offers "Stay Logged In" / "Sign Out" actions.
 *
 * Rendered by MainLayout so it is available on every authenticated page.
 * The card uses a state-driven entrance animation (opacity + translateY)
 * achieved purely with Tailwind transition utilities — no custom keyframes needed.
 *
 * Props mirror the values returned by useSessionTimeout so the parent
 * only needs to pass them straight through:
 *
 *   const { showWarning, secondsRemaining, extendSession } = useSessionTimeout();
 *   <SessionTimeoutWarning
 *     showWarning={showWarning}
 *     secondsRemaining={secondsRemaining}
 *     extendSession={extendSession}
 *     logout={logout}
 *   />
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SessionTimeoutWarningProps {
  showWarning:      boolean;
  secondsRemaining: number;
  extendSession:    () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a human-friendly countdown string.
 *   119 → "1:59"
 *   60  → "1:00"
 *   45  → "0:45"
 */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SessionTimeoutWarning({
  showWarning,
  secondsRemaining,
  extendSession,
}: SessionTimeoutWarningProps) {
  const { logout } = useAuth();

  /**
   * Deferred `visible` state drives the CSS entrance animation.
   * When the card first mounts (showWarning flips to true) it starts invisible
   * (opacity-0 translate-y-2) and after one browser tick transitions to the
   * fully visible state (opacity-100 translate-y-0).
   * This gives a subtle slide-up + fade-in without any custom @keyframes.
   */
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!showWarning) {
      setVisible(false);
      return;
    }
    // One-tick delay lets the DOM paint the initial hidden state first.
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, [showWarning]);

  const [extending, setExtending] = useState(false);

  const handleExtend = async () => {
    setExtending(true);
    try {
      await extendSession();
    } finally {
      setExtending(false);
    }
  };

  const handleSignOut = () => {
    logout();
    // Navigation to /login is handled by the PrivateRoute redirect after logout.
  };

  // ── Don't render anything when the warning is dismissed ────────────────────
  if (!showWarning) return null;

  // ── Urgency levels — colour shifts to red in the final 30 seconds ──────────
  const isUrgent   = secondsRemaining <= 30;
  const accentRing = isUrgent ? 'ring-red-300'    : 'ring-orange-200';
  const iconBg     = isUrgent ? 'bg-red-100'      : 'bg-orange-100';
  const iconColor  = isUrgent ? 'text-red-500'    : 'text-orange-500';
  const titleColor = isUrgent ? 'text-red-700'    : 'text-orange-700';
  const timerBg    = isUrgent ? 'bg-red-50'       : 'bg-orange-50';
  const timerText  = isUrgent ? 'text-red-600'    : 'text-orange-600';
  const timerBorder= isUrgent ? 'border-red-200'  : 'border-orange-200';

  return (
    // Fixed bottom-right floating card
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Session expiring soon"
      className={[
        // Positioning & sizing
        'fixed bottom-5 right-5 z-50 w-80',
        // Card styling
        'rounded-2xl bg-white shadow-2xl ring-1',
        accentRing,
        // Entrance animation via Tailwind transition utilities
        'transition-all duration-200 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      ].join(' ')}
    >
      <div className="p-5">

        {/* ── Header row: icon + title ── */}
        <div className="flex items-start gap-3">
          {/* Warning icon */}
          <div className={['mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg].join(' ')}>
            <svg
              className={['h-5 w-5', iconColor].join(' ')}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Title + message */}
          <div className="flex-1 min-w-0">
            <p className={['text-sm font-semibold', titleColor].join(' ')}>
              Session Expiring Soon
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Your session will expire in{' '}
              <span className="font-medium text-gray-700">
                {secondsRemaining} {secondsRemaining === 1 ? 'second' : 'seconds'}
              </span>
              . Would you like to stay logged in?
            </p>
          </div>
        </div>

        {/* ── Countdown timer ── */}
        <div className={[
          'mt-4 flex items-center justify-center rounded-xl border py-2.5',
          timerBg, timerBorder,
        ].join(' ')}>
          <svg
            className={['mr-2 h-4 w-4', timerText].join(' ')}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={['text-2xl font-bold tabular-nums tracking-tight', timerText].join(' ')}>
            {formatCountdown(secondsRemaining)}
          </span>
        </div>

        {/* ── Action buttons ── */}
        <div className="mt-4 flex gap-2">
          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            Sign Out
          </button>

          {/* Stay Logged In */}
          <button
            type="button"
            onClick={handleExtend}
            disabled={extending}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white transition-colors',
              isUrgent
                ? 'bg-red-600 hover:bg-red-700 disabled:opacity-60'
                : 'bg-orange-500 hover:bg-orange-600 disabled:opacity-60',
            ].join(' ')}
          >
            {extending ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Extending…
              </>
            ) : (
              'Stay Logged In'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
