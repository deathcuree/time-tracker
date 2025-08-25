import { Request, Response } from 'express';
import { IPTORequestBody } from '../types/models.js';
import { PTOService } from '../services/pto.service.js';
import { UpdateRequestBody, UpdateRequestParams } from '../types/pto.js';

/**
 * POST /api/pto
 * Creates a PTO request. Signature and response are preserved.
 */
export const createRequest = async (
  req: Request<{}, {}, IPTORequestBody>,
  res: Response,
): Promise<void> => {
  try {
    const created = await PTOService.createRequest(req.user!._id.toString(), req.body);
    res.status(201).json(created);
  } catch (error) {
    const err = error as any;
    const status = typeof err?.status === 'number' ? err.status : 500;
    const message = status === 500 ? 'Server error' : err.message || 'Request failed';
    res.status(status).json({ message, error: (err as Error).message });
  }
};

/**
 * GET /api/pto/my
 * Returns PTO requests for the authenticated user. Signature preserved.
 */
export const getUserRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const transformedRequests = await PTOService.getUserRequests(
      req.user!._id.toString(),
      search as string | undefined,
    );
    res.json(transformedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * PATCH /api/pto/:requestId/status
 * Admin only. Updates PTO request status. Signature preserved.
 */
export const updateRequestStatus = async (
  req: Request<UpdateRequestParams, {}, UpdateRequestBody>,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body;
    const { requestId } = req.params;

    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const updatedRequest = await PTOService.updateRequestStatus(
      requestId,
      req.user!._id.toString(),
      status,
    );
    res.json(updatedRequest);
  } catch (error) {
    const err = error as any;
    if (err?.status === 400) {
      res.status(400).json({ message: err.message });
      return;
    }
    if (err?.status === 404) {
      res.status(404).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/pto
 * Admin: list all PTO requests with optional search. Signature preserved.
 */
export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const { search } = req.query;
    const results = await PTOService.getAllRequests(search as string | undefined);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/pto/monthly-count/:year/:month
 * Returns total approved PTO hours for the month for the authenticated user. Signature preserved.
 */
export const getMonthlyRequestCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      res.status(400).json({ message: 'Invalid year or month' });
      return;
    }

    const result = await PTOService.getMonthlyRequestCount(
      req.user!._id.toString(),
      yearNum,
      monthNum,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/pto/yearly/:year
 * Returns yearly PTO stats for the authenticated user. Signature preserved.
 */
export const getYearlyPTOHours = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.params.year);

    if (isNaN(year)) {
      res.status(400).json({ message: 'Invalid year' });
      return;
    }

    const stats = await PTOService.getYearlyPTOHours(req.user!._id.toString(), year);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
