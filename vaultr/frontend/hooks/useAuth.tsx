import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import {
  getStoredToken,
  getStoredUser,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
} from '../services/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /** True if a token + user are already in Secure Store from a previous session. */
  hasStoredSession: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  /**
   * Restores the session from the token/user already in Secure Store, without
   * hitting the network. Used after a successful biometric check — the JWT was
   * issued by a previous email/password login, biometrics just unlocks it again.
   * Returns null (and leaves the user logged out) if nothing valid is stored.
   */
  restoreSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStoredSession, setHasStoredSession] = useState(false);

  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([getStoredToken(), getStoredUser()]);
      // Intentionally does NOT auto-restore `user` here. A stored token only
      // means the login screen can offer biometric login as a shortcut — the
      // session itself is restored explicitly via restoreSession(), either
      // after a successful Face ID/Touch ID check or a fresh password login.
      setHasStoredSession(Boolean(token && storedUser));
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await loginRequest(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const newUser = await signupRequest(email, password, name);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setHasStoredSession(false);
  }, []);

  const restoreSession = useCallback(async () => {
    const [token, storedUser] = await Promise.all([getStoredToken(), getStoredUser()]);
    if (token && storedUser) {
      setUser(storedUser);
      return storedUser;
    }
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, hasStoredSession, login, signup, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
