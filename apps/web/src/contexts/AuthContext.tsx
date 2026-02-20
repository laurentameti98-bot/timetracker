import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getAuthToken,
  getAuthUser,
  setAuth,
  clearAuth,
  type AuthUser,
} from "../lib/authStorage";
import { api } from "../lib/api";
import { setOnUnauthorized } from "../lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser);
  const [token, setTokenState] = useState<string | null>(getAuthToken);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (idToken: string) => {
    const { token: newToken, user: newUser } = await api.auth.google(idToken);
    setAuth(newToken, newUser);
    setTokenState(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
    setIsLoading(false);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
