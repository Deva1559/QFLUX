import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken, getAuthToken } from './api';

export interface MobileUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: MobileUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount from secure storage
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
      }
    } catch {
      await setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      setToken(res.access_token);
      setUser(res.user);
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string, role?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.register(email.trim(), password, fullName.trim(), role);
      // Auto login upon successful registration
      await login(email, password);
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await setAuthToken(null);
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
