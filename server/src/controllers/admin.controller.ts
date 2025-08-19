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

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const today = new Date().toISOString().slice(0, 10);
    const filename = `table-export-${today}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export data', error: (error as Error).message });
  }
};