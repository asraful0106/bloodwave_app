import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "access_token";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  /** Current authentication lifecycle status */
  status: AuthStatus;
  /** Convenience boolean — true only when status is "authenticated" */
  isAuthenticated: boolean;
  /** The stored access token, or null when logged out */
  accessToken: string | null;
}

interface AuthContextValue extends AuthState {
  /**
   * Persists the access token to SecureStore and marks the session
   * as authenticated.
   */
  login: (token: string) => Promise<void>;
  /**
   * Removes the access token from SecureStore and resets all auth
   * state back to unauthenticated.
   */
  logout: () => Promise<void>;

  // ── DEMO ONLY — remove this block when real auth is wired up ────────────
  /** Temporary flag for quick UI demos. Always starts as false. */
  tempIsLoggedIn: boolean;
  /** Sets tempIsLoggedIn to true. Use to simulate a logged-in state during demos. */
  setTempLoggedIn: () => void;
  // ── END DEMO ─────────────────────────────────────────────────────────────
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
AuthContext.displayName = "AuthContext";

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // ── DEMO ONLY — remove this block when real auth is wired up ────────────
  // Quick toggle so you can demo logged-in screens without a real token.
  // Usage:  const { tempIsLoggedIn, setTempLoggedIn } = useAuth();
  //         <Button onPress={setTempLoggedIn} title="Demo Login" />
  const [tempIsLoggedIn, setTempIsLoggedIn] = useState<boolean>(false);
  const setTempLoggedIn = useCallback(() => setTempIsLoggedIn(true), []);
  // ── END DEMO ─────────────────────────────────────────────────────────────

  // ── Restore persisted token on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function restoreToken() {
      try {
        const stored = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (cancelled) return;

        if (stored) {
          setAccessToken(stored);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("[AuthContext] Failed to restore token:", error);
        if (!cancelled) setStatus("unauthenticated");
      }
    }

    restoreToken();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (token: string) => {
    if (!token)
      throw new Error("[AuthContext] login() requires a non-empty token.");

    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      setAccessToken(token);
      setStatus("authenticated");
    } catch (error) {
      console.error("[AuthContext] Failed to store token:", error);
      throw error;
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      // Log but continue — local state should still be cleared.
      console.error(
        "[AuthContext] Failed to delete token from SecureStore:",
        error,
      );
    } finally {
      setAccessToken(null);
      setStatus("unauthenticated");
    }
  }, []);

  // ── Memoised context value ─────────────────────────────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      accessToken,
      login,
      logout,
      // ── DEMO ONLY — remove these two lines when real auth is wired up ──
      tempIsLoggedIn,
      setTempLoggedIn,
      // ── END DEMO ────────────────────────────────────────────────────────
    }),
    [status, accessToken, login, logout, tempIsLoggedIn, setTempLoggedIn], // remove tempIsLoggedIn & setTempLoggedIn from deps when cleaning up
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

/**
 * Returns the current auth context.
 *
 * @example
 * const { isAuthenticated, accessToken, login, logout } = useAuth();
 *
 * @throws When called outside of <AuthProvider />.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider />.");
  }
  return ctx;
}

export default AuthContext;
