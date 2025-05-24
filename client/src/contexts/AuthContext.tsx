import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { toast } from '@/components/ui/sonner';
import { axiosInstance } from '@/lib/axios';
import type { AuthContextType, ApiResponse, ServerUserData, AuthResponse } from '@/types/auth';
import { normalizeUserData, handleAuthError, setAuthToken } from '@/utils/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          const authHeader = setAuthToken(token);
          axiosInstance.defaults.headers.common['Authorization'] = authHeader;
          const response = await axiosInstance.get<ApiResponse<ServerUserData>>('/auth/profile');
          
          if (!response.data.success) {
            throw new Error('Failed to fetch profile');
          }
          
          setUser(normalizeUserData(response.data));
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          setAuthToken(null);
          delete axiosInstance.defaults.headers.common['Authorization'];
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      
      if (!response.data.success) {
        throw new Error('Login request failed');
      }

      const { token, user: userData } = response.data.data;
      
      if (!userData) {
        throw new Error('No user data received from server');
      }
      
      const authHeader = setAuthToken(token);
      axiosInstance.defaults.headers.common['Authorization'] = authHeader;
      
      setUser(normalizeUserData(response.data));
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error(handleAuthError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data: { firstName: string; lastName: string }) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.put<ApiResponse<ServerUserData>>('/auth/profile', data);
      
      if (!response.data.success) {
        throw new Error('Failed to update profile');
      }

      setUser(normalizeUserData(response.data));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.put<ApiResponse<{ message: string }>>('/auth/password', {
        currentPassword,
        newPassword
      });
      
      if (!response.data.success) {
        throw new Error('Failed to update password');
      }

      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const validateCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>('/auth/validate-password', {
        password
      });
      return response.data.success;
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
      updateProfile,
      updatePassword,
      validateCurrentPassword
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
