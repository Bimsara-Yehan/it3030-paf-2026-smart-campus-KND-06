/**
 * MainLayout — root shell for all authenticated pages.
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SessionTimeoutWarning from '../SessionTimeoutWarning';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

export default function MainLayout() {
  // Monitor the JWT expiry and surface warning state for the floating card.
  const { showWarning, secondsRemaining, extendSession } = useSessionTimeout();

  return (
    // Full-viewport flex container — prevents the whole page from scrolling.
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar (fixed width, scrolls its own nav list if needed) ── */}
      <Sidebar />

      {/* ── Main column: topbar + scrollable content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar pinned to the top of the right column */}
        <Topbar />

        {/* Page content area — scrolls independently of the sidebar */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Session timeout warning — fixed bottom-right, rendered above everything ── */}
      <SessionTimeoutWarning
        showWarning={showWarning}
        secondsRemaining={secondsRemaining}
        extendSession={extendSession}
      />
    </div>
  );
}
