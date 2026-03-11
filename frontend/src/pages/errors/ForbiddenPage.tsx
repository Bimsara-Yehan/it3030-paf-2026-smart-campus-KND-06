/**
 * ForbiddenPage — displayed when a user tries to access a resource
 * they do not have the required role for (HTTP 403 equivalent).
 */

import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-9xl font-extrabold text-blue-600">403</p>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">Access Denied</h1>

        <p className="mt-2 text-gray-500">
          You don't have permission to view this page.
          <br />
          Contact your administrator if you believe this is a mistake.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="mt-8 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
