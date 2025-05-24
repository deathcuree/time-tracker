export interface TimeEntry {
  clockIn: string;
  clockOut?: string;
  id: string;
  userId: string;
}

export * from './auth';
export * from './common';
export * from './time';
export * from './pto'; 