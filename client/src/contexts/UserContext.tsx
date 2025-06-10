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
    // For demo purposes, accept any credentials
    const newUser = {
      id: 'platform_user_' + username + '_' + Date.now(),
      username,
      email: `${username}@company.com`,
      role: username === 'admin' ? 'administrator' : 'user',
      createdAt: new Date().toISOString()
    };
    
    setUser(newUser);
    localStorage.setItem('platform_user', JSON.stringify(newUser));
    
    // Identify user in Amplitude
    identifyUser(newUser.id, {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      platform: 'CDP',
      login_method: 'username_password'
    });
    
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('platform_user');
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