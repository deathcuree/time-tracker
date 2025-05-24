import { ApiResponse, ServerUserData, User, AuthResponse } from '@/types/auth';

export const normalizeUserData = (response: ApiResponse<ServerUserData | AuthResponse>): User => {
  // Handle nested data structure
  const responseData = response.data;
  const userData: ServerUserData = 'user' in responseData 
    ? responseData.user 
    : responseData as ServerUserData;
  
  const id = 'id' in userData ? userData.id : userData._id;
  let name: string;
  
  if ('name' in userData && userData.name) {
    name = userData.name;
  } else if ('firstName' in userData && 'lastName' in userData) {
    name = `${userData.firstName} ${userData.lastName}`.trim();
  } else {
    name = 'Unknown User';
  }
  
  return {
    id,
    name,
    email: userData.email,
    role: (userData.role || 'user') as User['role']
  };
};

export const handleAuthError = (error: any): string => {
  const responseErrors = error.response?.data?.errors;
  return responseErrors?.email || 
         responseErrors?.password || 
         error.response?.data?.message ||
         'An error occurred during authentication';
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    return `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    return null;
  }
}; 