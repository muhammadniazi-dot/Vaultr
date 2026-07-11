import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import {
  activateSession,
  disableBiometricLogin as disableBiometricLoginRequest,
  enableBiometricLogin as enableBiometricLoginRequest,
  getStoredBiometricToken,
  getStoredBiometricUser,
  getStoredToken,
  getStoredUser,
  isBiometricLoginEnabled,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
  updateStoredUser,
} from '../services/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /**
   * True if the user has opted in to biometric login AND a biometric-specific
   * token/user is actually in Secure Store. This is deliberately independent
   * of whether there's an active session — it's read from keys `logout()`
   * never touches, so it stays true across sign-out/sign-in.
   */
  canUseBiometricLogin: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  /**
   * Restores the session from the biometric-specific token/user in Secure
   * Store, without hitting the network. Used after a successful Face
   * ID/Touch ID check. Returns null (and leaves the user logged out) if
   * nothing valid is stored.
   */
  restoreSession: () => Promise<User | null>;
  /** Opts in to biometric login using the current active session's token/user. */
  enableBiometricLogin: () => Promise<void>;
  /** Explicit opt-out — the only thing that should ever hide the biometric button for good. */
  disableBiometricLogin: () => Promise<void>;
  /** Replaces the in-memory + stored user (e.g. after email verification flips `emailVerified`). */
  refreshUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function checkCanUseBiometricLogin(): Promise<boolean> {
  const [enabled, biometricToken] = await Promise.all([isBiometricLoginEnabled(), getStoredBiometricToken()]);
  return enabled && Boolean(biometricToken);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canUseBiometricLogin, setCanUseBiometricLogin] = useState(false);

  useEffect(() => {
    (async () => {
      // Intentionally does NOT auto-restore `user` here — the session itself
      // is only ever restored explicitly, via a fresh password login or a
      // successful Face ID/Touch ID check (restoreSession()).
      setCanUseBiometricLogin(await checkCanUseBiometricLogin());
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await loginRequest(email, password);
    setUser(loggedInUser);
    setCanUseBiometricLogin(await checkCanUseBiometricLogin());
    return loggedInUser;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const newUser = await signupRequest(email, password, name);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    // Only clears the active session — never touches the biometric keys, so
    // canUseBiometricLogin (and the button it drives) is unaffected.
    await logoutRequest();
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const [token, storedUser] = await Promise.all([getStoredBiometricToken(), getStoredBiometricUser()]);
    if (token && storedUser) {
      await activateSession(token, storedUser);
      setUser(storedUser);
      return storedUser;
    }
    return null;
  }, []);

  const enableBiometricLogin = useCallback(async () => {
    const [token, activeUser] = await Promise.all([getStoredToken(), getStoredUser()]);
    if (!token || !activeUser) {
      throw new Error('You need to be logged in to enable biometric login.');
    }
    await enableBiometricLoginRequest(token, activeUser);
    setCanUseBiometricLogin(true);
  }, []);

  const disableBiometricLogin = useCallback(async () => {
    await disableBiometricLoginRequest();
    setCanUseBiometricLogin(false);
  }, []);

  const refreshUser = useCallback(async (updated: User) => {
    setUser(updated);
    await updateStoredUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        canUseBiometricLogin,
        login,
        signup,
        logout,
        restoreSession,
        enableBiometricLogin,
        disableBiometricLogin,
        refreshUser,
      }}
    >
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
