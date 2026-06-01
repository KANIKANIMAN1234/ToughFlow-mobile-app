"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/lib/types";
import { api } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (tenantCode: string, userName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/login", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = (await res.json()) as { user: User };
        setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (tenantCode: string, userName: string) => {
    const { user: loggedIn } = await api.post<{ user: User }>(
      "/api/auth/login",
      { tenantCode, userName }
    );
    setUser(loggedIn);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/login", { method: "DELETE", credentials: "include" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
