import axios from 'axios';

const baseURL = '/api';

console.log('Creating axios instance with baseURL:', baseURL);

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found in localStorage, adding to headers');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No token found in localStorage');
    }
    console.log('Request headers:', config.headers);
    console.log('Request data:', config.data);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Only logout on specific auth errors
    if (error.response?.status === 401 && 
        (error.response?.data?.message === 'Invalid token' || 
         error.response?.data?.message === 'Authentication required' ||
         error.response?.data?.message === 'User not found')) {
      console.log('Authentication error, logging out');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 