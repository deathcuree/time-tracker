import { Request, Response } from 'express';
import { success } from '../utils/response.js';
import {
  listAllUsers,
  userTimeEntries,
  timeReport,
  updateRole,
  exportPTORequestsTable,
  listTimeLogs,
  exportTimeLogsToXlsx,
} from '../services/admin.service.js';
import {
  TimeEntriesParams,
  TimeEntriesQuery,
  TimeReportQuery,
  UpdateUserRoleBody,
  UpdateUserRoleParams,
} from '../types/admin.js';

export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await listAllUsers();
  success(res, users);
};

export const getUserTimeEntries = async (
  req: Request<TimeEntriesParams, {}, {}, TimeEntriesQuery>,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  const entries = await userTimeEntries({ userId, startDate, endDate });
  success(res, entries);
};

export const getTimeReport = async (
  req: Request<{}, {}, {}, TimeReportQuery>,
  res: Response,
): Promise<void> => {
  const { startDate, endDate } = req.query;
  const report = await timeReport(startDate, endDate);
  success(res, report);
};

export const updateUserRole = async (
  req: Request<UpdateUserRoleParams, {}, UpdateUserRoleBody>,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  const { role } = req.body;
  const user = await updateRole(userId, role);
  success(res, user ?? undefined);
};

export const exportTableData = async (
  req: Request<{}, {}, {}, { search?: string; status?: 'pending' | 'approved' | 'denied' | 'all' }>,
  res: Response,
): Promise<void> => {
  const { search, status } = req.query;
  const { buffer, filename } = await exportPTORequestsTable({ search, status });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Transfer-Encoding', 'binary');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).end(buffer);
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
  const data = await listTimeLogs(req.query);
  success(res, data);
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
  const { buffer, filename } = await exportTimeLogsToXlsx(req.query);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Transfer-Encoding', 'binary');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).end(buffer);
};
