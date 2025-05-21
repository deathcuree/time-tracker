import mongoose, { Schema } from 'mongoose';
import { IPTORequest } from '../types/models.js';

const ptoRequestSchema = new Schema<IPTORequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Calculate total days when saving
ptoRequestSchema.virtual('totalDays').get(function(): number {
  return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
});

// Ensure virtuals are included in JSON
ptoRequestSchema.set('toJSON', { virtuals: true });
ptoRequestSchema.set('toObject', { virtuals: true });

export default mongoose.model<IPTORequest>('PTORequest', ptoRequestSchema); 