"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user?: User; mfaRequired?: boolean; name?: string }>;
  register: (name: string, email: string, password: string, extra?: Partial<User>) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  verifyMfa: (code: string) => Promise<User>;
  requestPasswordReset: (email: string) => Promise<{ emailSent: boolean }>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
  enableMfa: () => Promise<{ secret: string; uri: string; account: string }>;
  verifyEnableMfa: (code: string) => Promise<void>;
  disableMfa: (code: string) => Promise<void>;
  isManager: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<{ user: User | null }>("/auth/me");
      setUser(me.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async session hydration on mount
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ user?: User; mfaRequired?: boolean; name?: string }> => {
      const res = await api.post<{ user?: User; mfaRequired?: boolean; name?: string }>("/auth/login", { email, password });
      if (res.user) setUser(res.user);
      return res;
    },
    []
  );

  const verifyMfa = useCallback(async (code: string) => {
    const res = await api.post<{ user: User }>("/auth/mfa/verify", { code });
    setUser(res.user);
    return res.user;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const res = await api.post<{ emailSent: boolean }>("/auth/password-reset/request", { email });
    return res;
  }, []);

  const confirmPasswordReset = useCallback(async (token: string, password: string) => {
    await api.post("/auth/password-reset/confirm", { token, password });
  }, []);

  const enableMfa = useCallback(async () => {
    return api.post<{ secret: string; uri: string; account: string }>("/auth/mfa/enable", {});
  }, []);

  const verifyEnableMfa = useCallback(async (code: string) => {
    await api.post("/auth/mfa/verify-enable", { code });
  }, []);

  const disableMfa = useCallback(
    async (code: string) => {
      await api.post("/auth/mfa/disable", { code });
      const me = await api.get<{ user: User | null }>("/auth/me");
      setUser(me.user);
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string, extra?: Partial<User>) => {
      const res = await api.post<{ user: User }>("/auth/register", { name, email, password, ...extra });
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout", {});
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      verifyMfa,
      requestPasswordReset,
      confirmPasswordReset,
      enableMfa,
      verifyEnableMfa,
      disableMfa,
      isManager: user?.role === "manager",
      isAdmin: user?.role === "admin"
    }),
    [user, loading, login, register, logout, refresh, verifyMfa, requestPasswordReset, confirmPasswordReset, enableMfa, verifyEnableMfa, disableMfa]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
