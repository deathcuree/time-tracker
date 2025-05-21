
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

// Define types
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // In a real app, validate the token with the server
          // For now, we'll mock this
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          if (userData && userData.id) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // Mock authentication for now
      if (email === 'user@example.com' && password === 'password') {
        const mockUser: User = {
          id: '1',
          name: 'Test User',
          email: 'user@example.com',
          role: 'user'
        };
        
        // Store the token and user data
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        setUser(mockUser);
        toast.success('Successfully logged in!');
        return;
      }
      
      if (email === 'admin@example.com' && password === 'password') {
        const mockAdmin: User = {
          id: '2',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        };
        
        localStorage.setItem('token', 'mock-jwt-token-admin');
        localStorage.setItem('user', JSON.stringify(mockAdmin));
        
        setUser(mockAdmin);
        toast.success('Successfully logged in as admin!');
        return;
      }
      
      throw new Error('Invalid email or password');
    } catch (error) {
      toast.error('Login failed: Invalid email or password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // Mock signup for now
      const mockUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role: 'user'
      };
      
      // Store the token and user data
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Signup failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Create a hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
