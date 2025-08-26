import mongoose from 'mongoose';
import { ITimeEntry, IUser } from './models.js';

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

export interface TimeReportEntry {
  _id: mongoose.Types.ObjectId;
  totalHours: number;
  entries: ITimeEntry[];
  user: IUser;
}

export interface UpdateUserRoleParams {
  userId: string;
}

export interface UpdateUserRoleBody {
  role: 'user' | 'admin';
}
