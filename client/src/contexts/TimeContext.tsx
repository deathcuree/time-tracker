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

interface TimeContextType {
  entries: TimeEntry[];
  isLoading: boolean;
  isClockedIn: boolean;
  currentEntry: TimeEntry | null;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  totalHoursToday: number;
  totalHoursThisWeek: number;
  fetchEntries: () => Promise<void>;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [timeStats, setTimeStats] = useState<TimeStats>({ totalHoursToday: 0, totalHoursThisWeek: 0 });

  // Load initial data
  useEffect(() => {
    console.log('TimeProvider mounted, user status:', { isLoggedIn: !!user });
    
    if (user) {
      console.log('Fetching initial data...');
      Promise.all([
        fetchEntries(),
        checkCurrentStatus()
      ]).catch(error => {
        console.error('Error initializing time context:', error);
        toast.error('Failed to load time data');
      });
    } else {
      setEntries([]);
      setCurrentEntry(null);
      setIsClockedIn(false);
    }
  }, [user]);

  // Update stats periodically when clocked in
  useEffect(() => {
    console.log('Clock status changed:', { isClockedIn });
    
    let intervalId: NodeJS.Timeout;
    
    if (isClockedIn) {
      console.log('Setting up interval for stats updates');
      // Update stats immediately and then every minute
      fetchTimeStats();
      intervalId = setInterval(fetchTimeStats, 60000);
    }

    return () => {
      if (intervalId) {
        console.log('Clearing stats update interval');
        clearInterval(intervalId);
      }
    };
  }, [isClockedIn]);

  const fetchTimeStats = async () => {
    try {
      console.log('Fetching time stats from server...');
      const response = await api.get('/time/stats');
      console.log('Time stats received:', response.data);
      setTimeStats(response.data);
    } catch (error) {
      console.error('Error fetching time stats:', error);
    }
  };

  const checkCurrentStatus = async () => {
    try {
      const response = await api.get('/time/status');
      const { isClockedIn: serverClockStatus, activeEntry } = response.data;
      
      setIsClockedIn(serverClockStatus);
      setCurrentEntry(activeEntry);
    } catch (error) {
      console.error('Error checking clock status:', error);
      toast.error('Failed to check clock status');
    }
  };

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching time entries...');
      setIsLoading(true);
      
      const response = await api.get('/time/entries');
      console.log('Entries fetched:', {
        count: response.data.entries?.length || 0
      });
      
      setEntries(response.data.entries || []);
      
      // Also update stats when fetching entries
      await fetchTimeStats();
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to load time entries');
      setEntries([]);
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
      console.log('Attempting to clock in...');
      const response = await api.post('/time/clock-in');
      const newEntry = response.data;
      
      console.log('Clock in successful:', {
        entry: newEntry
      });
      
      setEntries(prev => [...prev, newEntry]);
      setCurrentEntry(newEntry);
      setIsClockedIn(true);
      
      // Fetch updated stats
      await fetchTimeStats();
      
      toast.success('Successfully clocked in!');
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Failed to clock in');
    }
  };

  const clockOut = async () => {
    if (!user || !currentEntry) {
      toast.error('You are not clocked in');
      return;
    }
    
    try {
      console.log('Attempting to clock out...');
      const response = await api.post('/time/clock-out');
      const updatedEntry = response.data;
      
      console.log('Clock out successful:', {
        updatedEntry
      });
      
      setEntries(prev => 
        prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
      );
      setCurrentEntry(null);
      setIsClockedIn(false);
      
      // Fetch updated stats
      await fetchTimeStats();
      
      toast.success('Successfully clocked out!');
    } catch (error) {
      console.error('Error clocking out:', error);
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
      fetchEntries
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
