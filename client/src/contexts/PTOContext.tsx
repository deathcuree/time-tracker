import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from './AuthContext';
import axiosInstance from '@/lib/axios';

export type PTOStatus = 'pending' | 'approved' | 'denied';

export interface PTORequest {
  _id: string;
  id?: string; // MongoDB also sends this
  userId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  userName: string;
  userEmail: string;
  date: string;
  hours: number;
  reason: string;
  status: PTOStatus;
  approvedBy: string | null;
  approvalDate: string | null;
  expiryYear: number;
  createdAt: string;
  updatedAt: string;
}

interface PTOContextType {
  requests: PTORequest[];
  isLoading: boolean;
  createRequest: (date: Date, hours: number, reason: string) => Promise<void>;
  updateRequestStatus: (requestId: string, status: PTOStatus) => Promise<void>;
  fetchRequests: (searchQuery?: string) => Promise<void>;
  fetchRequestsForMonth: (month: number, year: number) => Promise<number>;
  fetchYearlyPTOHours: (year: number) => Promise<{ totalHoursUsed: number; yearlyLimit: number; remainingHours: number; }>;
  userPTOsThisMonth: number;
  userPTOLimit: number;
  canRequestPTO: boolean;
}

// Create the context
const PTOContext = createContext<PTOContextType | undefined>(undefined);

const API_URL = '/pto';

// Create a provider component
export function PTOProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PTORequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPTOsThisMonth, setUserPTOsThisMonth] = useState(0);
  const [canRequestPTO, setCanRequestPTO] = useState(true);

  // Load requests from storage when user changes
  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setRequests([]);
    }
  }, [user]);

  // Count user PTOs this month for display purposes only
  useEffect(() => {
    if (user && requests.length > 0) {
      countUserPTOs();
    } else {
      setUserPTOsThisMonth(0);
      setCanRequestPTO(true);
    }
  }, [requests, user]);

  const countUserPTOs = () => {
    if (!user || !Array.isArray(requests)) {
      setUserPTOsThisMonth(0);
      setCanRequestPTO(true);
      return;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const userRequestsThisMonth = requests.filter(req => {
      if (!req || !req.userId) return false;
      
      // Handle both string and object userId
      const requestUserId = typeof req.userId === 'string' ? req.userId : req.userId._id;
      if (requestUserId !== user.id) return false;
      
      // Only count approved requests
      if (req.status !== 'approved') return false;
      
      const requestDate = new Date(req.date);
      const month = requestDate.getMonth();
      const year = requestDate.getFullYear();

      return year === currentYear && month === currentMonth;
    });
    
    const hoursUsedThisMonth = userRequestsThisMonth.reduce((total, req) => total + req.hours, 0);
    setUserPTOsThisMonth(hoursUsedThisMonth);
    setCanRequestPTO(hoursUsedThisMonth < 16); // 16 hours per month limit
  };

  const fetchRequests = async (searchQuery?: string) => {
    setIsLoading(true);
    try {
      const endpoint = user?.role === 'admin' ? `${API_URL}/all` : `${API_URL}/user`;
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axiosInstance.get(`${endpoint}?${params.toString()}`);
      const fetchedRequests = Array.isArray(response.data) ? response.data : [];
      
      setRequests(fetchedRequests);
    } catch (error) {
      toast.error('Failed to load PTO requests');
      setRequests([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async (date: Date, hours: number, reason: string) => {
    if (!user) {
      toast.error('You must be logged in to request PTO');
      return;
    }
    
    try {
      const response = await axiosInstance.post(`${API_URL}/request`, {
        date: date.toISOString().split('T')[0],
        hours,
        reason
      });
      
      // Refresh the requests list
      await fetchRequests();
      toast.success('PTO request submitted successfully');
    } catch (error: any) {
      // Display the server's validation error message
      toast.error(error.response?.data?.message || 'Failed to submit PTO request');
      throw error;
    }
  };

  const updateRequestStatus = async (requestId: string, status: PTOStatus) => {
    if (!user || user.role !== 'admin') {
      toast.error('Only admins can update request status');
      return;
    }
    
    try {
      await axiosInstance.patch(`${API_URL}/request/${requestId}`, { status });
      
      // Refresh the requests list
      await fetchRequests();
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      toast.error('Failed to update request status');
    }
  };

  const fetchRequestsForMonth = async (month: number, year: number): Promise<number> => {
    if (!user) return 0;
    
    try {
      const response = await axiosInstance.get(`${API_URL}/user/month/${year}/${month + 1}`);
      return response.data.count || 0;
    } catch (error) {
      toast.error('Failed to load PTO requests for the selected month');
      return 0;
    }
  };

  const fetchYearlyPTOHours = async (year: number) => {
    if (!user) return { totalHoursUsed: 0, yearlyLimit: 192, remainingHours: 192 };
    
    try {
      const response = await axiosInstance.get(`${API_URL}/user/year/${year}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to load yearly PTO information');
      return { totalHoursUsed: 0, yearlyLimit: 192, remainingHours: 192 };
    }
  };

  return (
    <PTOContext.Provider value={{
      requests,
      isLoading,
      createRequest,
      updateRequestStatus,
      fetchRequests,
      fetchRequestsForMonth,
      fetchYearlyPTOHours,
      userPTOsThisMonth,
      userPTOLimit: 16, // 16 hours per month
      canRequestPTO
    }}>
      {children}
    </PTOContext.Provider>
  );
}

// Create a hook for using the PTO context
export function usePTO() {
  const context = useContext(PTOContext);
  if (context === undefined) {
    throw new Error('usePTO must be used within a PTOProvider');
  }
  return context;
}
