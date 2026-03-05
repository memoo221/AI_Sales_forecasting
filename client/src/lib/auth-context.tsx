"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, User } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  const register = async (formData: { email: string; password: string; companyName: string }) => {
    const data = await authApi.register(formData);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
