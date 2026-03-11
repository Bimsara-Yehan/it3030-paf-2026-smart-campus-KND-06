/**
 * RoleRoute — guards pages that require a specific user role.
 *
 * Must be nested inside a <PrivateRoute> so the user is guaranteed
 * to be authenticated when this component renders.
 *
 * Usage:
 *   <Route element={<PrivateRoute />}>
 *     <Route element={<RoleRoute allowedRoles={[UserRole.ADMIN]} />}>
 *       <Route path="/admin" element={<AdminPage />} />
 *     </Route>
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface RoleRouteProps {
  /** Roles that are permitted to access the nested routes. */
  allowedRoles: UserRole[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  // user should always be present inside PrivateRoute, but guard defensively.
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
