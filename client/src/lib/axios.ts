import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

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
    if (error.response?.status === 401) {
      console.log('Unauthorized access, removing token and redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 