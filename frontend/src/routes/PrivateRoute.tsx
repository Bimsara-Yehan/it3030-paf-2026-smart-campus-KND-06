/**
 * PrivateRoute — wraps pages that require authentication.
 *
 * Behaviour:
 *  - While the auth state is resolving (isLoading) show a centered spinner
 *    so the user never sees an unwanted redirect flash.
 *  - Once resolved, unauthenticated visitors are redirected to /login.
 *  - Authenticated users see the nested route via <Outlet />.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
