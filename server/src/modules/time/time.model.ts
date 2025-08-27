import mongoose, { Schema } from 'mongoose';
import { ITimeEntry } from '../../types/models.js';

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    clockIn: {
      type: Date,
      required: true,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

timeEntrySchema.pre('save', function (next) {
  if (this.clockOut) {
    this.totalHours = (this.clockOut.getTime() - this.clockIn.getTime()) / (1000 * 60 * 60);
  }
  next();
});

export default mongoose.model<ITimeEntry>('TimeEntry', timeEntrySchema);
