import User from '../models/User.js';
import TimeEntry from '../models/TimeEntry.js';
import PTORequest from '../models/PTORequest.js';
import { IUser, ITimeEntry } from '../types/models.js';
import mongoose, { Types } from 'mongoose';
import createError from 'http-errors';
import { parseDateRange, clampPagination, isValidObjectId } from '../utils/date.js';
import { makeExcelFile } from '../utils/excel.js';

export async function listAllUsers(): Promise<IUser[]> {
  try {
    return (await User.find().select('-password')) as unknown as IUser[];
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to list users');
  }
}

export async function userTimeEntries(params: {
  userId: string;
  startDate?: string;
  endDate?: string;
}): Promise<ITimeEntry[]> {
  try {
    const { userId, startDate, endDate } = params;
    if (!isValidObjectId(userId)) throw createError(400, 'Invalid userId');

    const query: {
      userId: Types.ObjectId;
      date?: { $gte?: Date; $lte?: Date };
    } = {
      userId: new Types.ObjectId(userId),
    };

    const { start, end } = parseDateRange(startDate, endDate);
    if (start || end) {
      query.date = {};
      if (start) query.date.$gte = start;
      if (end) query.date.$lte = end;
    }

    return (await TimeEntry.find(query).sort({ date: -1, clockIn: -1 })) as unknown as ITimeEntry[];
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to fetch user time entries');
  }
}

export type TimeReportEntry = {
  _id: mongoose.Types.ObjectId;
  totalHours: number;
  entries: ITimeEntry[];
  user: IUser;
};

export async function timeReport(startDate: string, endDate: string): Promise<TimeReportEntry[]> {
  try {
    const { start, end } = parseDateRange(startDate, endDate);
    if (!start || !end) throw createError(400, 'startDate and endDate are required');

    return TimeEntry.aggregate<TimeReportEntry>([
      {
        $match: {
          date: { $gte: start, $lte: end },
          clockOut: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalHours: { $sum: '$totalHours' },
          entries: { $push: '$$ROOT' },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.password': 0 } },
    ]);
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to build time report');
  }
}

export async function updateRole(userId: string, role: 'user' | 'admin'): Promise<IUser | null> {
  try {
    if (!['user', 'admin'].includes(role)) throw createError(400, 'Invalid role');
    if (!isValidObjectId(userId)) throw createError(400, 'Invalid userId');

    const updated = (await User.findByIdAndUpdate(userId, { role }, { new: true }).select(
      '-password',
    )) as IUser | null;
    if (!updated) throw createError(404, 'User not found');
    return updated;
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to update role');
  }
}

export async function exportPTORequestsTable(args: {
  search?: string;
  status?: 'pending' | 'approved' | 'denied' | 'all';
}) {
  try {
    const pipeline: any[] = [
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userDetails' } },
      { $unwind: '$userDetails' },
    ];

    const { search, status } = args;

    if (status && status !== 'all') {
      pipeline.push({ $match: { status } });
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchStr = search.toLowerCase().trim();
      const orConditions: any[] = [
        { reason: { $regex: searchStr, $options: 'i' } },
        { status: { $regex: searchStr, $options: 'i' } },
        { 'userDetails.firstName': { $regex: searchStr, $options: 'i' } },
        { 'userDetails.lastName': { $regex: searchStr, $options: 'i' } },
        { 'userDetails.email': { $regex: searchStr, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $dateToString: { date: '$date', format: '%Y-%m-%d' } },
              regex: searchStr,
              options: 'i',
            },
          },
        },
      ];
      const numeric = Number(searchStr);
      if (!Number.isNaN(numeric)) {
        orConditions.push({ hours: numeric });
      }
      pipeline.push({ $match: { $or: orConditions } });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const requests = await PTORequest.aggregate(pipeline);
    const rows = requests.map((r: any) => ({
      Employee: `${r.userDetails?.firstName ?? ''} ${r.userDetails?.lastName ?? ''}`.trim(),
      Date: new Date(r.date).toISOString().split('T')[0],
      Hours: r.hours,
      Reason: r.reason,
      Status:
        String(r.status || '')
          .charAt(0)
          .toUpperCase() + String(r.status || '').slice(1),
    }));

    const headers = ['Employee', 'Date', 'Hours', 'Reason', 'Status'];
    const { buffer, filename } = makeExcelFile(rows, headers, 'PTO Requests');
    return { buffer, filename };
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to export PTO requests');
  }
}

export async function listTimeLogs(args: {
  search?: string;
  status?: 'all' | 'active' | 'completed';
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}) {
  try {
    const {
      search = '',
      status = 'all',
      month,
      year,
      startDate,
      endDate,
      page = '1',
      limit = '10',
    } = args;

    const { page: p, limit: l, skip } = clampPagination(Number(page), Number(limit), 100);

    const match: any = {};

    let rangeStart: Date | undefined;
    let rangeEnd: Date | undefined;

    if (year !== undefined && month !== undefined) {
      const y = Number(year);
      const m = Number(month);
      rangeStart = new Date(y, m, 1, 0, 0, 0, 0);
      rangeEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else {
      const { start, end } = parseDateRange(startDate, endDate);
      rangeStart = start;
      rangeEnd = end;
    }

    if (rangeStart && rangeEnd) {
      match.date = { $gte: rangeStart, $lte: rangeEnd };
    }

    if (status === 'active') {
      match.clockOut = null;
    } else if (status === 'completed') {
      match.clockOut = { $ne: null };
    }

    const pipeline: any[] = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ];

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchStr = search.trim();
      pipeline.push({
        $match: {
          $or: [
            { 'user.firstName': { $regex: searchStr, $options: 'i' } },
            { 'user.lastName': { $regex: searchStr, $options: 'i' } },
            { 'user.email': { $regex: searchStr, $options: 'i' } },
            {
              $expr: {
                $regexMatch: {
                  input: { $dateToString: { date: '$date', format: '%Y-%m-%d' } },
                  regex: searchStr,
                  options: 'i',
                },
              },
            },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { date: -1, clockIn: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: l },
            {
              $project: {
                _id: 1,
                date: 1,
                clockIn: 1,
                clockOut: 1,
                user: {
                  _id: '$user._id',
                  firstName: '$user.firstName',
                  lastName: '$user.lastName',
                  email: '$user.email',
                },
                hours: {
                  $round: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            { $cond: [{ $eq: ['$clockOut', null] }, '$$NOW', '$clockOut'] },
                            '$clockIn',
                          ],
                        },
                        1000 * 60 * 60,
                      ],
                    },
                    2,
                  ],
                },
                status: { $cond: [{ $eq: ['$clockOut', null] }, 'active', 'completed'] },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    );

    const aggResult = await TimeEntry.aggregate(pipeline);
    const items = (aggResult?.[0]?.items ?? []) as any[];
    const total = Number(aggResult?.[0]?.total?.[0]?.count ?? 0);

    return { items, pagination: { total, page: p, limit: l } };
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to list time logs');
  }
}

export async function exportTimeLogsToXlsx(args: {
  search?: string;
  status?: 'all' | 'active' | 'completed';
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  tzOffset?: string;
}) {
  try {
    const { search = '', status = 'all', month, year, startDate, endDate, tzOffset } = args;

    const tzOffsetMinutes = Number(tzOffset ?? '0');
    const toLocal = (d?: Date | null) => {
      if (!d) return null;
      const ms = new Date(d).getTime();
      return new Date(ms - tzOffsetMinutes * 60 * 1000);
    };
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const formatDateLocal = (d?: Date | null) => {
      if (!d) return '';
      const ld = toLocal(d)!;
      const yyyy = ld.getUTCFullYear();
      const mmm = monthNames[ld.getUTCMonth()];
      const dd = String(ld.getUTCDate()).padStart(2, '0');
      return `${mmm} ${dd}, ${yyyy}`;
    };
    const formatTimeLocal = (d?: Date | null) => {
      if (!d) return '';
      const ld = toLocal(d)!;
      let hours = ld.getUTCHours();
      const minutes = ld.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const mm = String(minutes).padStart(2, '0');
      return `${hours}:${mm} ${ampm}`;
    };
    const formatHoursWorked = (hours?: number | null) => {
      if (typeof hours !== 'number' || isNaN(hours)) return '0 mins';
      const totalMinutes = Math.round(hours * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const parts: string[] = [];
      if (h > 0) parts.push(`${h} hr${h === 1 ? '' : 's'}`);
      if (m > 0) parts.push(`${m} min${m === 1 ? '' : 's'}`);
      return parts.length > 0 ? parts.join(' ') : '0 mins';
    };

    const match: any = {};
    let rangeStart: Date | undefined;
    let rangeEnd: Date | undefined;

    if (year !== undefined && month !== undefined) {
      const y = Number(year);
      const m = Number(month);
      rangeStart = new Date(y, m, 1, 0, 0, 0, 0);
      rangeEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else {
      const { start, end } = parseDateRange(startDate, endDate);
      rangeStart = start;
      rangeEnd = end;
    }

    if (rangeStart && rangeEnd) {
      match.date = { $gte: rangeStart, $lte: rangeEnd };
    }

    if (status === 'active') {
      match.clockOut = null;
    } else if (status === 'completed') {
      match.clockOut = { $ne: null };
    }

    const pipeline: any[] = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      ...(search && search.trim().length > 0
        ? [
            {
              $match: {
                $or: [
                  { 'user.firstName': { $regex: search.trim(), $options: 'i' } },
                  { 'user.lastName': { $regex: search.trim(), $options: 'i' } },
                  { 'user.email': { $regex: search.trim(), $options: 'i' } },
                  {
                    $expr: {
                      $regexMatch: {
                        input: { $dateToString: { date: '$date', format: '%Y-%m-%d' } },
                        regex: search.trim(),
                        options: 'i',
                      },
                    },
                  },
                ],
              },
            },
          ]
        : []),
      { $sort: { date: -1, clockIn: -1 } },
      {
        $project: {
          _id: 1,
          date: 1,
          clockIn: 1,
          clockOut: 1,
          user: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            email: '$user.email',
          },
          hours: {
            $round: [
              {
                $divide: [
                  {
                    $subtract: [
                      { $cond: [{ $eq: ['$clockOut', null] }, '$$NOW', '$clockOut'] },
                      '$clockIn',
                    ],
                  },
                  1000 * 60 * 60,
                ],
              },
              2,
            ],
          },
          status: { $cond: [{ $eq: ['$clockOut', null] }, 'active', 'completed'] },
        },
      },
    ];

    const items = await TimeEntry.aggregate(pipeline);

    const rows = items.map((item: any) => {
      const name = `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim();
      return {
        Employee: name,
        Email: item.user?.email ?? '',
        Date: item.date ? formatDateLocal(item.date) : '',
        'Clock In': item.clockIn ? formatTimeLocal(item.clockIn) : '',
        'Clock Out': item.clockOut ? formatTimeLocal(item.clockOut) : '',
        'Hours Worked': formatHoursWorked(item.hours),
        Status:
          String(item.status || '')
            .charAt(0)
            .toUpperCase() + String(item.status || '').slice(1),
      };
    });

    const headers = [
      'Employee',
      'Email',
      'Date',
      'Clock In',
      'Clock Out',
      'Hours Worked',
      'Status',
    ];
    const sheetName =
      year !== undefined && month !== undefined
        ? `Time Logs ${Number(year)}-${String(Number(month) + 1).padStart(2, '0')}`
        : 'Time Logs';

    const { buffer, filename } = makeExcelFile(rows, headers, sheetName);
    return { buffer, filename };
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to export time logs');
  }
}
