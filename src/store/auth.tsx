"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, extra?: Partial<User>) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: User }>("/auth/login", { email, password });
    setUser(res.user);
    return res.user;
  }, []);

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
      isManager: user?.role === "manager",
      isAdmin: user?.role === "admin"
    }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
