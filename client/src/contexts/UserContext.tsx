import React, { createContext, useContext, useState, useEffect } from 'react';
import { setUserContext, clearUserContext } from '@/lib/amplitude';

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
        
        // Set user context in Amplitude
        setUserContext(parsedUser.id, {
          email: parsedUser.email,
          name: parsedUser.username,
          userType: parsedUser.role
        });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('platform_user');
      }
    }
    // No automatic login - user starts unauthenticated
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
        
        // Set user context in Amplitude
        setUserContext(userData.id, {
          email: userData.email,
          name: userData.username,
          userType: userData.role
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
    localStorage.removeItem('saved_email');
    localStorage.removeItem('saved_password');
    
    // Clear user context in Amplitude
    clearUserContext();
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