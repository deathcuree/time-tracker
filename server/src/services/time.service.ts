import TimeEntry from '../models/TimeEntry.js';
import { ITimeEntry } from '../types/models.js';
import { Types } from 'mongoose';

export async function clockInForUser(userId: string): Promise<ITimeEntry> {
  const activeEntry = await TimeEntry.findOne({
    userId: new Types.ObjectId(userId),
    clockOut: null,
  });

  if (activeEntry) {
    throw new Error('You already have an active time entry');
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const timeEntry = new TimeEntry({
    userId: new Types.ObjectId(userId),
    date: today,
    clockIn: now,
  }) as ITimeEntry;

  await timeEntry.save();
  return timeEntry;
}

export async function clockOutForUser(userId: string): Promise<ITimeEntry> {
  const timeEntry = (await TimeEntry.findOne({
    userId: new Types.ObjectId(userId),
    clockOut: null,
  })) as ITimeEntry | null;

  if (!timeEntry) {
    throw new Error('No active time entry found');
  }

  timeEntry.clockOut = new Date();
  await timeEntry.save();

  return timeEntry;
}

export async function getEntriesForUser(userId: string, options: { startDate?: string; endDate?: string; page?: number; limit?: number } = {}) {
  const { startDate, endDate, page, limit } = options;
  const query: any = { userId: new Types.ObjectId(userId) };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (page) {
    const skip = (Number(page) - 1) * Number(limit ?? 10);
    const entries = await TimeEntry.find(query).sort({ date: -1, clockIn: -1 }).skip(skip).limit(Number(limit ?? 10));
    const total = await TimeEntry.countDocuments(query);
    return {
      entries,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit ?? 10)),
      },
    };
  } else {
    const entries = await TimeEntry.find(query).sort({ date: -1, clockIn: -1 });
    return { entries };
  }
}

export async function getStatsForUser(userId: string): Promise<{ totalHoursToday: number; totalHoursThisWeek: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

  const todayEntries = await TimeEntry.find({
    userId: new Types.ObjectId(userId),
    $or: [
      { clockIn: { $gte: today, $lt: tomorrow } },
      { clockOut: null },
      {
        clockIn: { $lt: today },
        clockOut: { $gte: today, $lt: tomorrow },
      },
    ],
  });

  const weekEntries = await TimeEntry.find({
    userId: new Types.ObjectId(userId),
    date: {
      $gte: startOfWeek,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  let totalHoursToday = 0;
  todayEntries.forEach((entry) => {
    const clockIn = new Date(entry.clockIn);
    const clockOut = entry.clockOut ? new Date(entry.clockOut) : new Date();

    const startTime = clockIn < today ? today : clockIn;
    const endTime = clockOut > tomorrow ? tomorrow : clockOut;

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
}

export async function getCurrentStatusForUser(userId: string): Promise<{ isClockedIn: boolean; activeEntry: ITimeEntry | null }> {
  const activeEntry = (await TimeEntry.findOne({
    userId: new Types.ObjectId(userId),
    clockOut: null,
  }).sort({ clockIn: -1 })) as ITimeEntry | null;

  return {
    isClockedIn: !!activeEntry,
    activeEntry,
  };
}