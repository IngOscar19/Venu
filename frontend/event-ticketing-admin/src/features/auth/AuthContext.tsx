import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from './authApi';

interface OrganizerProfile {
  id: string;
  name: string;
  description?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  verificationLevel: 'Unverified' | 'Basic' | 'Pro' | 'Enterprise';
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ORGANIZER' | 'CUSTOMER' | 'ACCESS_OPERATOR';
  organizer?: OrganizerProfile;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authApi.getMe(storedToken);
      setToken(storedToken);
      setUser(profile);
    } catch {
      // Token inválido o expirado
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Al montar la app, validar el token con el servidor
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { token: newToken, user: newUser } = await authApi.login(email, password);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
