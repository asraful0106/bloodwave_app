// @/context/RegisterContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import apiClient from "@/config/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IRegisterPayload {
  f_name: string;
  l_name: string;
  phone: string;
  email: string;
  password: string;
  gender: string;
  date_of_birth: string;
  blood_group_name: string;
}

interface RegisterContextValue {
  register: (payload: IRegisterPayload) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const RegisterContext = createContext<RegisterContextValue | undefined>(
  undefined,
);

// ─── Provider ────────────────────────────────────────────────────────────────

export function RegisterProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  /**
   * Calls POST /user/register.
   * Returns `true` on success so the screen can redirect,
   * returns `false` (and sets error) on failure.
   */
  const register = async (payload: IRegisterPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
    //   await axios.post("/user/register", payload);
      await apiClient.post("/users/register", payload);
      return true;
    } catch (err: any) {
        console.log("Reg. Error: ", err)
      // Prefer a server-supplied message, fall back to a generic one
      const serverMessage =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Registration failed. Please try again.";

      setError(serverMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterContext.Provider
      value={{ register, isLoading, error, clearError }}
    >
      {children}
    </RegisterContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRegister(): RegisterContextValue {
  const ctx = useContext(RegisterContext);
  if (!ctx) {
    throw new Error("useRegister must be used inside <RegisterProvider>");
  }
  return ctx;
}
