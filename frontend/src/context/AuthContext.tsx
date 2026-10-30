import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Security Trade-Off Documentation:
 * 
 * Token Storage:
 * Browser localStorage is used for client-side JWT persistence to support page refreshes
 * across scientific research sessions.
 * 
 * Trade-offs:
 * - LocalStorage is accessible to JavaScript running within the same origin. It is susceptible
 *   to cross-site scripting (XSS) if malicious third-party dependencies are injected.
 * - However, it prevents Cross-Site Request Forgery (CSRF) without requiring double-submit cookie
 *   or CSRF token synchronization architectures.
 * - All tokens are signed with HMAC-SHA256 and enforce a 24-hour expiration (ACCESS_TOKEN_EXPIRE_MINUTES)
 *   validated on every protected endpoint in FastAPI.
 * - In production enterprise deployments, an httpOnly, SameSite=Strict cookie architecture
 *   with server-driven refresh tokens is recommended.
 */

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authModalReason: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: string) => Promise<void>;
  logout: () => void;
  openAuthModal: (mode?: 'login' | 'register', reason?: string) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, reason?: string) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => api.getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Restore session from token on mount
  const restoreSession = useCallback(async () => {
    const existingToken = api.getAuthToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      setToken(existingToken);
      setAuthError(null);
    } catch {
      // Token invalid or expired
      api.setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Listen for unauthorized 401 events from api client
  useEffect(() => {
    const handleUnauthorized = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      api.setAuthToken(null);
      setToken(null);
      setUser(null);
      setAuthError(customEv.detail || 'Session expired. Please log in again.');
      setIsAuthModalOpen(true);
      setAuthModalMode('login');
      setAuthModalReason('Your session has expired or requires authentication.');
    };

    window.addEventListener('qflux:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('qflux:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.login(email, password);
      setToken(res.access_token);
      setUser(res.user);
      setIsAuthModalOpen(false);
      setAuthModalReason(null);
      
      // Execute any pending action that was blocked by authentication
      if (pendingAction) {
        try {
          pendingAction();
        } catch (_) {}
        setPendingAction(null);
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please verify credentials.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string, role?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await api.register(email, password, fullName, role);
      // Auto login after successful registration
      await login(email, password);
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setAuthToken(null);
    setToken(null);
    setUser(null);
    setAuthError(null);
    setPendingAction(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login', reason?: string) => {
    setAuthModalMode(mode);
    setAuthModalReason(reason || null);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalReason(null);
    setAuthError(null);
    setPendingAction(null);
  };

  const requireAuth = (action: () => void, reason?: string) => {
    if (user && token) {
      action();
    } else {
      setPendingAction(() => action);
      openAuthModal('login', reason || 'Authentication required to perform this action.');
    }
  };

  const clearError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        authError,
        isAuthModalOpen,
        authModalMode,
        authModalReason,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
        requireAuth,
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
