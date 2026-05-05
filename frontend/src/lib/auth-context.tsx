'use client';

// Auth provider: holds current user, exposes login/register/logout.
// JWT lives in localStorage (managed by api-client). User data is
// rehydrated on mount via /auth/me when a token is present.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './api-services';
import { clearToken, getToken, setToken } from './api-client';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session on first mount: if token exists, fetch /me.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // After auth, fetch /me to get the canonical user shape (with profile,
  // learningGoals, currentLevel). Login/register payload is a flat subset.
  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    setToken(result.token);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await authApi.register({ email, password, name });
      setToken(result.token);
      const me = await authApi.me();
      setUser(me);
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
