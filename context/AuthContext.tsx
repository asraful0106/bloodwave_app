import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import apiClient from "@/config/client";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "access_token";
const USER_DATA_KEY = "user";

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
  userData: any;
  isLoading: boolean;
  error: string | null;

  clearError: () => void;
  refreshUser: () => Promise<void>;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;

  tempIsLoggedIn: boolean;
  setTempLoggedIn: () => void;
}

// ─────────────────────────────────────────────
// Storage Helpers
// ─────────────────────────────────────────────

const storeUserData = async (value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(USER_DATA_KEY, jsonValue);
  } catch (error) {
    console.log("Store user error:", error);
  }
};

export const getUserData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_DATA_KEY);
    return jsonValue ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.log("Get user error:", error);
    return null;
  }
};

const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.log("Remove user error:", error);
  }
};

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

  const [userData, setUserData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [tempIsLoggedIn, setTempIsLoggedIn] = useState(false);

  const setTempLoggedIn = useCallback(() => {
    setTempIsLoggedIn(true);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ─────────────────────────────────────────────
  // Refresh User
  // ─────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const user = await getUserData();
      setUserData(user);
    } catch (error) {
      console.log("Refresh user error:", error);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Restore Auth State On App Start
  // ─────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

        const user = await getUserData();

        if (!mounted) return;

        if (token) {
          setAccessToken(token);
          setUserData(user);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("[AuthContext] Session restore failed:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.post("/auth/login", {
        email,
        password,
      });

      // Adjust according to your API response
      const user = data.data;
      const token = data.data.accessToken;

      await storeUserData(user);

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);

      setUserData(user);
      setAccessToken(token);
      setStatus("authenticated");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";

      setError(message);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.log("Logout API error:", error);
    } finally {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);

      await removeUserData();

      setAccessToken(null);
      setUserData(null);
      setStatus("unauthenticated");

      setIsLoading(false);

      router.replace("/(auth)/login");
    }
  }, []);

  // ─────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      accessToken,
      userData,
      isLoading,
      error,

      clearError,
      refreshUser,

      login,
      logout,

      tempIsLoggedIn,
      setTempLoggedIn,
    }),
    [
      status,
      accessToken,
      userData,
      isLoading,
      error,
      clearError,
      refreshUser,
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export default AuthContext;
