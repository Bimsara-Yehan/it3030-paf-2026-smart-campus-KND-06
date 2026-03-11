/**
 * Authentication context for the Smart Campus Operations Hub.
 *
 * Provides the entire component tree with:
 *  - Current user object and access token
 *  - isAuthenticated / isLoading flags
 *  - login, logout, and register actions
 *
 * On mount the context validates any stored token by calling GET /auth/me.
 * If the token is invalid the axios response interceptor handles the refresh;
 * if that also fails it clears storage and the user is marked unauthenticated.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import axiosClient, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/axiosClient';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types';

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(ACCESS_TOKEN_KEY),
  );
  // Start in the loading state so PrivateRoute waits before redirecting.
  const [isLoading, setIsLoading] = useState(true);

  // ── Validate stored token on app start ──────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    axiosClient
      .get<User>('/auth/me')
      .then(({ data }) => {
        setUser(data);
        setAccessToken(storedToken);
      })
      .catch(() => {
        // Token was rejected even after a refresh attempt — force a clean slate.
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const login = async (credentials: LoginRequest): Promise<void> => {
    const { data } = await axiosClient.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  };

  const register = async (registerData: RegisterRequest): Promise<void> => {
    const { data } = await axiosClient.post<AuthResponse>('/auth/register', registerData);
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Consume authentication state anywhere inside an AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
