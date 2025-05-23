import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  name: string; // Virtual field
  email: string;
  password: string;
  role: 'user' | 'admin';
  position: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  totalHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPTORequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  date: Date;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  approvedBy: Types.ObjectId | null;
  approvalDate: Date | null;
  expiryYear: number;
  month: number; // Virtual field
  createdAt: Date;
  updatedAt: Date;
}

// Request types
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IPTORequestBody {
  date: string;
  hours: number;
  reason: string;
}

// Custom request type with user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
} 