import { Request, Response } from 'express';
import { IUser } from '../../types/models.js';
import { AdminService } from './admin.service.js';
import { ReportService } from '../../shared/services/report.service.js';
import { UserManagementService } from './userManagement.service.js';
import {
  TimeEntriesParams,
  TimeEntriesQuery,
  TimeReportEntry,
  TimeReportQuery,
  UpdateUserRoleBody,
  UpdateUserRoleParams,
} from '../../types/admin.js';
import { setExportHeaders } from '../../shared/utils/response.js';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await AdminService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

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

    const user = (await UserManagementService.updateUserRole(userId, role)) as IUser | null;

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

    const { buffer, filename } = await ReportService.exportPTORequestsToXLSX({
      search,
      status,
    });

    setExportHeaders(res, filename);
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

    const { buffer, filename } = await ReportService.exportTimeLogsXLSX({
      search,
      status,
      month,
      year,
      startDate,
      endDate,
      tzOffset,
    });

    setExportHeaders(res, filename);
    res.status(200).end(buffer);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to export time logs', error: (error as Error).message });
  }
};
