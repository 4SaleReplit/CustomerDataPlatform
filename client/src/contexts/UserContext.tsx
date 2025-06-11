import React, { createContext, useContext, useState, useEffect } from 'react';
import { identifyUser, setUserProperties } from '@/lib/amplitude';

interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Initialize user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('platform_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Identify user in Amplitude
        identifyUser(parsedUser.id, {
          username: parsedUser.username,
          email: parsedUser.email,
          role: parsedUser.role,
          platform: 'CDP'
        });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('platform_user');
      }
    } else {
      // For demo purposes, create a default platform user
      const defaultUser = {
        id: 'platform_user_' + Date.now(),
        username: 'admin',
        email: 'admin@company.com',
        role: 'administrator',
        createdAt: new Date().toISOString()
      };
      
      setUser(defaultUser);
      localStorage.setItem('platform_user', JSON.stringify(defaultUser));
      
      // Identify user in Amplitude
      identifyUser(defaultUser.id, {
        username: defaultUser.username,
        email: defaultUser.email,
        role: defaultUser.role,
        platform: 'CDP'
      });
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('platform_user', JSON.stringify(userData));
        
        // Identify user in Amplitude
        identifyUser(userData.id, {
          username: userData.username,
          email: userData.email,
          role: userData.role,
          platform: 'CDP',
          login_method: 'username_password'
        });
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('platform_user');
    // Force redirect to login page
    window.location.href = '/login';
  };

  const isAuthenticated = user !== null;

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </UserContext.Provider>
  );
};