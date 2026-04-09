/**
 * MainLayout — root shell for all authenticated pages.
 *
 * Structure:
 *
 *  ┌─────────────────────────────────────────────────────┐
 *  │  Sidebar (256px, full-height, scroll-independent)   │
 *  │  ┌───────────────────────────────────────────────┐  │
 *  │  │ Topbar (64px fixed height)                    │  │
 *  │  ├───────────────────────────────────────────────┤  │
 *  │  │ <Outlet /> (remaining height, scrollable)     │  │
 *  │  └───────────────────────────────────────────────┘  │
 *  └─────────────────────────────────────────────────────┘
 *
 * Uses a pure flex layout (no fixed positioning) so the sidebar
 * and content column are always the same height as the viewport.
 * Page content scrolls inside its own flex child, not the window.
 */

import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import SessionTimeoutWarning from '@/components/SessionTimeoutWarning';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

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
