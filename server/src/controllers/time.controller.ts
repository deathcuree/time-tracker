import { Request, Response } from 'express';
import { success, error as errorResponse } from '../utils/response.js';
import {
  clockInForUser,
  clockOutForUser,
  getEntriesForUser,
  getStatsForUser,
  getCurrentStatusForUser,
} from '../services/time.service.js';

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }
  const entry = await clockInForUser(userId);
  success(res, entry, 201);
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }
  const entry = await clockOutForUser(userId);
  success(res, entry);
};

export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }
  const { startDate, endDate, page, limit } = req.query as {
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };

  const result = await getEntriesForUser(userId, {
    startDate,
    endDate,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  success(res, result);
};

export const getTimeStats = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }
  const stats = await getStatsForUser(userId);
  success(res, stats);
};

export const getCurrentStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }
  const result = await getCurrentStatusForUser(userId);
  success(res, result);
};