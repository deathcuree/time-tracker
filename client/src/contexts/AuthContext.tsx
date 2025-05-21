import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import axios from 'axios';

// Define types
export type UserRole = 'user' | 'admin';

// Define possible server response types
interface BaseUserData {
  email: string;
  role: string;
}

interface LegacyUserData extends BaseUserData {
  _id: string;
  firstName: string;
  lastName: string;
}

interface ModernUserData extends BaseUserData {
  id: string;
  name: string;
}

type ServerUserData = LegacyUserData | ModernUserData;

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface AuthResponse {
  token: string;
  user: ServerUserData;
}

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

// Helper function to normalize user data
const normalizeUserData = (response: ApiResponse<ServerUserData | AuthResponse>): User => {
  console.log('Normalizing user data:', response);
  
  // Handle nested data structure
  const responseData = response.data;
  const userData: ServerUserData = 'user' in responseData 
    ? responseData.user 
    : responseData as ServerUserData;
  
  console.log('Raw user data:', userData);
  
  const id = 'id' in userData ? userData.id : userData._id;
  let name;
  
  if ('name' in userData && userData.name) {
    name = userData.name;
    console.log('Using modern name field:', name);
  } else if ('firstName' in userData && 'lastName' in userData) {
    name = `${userData.firstName} ${userData.lastName}`.trim();
    console.log('Using legacy name fields:', name);
  } else {
    name = 'Unknown User';
    console.warn('User data missing name fields:', userData);
  }
  
  const normalizedUser = {
    id,
    name,
    email: userData.email,
    role: (userData.role || 'user') as UserRole
  };
  
  console.log('Normalized user data:', normalizedUser);
  return normalizedUser;
};

// API configuration
const API_URL = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
          console.log('Found token, checking profile...');
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get<ApiResponse<ServerUserData>>('/auth/profile');
          console.log('Profile response:', response.data);
          
          if (!response.data.success) {
            throw new Error('Failed to fetch profile');
          }
          
          const normalizedUser = normalizeUserData(response.data);
          console.log('Setting user state:', normalizedUser);
          setUser(normalizedUser);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
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
      console.log('Making login request...');
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        throw new Error('Login request failed');
      }

      const { token, user: userData } = response.data.data;
      
      if (!userData) {
        throw new Error('No user data received from server');
      }
      
      // Store the token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user data
      const authenticatedUser = normalizeUserData(response.data);
      setUser(authenticatedUser);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      // Get the specific error message from the response if available
      const responseErrors = error.response?.data?.errors;
      const errorMessage = responseErrors?.email || responseErrors?.password || error.response?.data?.message;
      
      if (errorMessage) {
        toast.error(errorMessage);
      }
      
      throw error; // Re-throw the error but without logging
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Split name into first and last name
      const [firstName, ...lastNameParts] = name.trim().split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
        email,
        password,
        firstName,
        lastName
      });
      
      if (!response.data.success) {
        throw new Error('Registration failed');
      }

      const { token, user: userData } = response.data.data;
      
      // Store the token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user data
      const newUser = normalizeUserData(response.data);
      
      setUser(newUser);
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Signup failed';
      toast.error(`Signup failed: ${message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
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

// Hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
