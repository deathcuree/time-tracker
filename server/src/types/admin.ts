export interface TimeEntriesParams {
  userId: string;
}
export interface TimeEntriesQuery {
  startDate?: string;
  endDate?: string;
}

export interface TimeReportQuery {
  startDate: string;
  endDate: string;
}

export interface UpdateUserRoleParams {
  userId: string;
}
export interface UpdateUserRoleBody {
  role: 'user' | 'admin';
}
