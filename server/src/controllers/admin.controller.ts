import { Request, Response } from 'express';
import User from '../models/User.js';
import TimeEntry from '../models/TimeEntry.js';
import PTORequest from '../models/PTORequest.js';
import { IUser, ITimeEntry } from '../types/models.js';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password') as IUser[];
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

interface TimeEntriesParams {
  userId: string;
}

interface TimeEntriesQuery {
  startDate?: string;
  endDate?: string;
}

export const getUserTimeEntries = async (
  req: Request<TimeEntriesParams, {}, {}, TimeEntriesQuery>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const query: { userId: mongoose.Types.ObjectId; date?: { $gte: Date; $lte: Date } } = {
      userId: new mongoose.Types.ObjectId(userId)
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const timeEntries = await TimeEntry.find(query)
      .sort({ date: -1 }) as ITimeEntry[];

    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

interface TimeReportQuery {
  startDate: string;
  endDate: string;
}

interface TimeReportEntry {
  _id: mongoose.Types.ObjectId;
  totalHours: number;
  entries: ITimeEntry[];
  user: IUser;
}

export const getTimeReport = async (
  req: Request<{}, {}, {}, TimeReportQuery>,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const timeEntries = await TimeEntry.aggregate<TimeReportEntry>([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          clockOut: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalHours: { $sum: '$totalHours' },
          entries: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          'user.password': 0
        }
      }
    ]);

    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

interface UpdateUserRoleParams {
  userId: string;
}

interface UpdateUserRoleBody {
  role: 'user' | 'admin';
}

export const updateUserRole = async (
  req: Request<UpdateUserRoleParams, {}, UpdateUserRoleBody>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password') as IUser | null;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}; 

export const exportTableData = async (
  req: Request<{}, {}, {}, { search?: string; status?: 'pending' | 'approved' | 'denied' | 'all'; pagination?: string }>,
  res: Response
): Promise<void> => {
  try {
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' }
    ];

    const { search, status } = req.query;

    if (status && status !== 'all') {
      pipeline.push({
        $match: { status }
      });
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
              options: 'i'
            }
          }
        }
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
      Status: String(r.status || '').charAt(0).toUpperCase() + String(r.status || '').slice(1),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: ['Employee', 'Date', 'Hours', 'Reason', 'Status'] });
    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    // Write as a Node Buffer; serverless-http will base64-encode for binary responses
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

    const today = new Date().toISOString().slice(0, 10);
    const filename = `table-export-${today}.xlsx`;

    // Set precise XLSX content type and instruct intermediaries not to transform the body
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-store, no-transform');
    res.setHeader('Pragma', 'no-cache');

    // End with the raw buffer to avoid any implicit transformations
    res.status(200).end(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export data', error: (error as Error).message });
  }
};
// Admin Time Logs - list entries across users with search, filters, and pagination
export const getTimeLogs = async (
  req: Request<{}, {}, {}, {
    search?: string;
    status?: 'all' | 'active' | 'completed';
    month?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  }>,
  res: Response
): Promise<void> => {
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
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build base match from date range and status
    const match: any = {};

    // Date filter preference: month/year -> start/end -> none
    let rangeStart: Date | undefined;
    let rangeEnd: Date | undefined;

    if (year !== undefined && month !== undefined) {
      // month expected 0-based (JS month index), consistent with existing client MonthYearFilter
      const y = Number(year);
      const m = Number(month);
      rangeStart = new Date(y, m, 1, 0, 0, 0, 0);
      // last day of month at 23:59:59.999
      rangeEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
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
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
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
                  options: 'i'
                }
              }
            }
          ]
        }
      });
    }

    pipeline.push(
      { $sort: { date: -1, clockIn: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limitNum },
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
                  email: '$user.email'
                },
                // Compute working hours up to now for active entries, round to 2 decimals
                hours: {
                  $round: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            {
                              $cond: [{ $eq: ['$clockOut', null] }, '$$NOW', '$clockOut']
                            },
                            '$clockIn'
                          ]
                        },
                        1000 * 60 * 60
                      ]
                    },
                    2
                  ]
                },
                status: {
                  $cond: [{ $eq: ['$clockOut', null] }, 'active', 'completed']
                }
              }
            }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    );

    const aggResult = await TimeEntry.aggregate(pipeline);
    const items = (aggResult?.[0]?.items ?? []) as any[];
    const total = Number(aggResult?.[0]?.total?.[0]?.count ?? 0);
    const pages = Math.max(1, Math.ceil(total / limitNum));

    res.json({
      items,
      pagination: {
        total,
        page: pageNum,
        pages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
// Export all matching time logs to Excel (no pagination)
export const exportTimeLogs = async (
  req: Request<{}, {}, {}, {
    search?: string;
    status?: 'all' | 'active' | 'completed';
    month?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
  }>,
  res: Response
): Promise<void> => {
  try {
    const {
      search = '',
      status = 'all',
      month,
      year,
      startDate,
      endDate,
    } = req.query;

    // Build base match from date range and status
    const match: any = {};

    // Date filter preference: month/year -> start/end -> none
    let rangeStart: Date | undefined;
    let rangeEnd: Date | undefined;

    if (year !== undefined && month !== undefined) {
      // month expected 0-based (JS month index), consistent with existing client MonthYearFilter
      const y = Number(year);
      const m = Number(month);
      rangeStart = new Date(y, m, 1, 0, 0, 0, 0);
      // last day of month at 23:59:59.999
      rangeEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
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
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
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
                  options: 'i'
                }
              }
            }
          ]
        }
      });
    }

    pipeline.push(
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
            email: '$user.email'
          },
          hours: {
            $round: [
              {
                $divide: [
                  {
                    $subtract: [
                      {
                        $cond: [{ $eq: ['$clockOut', null] }, '$$NOW', '$clockOut']
                      },
                      '$clockIn'
                    ]
                  },
                  1000 * 60 * 60
                ]
              },
              2
            ]
          },
          status: {
            $cond: [{ $eq: ['$clockOut', null] }, 'active', 'completed']
          }
        }
      }
    );

    const items = await TimeEntry.aggregate(pipeline);

    // Build rows for Excel
    const rows = items.map((item: any) => {
      const name = `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim();
      const formatDate = (d: Date) => new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD
      const formatTime = (d?: Date | null) => (d ? new Date(d).toISOString().slice(11, 16) : ''); // HH:mm (UTC)
      return {
        Employee: name,
        Email: item.user?.email ?? '',
        Date: item.date ? formatDate(item.date) : '',
        'Clock In': item.clockIn ? formatTime(item.clockIn) : '',
        'Clock Out': item.clockOut ? formatTime(item.clockOut) : '',
        Hours: typeof item.hours === 'number' ? item.hours : 0,
        Status: String(item.status || '').charAt(0).toUpperCase() + String(item.status || '').slice(1),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: ['Employee', 'Email', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Status'] });
    XLSX.utils.book_append_sheet(wb, ws, 'Time Logs');

    // Write as a Node Buffer; serverless-http will base64-encode for binary responses
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

    // Prefer specific month/year filename when available
    let filename: string;
    if (year !== undefined && month !== undefined) {
      const y = Number(year);
      const m = Number(month) + 1;
      filename = `time-logs-${y}-${String(m).padStart(2, '0')}.xlsx`;
    } else {
      const today = new Date().toISOString().slice(0, 10);
      filename = `time-logs-${today}.xlsx`;
    }

    // Set precise XLSX content type and instruct intermediaries not to transform the body
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-store, no-transform');
    res.setHeader('Pragma', 'no-cache');

    // End with the raw buffer to avoid any implicit transformations
    res.status(200).end(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export time logs', error: (error as Error).message });
  }
};