export type PTOStatus = 'pending' | 'approved' | 'rejected';

export interface PTORequest {
  _id: string;
  id?: string;
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

export interface PTOContextType {
  requests: PTORequest[];
  isLoading: boolean;
  createRequest: (date: Date, hours: number, reason: string) => Promise<void>;
  updateRequestStatus: (requestId: string, status: PTOStatus) => Promise<void>;
  fetchRequests: (searchQuery?: string) => Promise<void>;
  fetchRequestsForMonth: (month: number, year: number) => Promise<number>;
  fetchYearlyPTOHours: (year: number) => Promise<{ 
    totalHoursUsed: number; 
    yearlyLimit: number; 
    remainingHours: number; 
  }>;
  userPTOsThisMonth: number;
  userPTOLimit: number;
  canRequestPTO: boolean;
} 