import { UserRole } from './common';

export interface LoginData {
  email: string;
  password: string;
}

export interface BaseUserData {
  email: string;
  role: string;
}

export interface LegacyUserData extends BaseUserData {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface ModernUserData extends BaseUserData {
  id: string;
  name: string;
}

export type ServerUserData = LegacyUserData | ModernUserData;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: ServerUserData;
}

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