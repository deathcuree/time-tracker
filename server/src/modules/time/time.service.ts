import mongoose from 'mongoose';
import TimeEntry from './time.model.js';
import { ITimeEntry } from '../../types/models.js';

const PH_TZ = 'Asia/Manila';

function getPHDateString(d: Date): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(d);
}

function phMidnightUTC(d: Date): Date {
  const ymd = getPHDateString(d);
  return new Date(`${ymd}T00:00:00+08:00`);
}

export const TimeService = {
  clockIn: async (userId: string): Promise<ITimeEntry> => {
    const activeEntry = await TimeEntry.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      clockOut: null,
    });

    if (activeEntry) {
      const err: any = new Error('You already have an active time entry');
      err.status = 400;
      throw err;
    }

    const now = new Date();
    const datePHStartUTC = phMidnightUTC(now);

    const timeEntry = new TimeEntry({
      userId: new mongoose.Types.ObjectId(userId),
      date: datePHStartUTC,
      clockIn: now,
    }) as ITimeEntry;

    await timeEntry.save();
    return timeEntry;
  },

  clockOut: async (userId: string): Promise<ITimeEntry> => {
    const timeEntry = (await TimeEntry.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      clockOut: null,
    })) as ITimeEntry | null;

    if (!timeEntry) {
      const err: any = new Error('No active time entry found');
      err.status = 400;
      throw err;
    }

    timeEntry.clockOut = new Date();
    await timeEntry.save();
    return timeEntry;
  },

  getTimeEntries: async (
    userId: string,
    opts: {
      startDate?: string | string[];
      endDate?: string | string[];
      page?: number | string;
      limit?: number | string;
    },
  ) => {
    const { startDate, endDate, page, limit } = opts;
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(Array.isArray(startDate) ? startDate[0] : startDate),
        $lte: new Date(Array.isArray(endDate) ? endDate[0] : endDate),
      };
    }

    if (page) {
      const pageNum = Number(page);
      const limitNum = Number(limit ?? 10);
      const skip = (pageNum - 1) * limitNum;

      const entries = await TimeEntry.find(query)
        .sort({ date: -1, clockIn: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await TimeEntry.countDocuments(query);

      return {
        entries,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
        },
      };
    }

    const entries = await TimeEntry.find(query).sort({ date: -1, clockIn: -1 });
    return { entries };
  },

  getTimeStats: async (userId: string) => {
    const now = new Date();
    const todayPHStartUTC = phMidnightUTC(now);
    const tomorrowPHStartUTC = new Date(todayPHStartUTC.getTime() + 24 * 60 * 60 * 1000);

    const dayPH = new Date(todayPHStartUTC.getTime() + 8 * 60 * 60 * 1000).getUTCDay();
    const diffToMondayPH = (dayPH === 0 ? -6 : 1) - dayPH;
    const startOfWeekPHStartUTC = new Date(
      todayPHStartUTC.getTime() + diffToMondayPH * 24 * 60 * 60 * 1000,
    );

    const todayEntries = await TimeEntry.find({
      userId: new mongoose.Types.ObjectId(userId),
      $or: [
        { clockIn: { $gte: todayPHStartUTC, $lt: tomorrowPHStartUTC } },
        { clockOut: null },
        {
          clockIn: { $lt: todayPHStartUTC },
          clockOut: { $gte: todayPHStartUTC, $lt: tomorrowPHStartUTC },
        },
      ],
    });

    const weekEntries = await TimeEntry.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: startOfWeekPHStartUTC,
        $lt: tomorrowPHStartUTC,
      },
    });

    let totalHoursToday = 0;
    todayEntries.forEach((entry) => {
      const clockIn = new Date(entry.clockIn);
      const clockOut = entry.clockOut ? new Date(entry.clockOut) : new Date();

      const startTime = clockIn < todayPHStartUTC ? todayPHStartUTC : clockIn;
      const endTime = clockOut > tomorrowPHStartUTC ? tomorrowPHStartUTC : clockOut;

      const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      totalHoursToday += hoursWorked;
    });

    let totalHoursThisWeek = 0;
    weekEntries.forEach((entry) => {
      const clockIn = new Date(entry.clockIn).getTime();
      const clockOut = entry.clockOut ? new Date(entry.clockOut).getTime() : new Date().getTime();

      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      totalHoursThisWeek += hoursWorked;
    });

    return {
      totalHoursToday: parseFloat(totalHoursToday.toFixed(2)),
      totalHoursThisWeek: parseFloat(totalHoursThisWeek.toFixed(2)),
    };
  },

  getCurrentStatus: async (userId: string) => {
    const activeEntry = (await TimeEntry.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      clockOut: null,
    }).sort({ clockIn: -1 })) as ITimeEntry | null;

    return {
      isClockedIn: !!activeEntry,
      activeEntry,
    };
  },

  deleteTimeEntry: async (userId: string, id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Invalid entry id');
      err.status = 400;
      throw err;
    }

    const entry = (await TimeEntry.findById(id)) as ITimeEntry | null;

    if (!entry) {
      const err: any = new Error('Time entry not found');
      err.status = 404;
      throw err;
    }

    if (entry.userId.toString() !== userId.toString()) {
      const err: any = new Error('Not authorized to delete this entry');
      err.status = 403;
      throw err;
    }

    if (!entry.clockOut) {
      const err: any = new Error('Cannot delete an active time entry. Please clock out first.');
      err.status = 400;
      throw err;
    }

    await TimeEntry.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Time entry deleted successfully',
      deletedId: id,
    };
  },

  deleteTimeEntryByAdmin: async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Invalid entry id');
      err.status = 400;
      throw err;
    }

    const entry = (await TimeEntry.findById(id)) as ITimeEntry | null;

    if (!entry) {
      const err: any = new Error('Time entry not found');
      err.status = 404;
      throw err;
    }

    if (!entry.clockOut) {
      const err: any = new Error('Cannot delete an active time entry. Please clock out first.');
      err.status = 400;
      throw err;
    }

    await TimeEntry.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Time entry deleted successfully',
      deletedId: id,
    };
  },
};
