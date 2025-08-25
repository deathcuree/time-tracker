import { Request, Response } from 'express';
import { success, error as errorResponse } from '../utils/response.js';
import {
  createPTORequest,
  getUserPTORequests,
  getAllPTORequests,
  updatePTORequestStatus,
  getMonthlyRequestCountForUser,
  getYearlyPTOHoursForUser,
} from '../services/pto.service.js';
import { IPTORequestBody } from '../types/models.js';

export const createRequest = async (req: Request<{}, {}, IPTORequestBody>, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const { date, hours, reason } = req.body;
  const created = await createPTORequest(userId, { date, hours, reason });
  success(res, created, 201);
};

export const getUserRequests = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const { search } = req.query as { search?: string };
  const requests = await getUserPTORequests(userId, search);
  success(res, requests);
};

export interface UpdateRequestParams {
  requestId: string;
}
export interface UpdateRequestBody {
  status: 'approved' | 'denied';
}

export const updateRequestStatus = async (
  req: Request<UpdateRequestParams, {}, UpdateRequestBody>,
  res: Response
): Promise<void> => {
  const approverId = req.user?._id?.toString();
  if (!approverId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  if (req.user?.role !== 'admin') {
    errorResponse(res, 403, 'Not authorized');
    return;
  }

  const { requestId } = req.params;
  const { status } = req.body;
  const updated = await updatePTORequestStatus(requestId, approverId, status);
  success(res, updated ?? undefined);
};

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== 'admin') {
    errorResponse(res, 403, 'Not authorized');
    return;
  }

  const { search } = req.query as { search?: string };
  const results = await getAllPTORequests(search);
  success(res, results);
};

export const getMonthlyRequestCount = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const { year, month } = req.params as { year: string; month: string };
  const result = await getMonthlyRequestCountForUser(userId, parseInt(year, 10), parseInt(month, 10));
  success(res, result);
};

export const getYearlyPTOHours = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id?.toString();
  if (!userId) {
    errorResponse(res, 401, 'Authentication required');
    return;
  }

  const { year } = req.params as { year: string };
  const result = await getYearlyPTOHoursForUser(userId, parseInt(year, 10));
  success(res, result);
};