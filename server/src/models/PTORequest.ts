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
  date: {
    type: Date,
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: 1,
    max: 8
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
  },
  expiryYear: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

ptoRequestSchema.virtual('month').get(function(): number {
  return this.date.getMonth();
});

ptoRequestSchema.set('toJSON', { virtuals: true });
ptoRequestSchema.set('toObject', { virtuals: true });

ptoRequestSchema.index({ userId: 1, date: -1 });
ptoRequestSchema.index({ status: 1 });

export default mongoose.model<IPTORequest>('PTORequest', ptoRequestSchema);