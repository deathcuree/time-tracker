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
  };
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    console.log('Calling login API with data:', { ...data, password: '[REDACTED]' });
    const response = await axiosInstance.post<AuthResponse>(`${import.meta.env.VITE_API_URL}/api/auth/login`, data);
    console.log('Login API response:', { ...response.data, token: '[REDACTED]' });
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    console.log('Fetching current user profile');
    const response = await axiosInstance.get<AuthResponse['user']>(`${import.meta.env.VITE_API_URL}/auth/profile`);
    console.log('Get current user response:', response.data);
    return response.data;
  },
}; 