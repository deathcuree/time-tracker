import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import axiosInstance from '@/lib/axios';
import { LoadingScreen } from '@/components/ui/loading';

export type UserRole = 'user' | 'admin';

interface BaseUserData {
  email: string;
  role: string;
  position?: string;
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
  position?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (data: { firstName: string; lastName: string }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  validateCurrentPassword: (password: string) => Promise<boolean>;
}

const normalizeUserData = (response: ApiResponse<ServerUserData | AuthResponse>): User => {
  const responseData = response.data;
  const userData: ServerUserData = 'user' in responseData 
    ? responseData.user 
    : responseData as ServerUserData;
  
  const id = 'id' in userData ? userData.id : userData._id;
  let name;
  
  if ('name' in userData && userData.name) {
    name = userData.name;
  } else if ('firstName' in userData && 'lastName' in userData) {
    name = `${userData.firstName} ${userData.lastName}`.trim();
  } else {
    name = 'Unknown User';
    toast.info('User data missing name fields');
    console.info('User data missing name fields:', userData);
  }
  
  const normalizedUser = {
    id,
    name,
    email: userData.email,
    role: (userData.role || 'user') as UserRole,
    position: (userData as any).position
  };
  
  return normalizedUser;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get<ApiResponse<ServerUserData>>('/auth/profile');
        if (!response.data.success) {
          throw new Error('Failed to fetch profile');
        }
        if (isMounted) {
          const normalizedUser = normalizeUserData(response.data);
          setUser(normalizedUser);
        }
      } catch (error) {
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      if (!response.data.success) {
        throw new Error('Login request failed');
      }
      const { user: userData } = response.data.data;
      if (!userData) {
        throw new Error('No user data received from server');
      }
      const authenticatedUser = normalizeUserData(response.data);
      setUser(authenticatedUser);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const responseErrors = error.response?.data?.errors;
      const errorMessage = responseErrors?.email || responseErrors?.password || error.response?.data?.message;
      if (errorMessage) {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {}
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Update profile function
  const updateProfile = async (data: { firstName: string; lastName: string }) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.put<ApiResponse<ServerUserData>>('/auth/profile', data);
      
      if (!response.data.success) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = normalizeUserData(response.data);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update password function
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
      const message = error.response?.data?.message || 'Failed to update password';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Validate current password
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
};
