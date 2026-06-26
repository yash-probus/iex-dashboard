import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AUTH_TOKEN_KEY } from '../constants/auth';
import { authEventEmitter } from '../utils/events';
import { AdminUser } from '../api/auth.api';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  admin: AdminUser | null;
  authLoading: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  // Deliverable A1: Bootstrapping & Restore Session
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedAdmin = localStorage.getItem('iex_admin_user');
    
    if (storedToken && storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setToken(storedToken);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
        setIsAdmin(true);
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('iex_admin_user');
      }
    }
    
    setAuthLoading(false);
  }, []);

  // Global logout listener from Axios 401 interceptor
  useEffect(() => {
    const handleLogout = () => logout();
    authEventEmitter.addEventListener('logout', handleLogout);
    return () => authEventEmitter.removeEventListener('logout', handleLogout);
  }, []);

  const login = (newToken: string, newAdmin: AdminUser) => {
    setToken(newToken);
    setAdmin(newAdmin);
    setIsAuthenticated(true);
    setIsAdmin(true);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem('iex_admin_user', JSON.stringify(newAdmin));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('iex_admin_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, token, admin, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
