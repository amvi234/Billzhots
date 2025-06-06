'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { history, localStorageManager } from '@/app/lib/utils';
import { set } from 'lodash';

type AuthContextType = {
  isAuthenticated: boolean;
  logout: () => void;
  login: () => void;
  getAccessToken: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const logout = () => {
    localStorageManager.removeToken();
    localStorageManager.removeRefreshToken();
    history?.push('/login');
    router.push('/login');
  };

  const login = () => {
    setIsAuthenticated(true);
  }

  const getAccessToken = () => {
    return localStorageManager.getToken();
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      logout,
      login,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
