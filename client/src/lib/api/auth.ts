import { axiosInstance } from '../axios';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const authApi = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    console.log('Calling signup API with data:', { ...data, password: '[REDACTED]' });
    const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
    console.log('Signup API response:', { ...response.data, token: '[REDACTED]' });
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    console.log('Calling login API with data:', { ...data, password: '[REDACTED]' });
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    console.log('Login API response:', { ...response.data, token: '[REDACTED]' });
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    console.log('Fetching current user profile');
    const response = await axiosInstance.get<AuthResponse['user']>('/auth/profile');
    console.log('Get current user response:', response.data);
    return response.data;
  },
}; 