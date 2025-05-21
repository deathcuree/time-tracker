
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from './AuthContext';

export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // ISO string
  clockIn: string; // ISO string
  clockOut: string | null; // ISO string or null if not clocked out
}

interface TimeContextType {
  entries: TimeEntry[];
  isLoading: boolean;
  isClockedIn: boolean;
  currentEntry: TimeEntry | null;
  clockIn: () => void;
  clockOut: () => void;
  totalHoursToday: number;
  totalHoursThisWeek: number;
  fetchEntries: (page?: number) => void;
}

// Create the context
const TimeContext = createContext<TimeContextType | undefined>(undefined);

// Mock storage
const STORAGE_KEY = 'time_entries';

// Helper functions
const getISODate = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

// Create a provider component
export function TimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [totalHoursToday, setTotalHoursToday] = useState(0);
  const [totalHoursThisWeek, setTotalHoursThisWeek] = useState(0);

  // Load entries from storage
  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setEntries([]);
      setCurrentEntry(null);
      setIsClockedIn(false);
    }
  }, [user]);

  // Calculate hours when entries change
  useEffect(() => {
    if (entries.length > 0) {
      calculateHours();
    }
  }, [entries]);

  const fetchEntries = (page: number = 1) => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // Mock data for now
      const storedEntries = localStorage.getItem(STORAGE_KEY);
      let allEntries: TimeEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
      
      if (user) {
        // Filter entries for current user
        const userEntries = allEntries.filter(entry => entry.userId === user.id);
        setEntries(userEntries);
        
        // Check if user is currently clocked in
        const today = getISODate();
        const todayEntry = userEntries.find(
          entry => entry.date === today && entry.clockOut === null
        );
        
        if (todayEntry) {
          setCurrentEntry(todayEntry);
          setIsClockedIn(true);
        } else {
          setCurrentEntry(null);
          setIsClockedIn(false);
        }
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHours = () => {
    if (!user) return;
    
    let todayHours = 0;
    let weekHours = 0;
    
    const today = getISODate();
    const currentDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const firstDayOfWeek = new Date();
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Adjust to Monday
    const weekStart = getISODate(firstDayOfWeek);
    
    entries.forEach(entry => {
      if (!entry.clockOut) return;
      
      const clockInTime = new Date(entry.clockIn).getTime();
      const clockOutTime = new Date(entry.clockOut).getTime();
      const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      
      if (entry.date === today) {
        todayHours += hoursWorked;
      }
      
      if (entry.date >= weekStart) {
        weekHours += hoursWorked;
      }
    });
    
    setTotalHoursToday(parseFloat(todayHours.toFixed(2)));
    setTotalHoursThisWeek(parseFloat(weekHours.toFixed(2)));
  };

  const clockIn = () => {
    if (!user) {
      toast.error('You must be logged in to clock in');
      return;
    }
    
    try {
      const now = new Date();
      const today = getISODate();
      
      // Check if already clocked in today
      const todayEntry = entries.find(
        entry => entry.date === today && entry.userId === user.id
      );
      
      if (todayEntry) {
        toast.error('You have already clocked in today');
        return;
      }
      
      // Create new entry
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        userId: user.id,
        date: today,
        clockIn: now.toISOString(),
        clockOut: null
      };
      
      // Update state and storage
      const updatedEntries = [...entries, newEntry];
      setEntries(updatedEntries);
      setCurrentEntry(newEntry);
      setIsClockedIn(true);
      
      // Save to localStorage (in a real app, this would be an API call)
      const storedEntries = localStorage.getItem(STORAGE_KEY);
      const allEntries = storedEntries ? JSON.parse(storedEntries) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...allEntries, newEntry]));
      
      toast.success('Successfully clocked in!');
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Failed to clock in');
    }
  };

  const clockOut = () => {
    if (!user || !currentEntry) {
      toast.error('You are not clocked in');
      return;
    }
    
    try {
      const now = new Date();
      
      // Update the current entry
      const updatedEntry = {
        ...currentEntry,
        clockOut: now.toISOString()
      };
      
      // Update state
      const updatedEntries = entries.map(entry => 
        entry.id === currentEntry.id ? updatedEntry : entry
      );
      
      setEntries(updatedEntries);
      setCurrentEntry(null);
      setIsClockedIn(false);
      
      // Save to localStorage (in a real app, this would be an API call)
      const storedEntries = localStorage.getItem(STORAGE_KEY);
      const allEntries = storedEntries ? JSON.parse(storedEntries) : [];
      const updatedAllEntries = allEntries.map((entry: TimeEntry) => 
        entry.id === currentEntry.id ? updatedEntry : entry
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllEntries));
      
      toast.success('Successfully clocked out!');
      
      // Recalculate hours
      calculateHours();
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
      totalHoursToday,
      totalHoursThisWeek,
      fetchEntries
    }}>
      {children}
    </TimeContext.Provider>
  );
}

// Create a hook for using the time context
export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}
