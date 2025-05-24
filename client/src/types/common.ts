export type UserRole = 'admin' | 'manager' | 'employee';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
} 