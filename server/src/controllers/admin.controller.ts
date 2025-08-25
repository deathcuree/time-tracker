import { Request, Response } from 'express';
import User from '../models/User.js';
import { IUser } from '../types/models.js';
import { AdminService } from '../services/admin.service.js';
import {
  TimeEntriesParams,
  TimeEntriesQuery,
  TimeReportEntry,
  TimeReportQuery,
  UpdateUserRoleBody,
  UpdateUserRoleParams,
} from '../types/admin.js';

/**
 * GET /api/admin/users
 * Returns all users
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await AdminService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/admin/users/:userId/time-entries
 * Fetch time entries for a user with optional date range. Signature unchanged.
 */
export const getUserTimeEntries = async (
  req: Request<TimeEntriesParams, {}, {}, TimeEntriesQuery>,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const timeEntries = await AdminService.getUserTimeEntries({
      userId,
      startDate,
      endDate,
    });

    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/admin/time-report
 * Aggregated time report per user. Signature and response unchanged.
 */
export const getTimeReport = async (
  req: Request<{}, {}, {}, TimeReportQuery>,
  res: Response,
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const timeEntries = await AdminService.getTimeReport({ startDate, endDate });

    res.json(timeEntries as unknown as TimeReportEntry[]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * PATCH /api/admin/users/:userId/role
 * Keeps validation and response semantics identical.
 * Note: Minimal business logic left here to avoid route breakage; can be moved later if needed.
 */
export const updateUserRole = async (
  req: Request<UpdateUserRoleParams, {}, UpdateUserRoleBody>,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = (await User.findByIdAndUpdate(userId, { role }, { new: true }).select(
      '-password',
    )) as IUser | null;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/admin/pto/export
 * Exports PTO table data to XLSX.
 */
export const exportTableData = async (
  req: Request<
    {},
    {},
    {},
    { search?: string; status?: 'pending' | 'approved' | 'denied' | 'all'; pagination?: string }
  >,
  res: Response,
): Promise<void> => {
  try {
    const { search, status } = req.query;

    const { buffer, filename } = await AdminService.exportPTORequestsToXLSX({
      search,
      status,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-store, no-transform');
    res.setHeader('Pragma', 'no-cache');

    res.status(200).end(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export data', error: (error as Error).message });
  }
};

export const getTimeLogs = async (
  req: Request<
    {},
    {},
    {},
    {
      search?: string;
      status?: 'all' | 'active' | 'completed';
      month?: string;
      year?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    }
  >,
  res: Response,
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

    const result = await AdminService.getTimeLogs({
      search,
      status,
      month,
      year,
      startDate,
      endDate,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/admin/time-logs/export
 * Exports admin time logs XLSX with timezone-aware formatting.
 * Headers/content-type preserved;
 */
export const exportTimeLogs = async (
  req: Request<
    {},
    {},
    {},
    {
      search?: string;
      status?: 'all' | 'active' | 'completed';
      month?: string;
      year?: string;
      startDate?: string;
      endDate?: string;
      tzOffset?: string;
    }
  >,
  res: Response,
): Promise<void> => {
  try {
    const { search = '', status = 'all', month, year, startDate, endDate, tzOffset } = req.query;

    const { buffer, filename } = await AdminService.exportTimeLogsXLSX({
      search,
      status,
      month,
      year,
      startDate,
      endDate,
      tzOffset,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'no-store, no-transform');
    res.setHeader('Pragma', 'no-cache');

    res.status(200).end(buffer);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to export time logs', error: (error as Error).message });
  }
};
