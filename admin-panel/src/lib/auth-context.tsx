// @refresh reset
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "./api";

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.getProfile()
        .then((data: any) => {
          // The profile response might be nested
          const profile = data.user || data.profile || data;
          setUser(profile);
        })
        .catch(() => {
          api.logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    const profile = data.user || data;
    setUser(profile);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
