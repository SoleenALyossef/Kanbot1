import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { ApiError, setUnauthorizedHandler, tokenStore } from '../api/client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/api';

/** loading = checking a saved token · error = server unreachable at start-up */
export type AuthStatus = 'loading' | 'authed' | 'guest' | 'error';

interface AuthValue {
  user: User | null;
  status: AuthStatus;
  login: (values: LoginRequest) => Promise<void>;
  register: (values: RegisterRequest) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.get() ? 'loading' : 'guest'));
  const [attempt, setAttempt] = useState(0);

  const endSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  // AUTH-6: any 401 (except login/register) ends the session and returns to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession();
      const here = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith('/login')) {
        navigate(`/login?redirect=${encodeURIComponent(here)}&reason=expired`, { replace: true });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [endSession, navigate]);

  // AUTH-3: restore the session on app start.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let alive = true;
    authApi
      .me()
      .then(({ user: me }) => {
        if (!alive) return;
        setUser(me);
        setStatus('authed');
      })
      .catch((err: unknown) => {
        if (!alive || (err instanceof ApiError && err.status === 401)) return; // the 401 handler cleans up
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const startSession = useCallback(({ token, user: me }: AuthResponse) => {
    tokenStore.set(token);
    setUser(me);
    setStatus('authed');
  }, []);

  const login = useCallback(async (values: LoginRequest) => startSession(await authApi.login(values)), [startSession]);
  const register = useCallback(
    async (values: RegisterRequest) => startSession(await authApi.register(values)),
    [startSession],
  );

  const logout = useCallback(() => {
    endSession();
    navigate('/login', { replace: true });
  }, [endSession, navigate]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, retry }),
    [user, status, login, register, logout, retry],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
