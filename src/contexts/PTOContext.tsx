
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from './AuthContext';

export type PTOStatus = 'pending' | 'approved' | 'denied';

export interface PTORequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  reason: string;
  status: PTOStatus;
  createdAt: string; // ISO date string
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

// Mock storage
const STORAGE_KEY = 'pto_requests';
const PTO_LIMIT_PER_MONTH = 2;

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

  // Count user PTOs this month
  useEffect(() => {
    if (user && requests.length > 0) {
      countUserPTOs();
    } else {
      setUserPTOsThisMonth(0);
      setCanRequestPTO(true);
    }
  }, [requests, user]);

  const countUserPTOs = () => {
    if (!user) return;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const userRequestsThisMonth = requests.filter(req => {
      if (req.userId !== user.id) return false;
      
      const createdDate = new Date(req.createdAt);
      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      );
    });
    
    setUserPTOsThisMonth(userRequestsThisMonth.length);
    setCanRequestPTO(userRequestsThisMonth.length < PTO_LIMIT_PER_MONTH);
  };

  const fetchRequests = async (page: number = 1) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // Mock data for now
      const storedRequests = localStorage.getItem(STORAGE_KEY);
      let allRequests: PTORequest[] = storedRequests ? JSON.parse(storedRequests) : [];
      
      if (user) {
        if (user.role === 'admin') {
          // Admin sees all requests
          setRequests(allRequests);
        } else {
          // Users see only their own requests
          setRequests(allRequests.filter(req => req.userId === user.id));
        }
      }
    } catch (error) {
      console.error('Error fetching PTO requests:', error);
      toast.error('Failed to load PTO requests');
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async (startDate: Date, endDate: Date, reason: string) => {
    if (!user) {
      toast.error('You must be logged in to request PTO');
      return;
    }
    
    if (!canRequestPTO) {
      toast.error(`You've already used your ${PTO_LIMIT_PER_MONTH} PTO requests this month`);
      return;
    }
    
    // Check if dates are in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time part
    
    if (startDate < now) {
      toast.error('Start date must be in the future');
      return;
    }
    
    if (endDate < startDate) {
      toast.error('End date must be after start date');
      return;
    }
    
    try {
      // Create new request
      const newRequest: PTORequest = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Update state
      const updatedRequests = [...requests, newRequest];
      setRequests(updatedRequests);
      
      // Save to localStorage (in a real app, this would be an API call)
      const storedRequests = localStorage.getItem(STORAGE_KEY);
      const allRequests = storedRequests ? JSON.parse(storedRequests) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...allRequests, newRequest]));
      
      toast.success('PTO request submitted successfully');
    } catch (error) {
      console.error('Error creating PTO request:', error);
      toast.error('Failed to submit PTO request');
    }
  };

  const updateRequestStatus = async (requestId: string, status: PTOStatus) => {
    if (!user || user.role !== 'admin') {
      toast.error('Only admins can update request status');
      return;
    }
    
    try {
      // Update the request
      const updatedRequests = requests.map(req => 
        req.id === requestId ? { ...req, status } : req
      );
      
      setRequests(updatedRequests);
      
      // Save to localStorage (in a real app, this would be an API call)
      const storedRequests = localStorage.getItem(STORAGE_KEY);
      const allRequests: PTORequest[] = storedRequests ? JSON.parse(storedRequests) : [];
      const updatedAllRequests = allRequests.map(req => 
        req.id === requestId ? { ...req, status } : req
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllRequests));
      
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
      userPTOLimit: PTO_LIMIT_PER_MONTH,
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
