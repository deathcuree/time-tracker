import { axiosInstance } from '../axios';

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
    position?: string;
  };
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const response = await axiosInstance.get<AuthResponse['user']>('/auth/profile');
    return response.data;
  },
}; 