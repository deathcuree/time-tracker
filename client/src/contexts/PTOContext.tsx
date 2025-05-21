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
  startDate: string;
  endDate: string;
  reason: string;
  status: PTOStatus;
  approvedBy: string | null;
  approvalDate: string | null;
  totalDays: number;
  createdAt: string;
  updatedAt: string;
}

interface PTOContextType {
  requests: PTORequest[];
  isLoading: boolean;
  createRequest: (startDate: Date, endDate: Date, reason: string) => Promise<void>;
  updateRequestStatus: (requestId: string, status: PTOStatus) => Promise<void>;
  fetchRequests: (page?: number) => Promise<void>;
  userPTOsThisMonth: number;
  userPTOLimit: number;
  canRequestPTO: boolean;
}

// Create the context
const PTOContext = createContext<PTOContextType | undefined>(undefined);

const API_URL = '/pto'; // Updated to use relative path since baseURL includes /api

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
      
      const startDate = new Date(req.startDate);
      const month = startDate.getMonth();
      const year = startDate.getFullYear();

      // Count requests for current month and future months
      if (year > currentYear) {
        return false; // Don't count future years in current month's count
      }
      
      if (year === currentYear && month === currentMonth) {
        return true; // Count current month
      }
      
      return false;
    });
    
    setUserPTOsThisMonth(userRequestsThisMonth.length);
    // Remove client-side validation - we'll rely on server validation
    setCanRequestPTO(true);
  };

  const fetchRequests = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const endpoint = user?.role === 'admin' ? `${API_URL}/all` : `${API_URL}/user`;
      const response = await axiosInstance.get(endpoint);
      const fetchedRequests = Array.isArray(response.data) ? response.data : [];
      
      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Failed to load PTO requests:', error);
      toast.error('Failed to load PTO requests');
      setRequests([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async (startDate: Date, endDate: Date, reason: string) => {
    if (!user) {
      toast.error('You must be logged in to request PTO');
      return;
    }
    
    try {
      const response = await axiosInstance.post(`${API_URL}/request`, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason
      });
      
      // Refresh the requests list
      await fetchRequests();
      toast.success('PTO request submitted successfully');
    } catch (error: any) {
      console.error('Error creating PTO request:', error);
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
      console.error('Error updating PTO request:', error);
      toast.error('Failed to update request status');
    }
  };

  return (
    <PTOContext.Provider value={{
      requests,
      isLoading,
      createRequest,
      updateRequestStatus,
      fetchRequests,
      userPTOsThisMonth,
      userPTOLimit: 2,
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
