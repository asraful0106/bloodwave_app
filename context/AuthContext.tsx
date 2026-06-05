import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import apiClient from "@/config/client";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "access_token";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type AuthStatus = "authenticated" | "unauthenticated";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  status: AuthStatus;
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  /** Demo only — simulates a logged-in state without a real token. */
  tempIsLoggedIn: boolean;
  setTempLoggedIn: () => void;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
AuthContext.displayName = "AuthContext";

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unauthenticated");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempIsLoggedIn, setTempIsLoggedIn] = useState(false);

  const setTempLoggedIn = useCallback(() => setTempIsLoggedIn(true), []);
  const clearError = useCallback(() => setError(null), []);

  // Restore persisted token on mount
  useEffect(() => {
    let cancelled = false;

    async function restoreToken() {
      try {
        const stored = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (cancelled) return;
        if (stored) {
          setAccessToken(stored);
          setStatus("authenticated");
        }
      } catch (err) {
        console.error("[AuthContext] Failed to restore token:", err);
      }
    }

    restoreToken();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post(
        "/auth/login",
        { email, password },
      );
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
      setAccessToken(data.accessToken);
      setStatus("authenticated");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Login failed. Please try again.";
      setError(message);
      throw err; // re-throw so the screen can react if needed
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.post("/auth/logout");
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch (err) {
      console.error("[AuthContext] Logout error:", err);
    } finally {
      setAccessToken(null);
      setStatus("unauthenticated");
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      accessToken,
      isLoading,
      error,
      clearError,
      login,
      logout,
      tempIsLoggedIn,
      setTempLoggedIn,
    }),
    [
      status,
      accessToken,
      isLoading,
      error,
      clearError,
      login,
      logout,
      tempIsLoggedIn,
      setTempLoggedIn,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

/**
 * Returns the current auth context.
 * @throws When called outside of <AuthProvider />.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider />.");
  return ctx;
}

export default AuthContext;
