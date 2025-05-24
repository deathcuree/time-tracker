export type UserRole = 'user' | 'admin';

// Base user data interface
export interface BaseUserData {
  email: string;
  role: string;
}

// Legacy user data structure
export interface LegacyUserData extends BaseUserData {
  _id: string;
  firstName: string;
  lastName: string;
}

// Modern user data structure
export interface ModernUserData extends BaseUserData {
  id: string;
  name: string;
}

// Server response user data type
export type ServerUserData = LegacyUserData | ModernUserData;

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Auth response from server
export interface AuthResponse {
  token: string;
  user: ServerUserData;
}

// Normalized user type used in the application
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Auth context interface
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (data: { firstName: string; lastName: string }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  validateCurrentPassword: (password: string) => Promise<boolean>;
} 