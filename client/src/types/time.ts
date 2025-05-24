import { TimeEntry } from './index';
import { PaginationData } from './common';

export interface TimeStats {
  totalHoursToday: number;
  totalHoursThisWeek: number;
}

export interface TimeFilters {
  month?: number;
  year?: number;
  status?: 'all' | 'active' | 'completed';
  page?: number;
  limit?: number;
}

export interface TimeContextType {
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