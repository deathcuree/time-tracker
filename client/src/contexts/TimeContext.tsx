import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from './AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
}

interface TimeStats {
  totalHoursToday: number;
  totalHoursThisWeek: number;
}

interface TimeFilters {
  month?: number;
  year?: number;
  status?: 'all' | 'active' | 'completed';
  page?: number;
  limit?: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface TimeContextType {
  entries: TimeEntry[];
  isLoading: boolean;
  isClockedIn: boolean;
  currentEntry: TimeEntry | null;
  pagination: PaginationData;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  totalHoursToday: number;
  totalHoursThisWeek: number;
  fetchEntries: (filters?: TimeFilters) => Promise<void>;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [timeStats, setTimeStats] = useState<TimeStats>({ totalHoursToday: 0, totalHoursThisWeek: 0 });
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Load initial data
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchEntries(),
        checkCurrentStatus()
      ]).catch(error => {
        toast.error('Failed to load time data');
      });
    } else {
      setEntries([]);
      setCurrentEntry(null);
      setIsClockedIn(false);
    }
  }, [user]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isClockedIn) {
      fetchTimeStats();
      intervalId = setInterval(fetchTimeStats, 60000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isClockedIn]);

  const fetchTimeStats = async () => {
    try {
      const response = await api.get('/time/stats');
      setTimeStats(response.data);
    } catch (error) {
      toast.error('Error fetching time stats:', error);
    }
  };

  const checkCurrentStatus = async () => {
    try {
      const response = await api.get('/time/status');
      const { isClockedIn: serverClockStatus, activeEntry } = response.data;
      
      setIsClockedIn(serverClockStatus);
      setCurrentEntry(activeEntry);
    } catch (error) {
      toast.error('Failed to check clock status');
    }
  };

  const fetchEntries = async (filters?: TimeFilters) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters?.month !== undefined) queryParams.append('month', filters.month.toString());
      if (filters?.year !== undefined) queryParams.append('year', filters.year.toString());
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      
      const response = await api.get(`/time/entries?${queryParams.toString()}`);
      
      setEntries(response.data.entries || []);
      setPagination(response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: response.data.entries?.length || 0
      });
      
      await fetchTimeStats();
    } catch (error) {
      toast.error('Error fetching time entries:', error);
      setEntries([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clockIn = async () => {
    if (!user) {
      toast.error('You must be logged in to clock in');
      return;
    }
    
    try {
      const response = await api.post('/time/clock-in');
      const newEntry = response.data;
      
      setEntries(prev => [...prev, newEntry]);
      setCurrentEntry(newEntry);
      setIsClockedIn(true);
      
      // Fetch updated stats
      await fetchTimeStats();
      
      toast.success('Successfully clocked in!');
    } catch (error) {
      toast.error('Failed to clock in');
    }
  };

  const clockOut = async () => {
    if (!user || !currentEntry) {
      toast.error('You are not clocked in');
      return;
    }
    
    try {
      const response = await api.post('/time/clock-out');
      const updatedEntry = response.data;
      
      setEntries(prev => 
        prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
      );
      setCurrentEntry(null);
      setIsClockedIn(false);
      
      // Fetch updated stats
      await fetchTimeStats();
      
      toast.success('Successfully clocked out!');
    } catch (error) {
      toast.error('Failed to clock out');
    }
  };

  return (
    <TimeContext.Provider value={{
      entries,
      isLoading,
      isClockedIn,
      currentEntry,
      clockIn,
      clockOut,
      totalHoursToday: timeStats.totalHoursToday,
      totalHoursThisWeek: timeStats.totalHoursThisWeek,
      fetchEntries,
      pagination
    }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}
