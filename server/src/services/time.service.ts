import TimeEntry from '../models/TimeEntry.js';
import { ITimeEntry } from '../types/models.js';
import { Types } from 'mongoose';
import createError from 'http-errors';
import { isValidObjectId, parseDateRange, clampPagination } from '../utils/date.js';

export async function clockInForUser(userId: string): Promise<ITimeEntry> {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }

    const [activeEntry] = await Promise.all([
      TimeEntry.findOne({
        userId: new Types.ObjectId(userId),
        clockOut: null,
      }),
    ]);

    if (activeEntry) {
      throw createError(400, 'You already have an active time entry');
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
  } catch (err) {
    if (createError.isHttpError?.(err as any)) throw err;
    throw createError(500, (err as Error).message || 'Failed to clock in');
  }
}

export async function clockOutForUser(userId: string): Promise<ITimeEntry> {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }

    const timeEntry = (await TimeEntry.findOne({
      userId: new Types.ObjectId(userId),
      clockOut: null,
    })) as ITimeEntry | null;

    if (!timeEntry) {
      throw createError(404, 'No active time entry found');
    }

    timeEntry.clockOut = new Date();
    await timeEntry.save();

    return timeEntry;
  } catch (err) {
    if (createError.isHttpError?.(err as any)) throw err;
    throw createError(500, (err as Error).message || 'Failed to clock out');
  }
}

export async function getEntriesForUser(
  userId: string,
  options: { startDate?: string; endDate?: string; page?: number; limit?: number } = {},
): Promise<{ items: ITimeEntry[]; pagination: { total: number; page: number; limit: number } }> {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }

    const { startDate, endDate, page, limit } = options;
    const { start, end } = parseDateRange(startDate, endDate);

    const query: any = { userId: new Types.ObjectId(userId) };
    if (start || end) {
      query.date = {};
      if (start) query.date.$gte = start;
      if (end) query.date.$lte = end;
    }

    const { page: p, limit: l, skip } = clampPagination(page, limit, 100);

    const [items, total] = await Promise.all([
      TimeEntry.find(query).sort({ date: -1, clockIn: -1 }).skip(skip).limit(l),
      TimeEntry.countDocuments(query),
    ]);

    return {
      items,
      pagination: { total, page: p, limit: l },
    };
  } catch (err) {
    if (createError.isHttpError?.(err as any)) throw err;
    throw createError(500, (err as Error).message || 'Failed to fetch entries');
  }
}

export async function getStatsForUser(
  userId: string,
): Promise<{ totalHoursToday: number; totalHoursThisWeek: number }> {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const [todayEntries, weekEntries] = await Promise.all([
      TimeEntry.find({
        userId: new Types.ObjectId(userId),
        $or: [
          { clockIn: { $gte: today, $lt: tomorrow } },
          { clockOut: null },
          {
            clockIn: { $lt: today },
            clockOut: { $gte: today, $lt: tomorrow },
          },
        ],
      }),
      TimeEntry.find({
        userId: new Types.ObjectId(userId),
        date: {
          $gte: startOfWeek,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    let totalHoursToday = 0;
    for (const entry of todayEntries) {
      const clockIn = new Date(entry.clockIn);
      const clockOut = entry.clockOut ? new Date(entry.clockOut) : new Date();

      const startTime = clockIn < today ? today : clockIn;
      const endTime = clockOut > tomorrow ? tomorrow : clockOut;

      const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      totalHoursToday += hoursWorked;
    }

    let totalHoursThisWeek = 0;
    for (const entry of weekEntries) {
      const clockIn = new Date(entry.clockIn).getTime();
      const clockOut = entry.clockOut ? new Date(entry.clockOut).getTime() : new Date().getTime();

      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      totalHoursThisWeek += hoursWorked;
    }

    return {
      totalHoursToday: parseFloat(totalHoursToday.toFixed(2)),
      totalHoursThisWeek: parseFloat(totalHoursThisWeek.toFixed(2)),
    };
  } catch (err) {
    if (createError.isHttpError?.(err as any)) throw err;
    throw createError(500, (err as Error).message || 'Failed to compute stats');
  }
}

export async function getCurrentStatusForUser(
  userId: string,
): Promise<{ isClockedIn: boolean; activeEntry: ITimeEntry | null }> {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }

    const activeEntry = (await TimeEntry.findOne({
      userId: new Types.ObjectId(userId),
      clockOut: null,
    }).sort({ clockIn: -1 })) as ITimeEntry | null;

    return {
      isClockedIn: !!activeEntry,
      activeEntry,
    };
  } catch (err) {
    if (createError.isHttpError?.(err as any)) throw err;
    throw createError(500, (err as Error).message || 'Failed to get current status');
  }
}
