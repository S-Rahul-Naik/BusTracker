import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/api';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('bustrack_user');
    const savedToken = localStorage.getItem('bustrack_token');
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('bustrack_user');
        localStorage.removeItem('bustrack_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.user && response.access_token) {
        const userData: User = {
          id: response.user.email, // Using email as ID for now
          email: response.user.email,
          name: response.user.name,
          role: (response.user.role === 'admin' || response.user.role === 'administrator') ? 'admin' : 'user',
          permissions: (response.user.role === 'admin' || response.user.role === 'administrator')
            ? ['manage_routes', 'manage_buses', 'manage_schedules', 'view_analytics', 'manage_users']
            : ['view_routes', 'track_buses', 'set_notifications']
        };
        
        setUser(userData);
        localStorage.setItem('bustrack_user', JSON.stringify(userData));
        localStorage.setItem('bustrack_token', response.access_token);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, phone: string, role?: UserRole): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await apiClient.register({
        name,
        email,
        password,
        phone
      });
      
      if (response.user && response.access_token) {
        const userData: User = {
          id: response.user.email,
          email: response.user.email,
          name: response.user.name,
          role: (response.user.role === 'admin' || response.user.role === 'administrator') ? 'admin' : 'user',
          permissions: (response.user.role === 'admin' || response.user.role === 'administrator')
            ? ['manage_routes', 'manage_buses', 'manage_schedules', 'view_analytics', 'manage_users']
            : ['view_routes', 'track_buses', 'set_notifications']
        };
        
        setUser(userData);
        localStorage.setItem('bustrack_user', JSON.stringify(userData));
        localStorage.setItem('bustrack_token', response.access_token);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bustrack_user');
    localStorage.removeItem('bustrack_token');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking permissions
export function usePermission(permission: string) {
  const { user } = useAuth();
  return user?.permissions?.includes(permission) || false;
}