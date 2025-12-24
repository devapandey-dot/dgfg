import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import { User } from '@/types/api.types';

const tokenStorage = {
  getAccessToken: () => authService.getAccessToken(),
  setAccessToken: (token: string) => authService.setAccessToken(token),
  setRefreshToken: (token: string) => authService.setRefreshToken(token),
  setUser: (user: any) => authService.setUser(user),
  getUser: () => authService.getUser(),
  clearTokens: () => authService.clearTokens(),
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => void;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = () => {
    const token = tokenStorage.getAccessToken();
    const storedUser = tokenStorage.getUser();
    
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (data: { user: User; token: string; refreshToken: string }) => {
    tokenStorage.setAccessToken(data.token);
    tokenStorage.setRefreshToken(data.refreshToken);
    tokenStorage.setUser(data.user);
    setUser(data.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
