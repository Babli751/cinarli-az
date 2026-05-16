import { useEffect, useState, useCallback } from "react";
import { api, type User } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    localStorage.setItem("token", token);
    setUser(user);
    return user;
  };

  const register = async (email: string, password: string, full_name: string) => {
    const { token, user } = await api.register(email, password, full_name);
    localStorage.setItem("token", token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return {
    user,
    setUser,
    session: user ? { user } : null,
    isAdmin: user?.role === "admin",
    loading,
    login,
    register,
    logout,
  };
}
