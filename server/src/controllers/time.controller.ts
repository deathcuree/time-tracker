import { Request, Response } from 'express';
import { ITimeEntry } from '../types/models.js';
import { TimeService } from '../services/time.service.js';

/**
 * POST /api/time/clock-in
 * Creates a new time entry for the authenticated user if no active entry exists.
 * Signature and response shape preserved.
 */
export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeEntry = await TimeService.clockIn(req.user!._id.toString());
    res.status(201).json(timeEntry);
  } catch (error) {
    const err = error as any;
    if (typeof err?.status === 'number') {
      res.status(err.status).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * POST /api/time/clock-out
 * Clocks out the currently active time entry for the authenticated user.
 * Signature and response shape preserved.
 */
export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeEntry = await TimeService.clockOut(req.user!._id.toString()) as ITimeEntry;
    res.json(timeEntry);
  } catch (error) {
    const err = error as any;
    if (typeof err?.status === 'number') {
      res.status(err.status).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/time/entries
 * Returns time entries for the authenticated user.
 * - With pagination: { entries, pagination: { total, page, pages } }
 * - Without pagination: { entries }
 * Signature and response shape preserved.
 */
export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query as any;

    const result = await TimeService.getTimeEntries(req.user!._id.toString(), {
      startDate,
      endDate,
      page,
      limit
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/time/stats
 * Computes total hours today and this week for the authenticated user.
 * Signature and response shape preserved.
 */
export const getTimeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await TimeService.getTimeStats(req.user!._id.toString());
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * GET /api/time/status
 * Returns clock-in status and active entry (if any) for the authenticated user.
 * Signature and response shape preserved.
 */
export const getCurrentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await TimeService.getCurrentStatus(req.user!._id.toString());
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

/**
 * DELETE /api/time/entries/:id
 * Deletes a single time entry by id.
 * - 400 if invalid id
 * - 404 if not found
 * - 403 if entry exists but does not belong to the authenticated user
 * Signature and response shape preserved.
 */
export const deleteTimeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await TimeService.deleteTimeEntry(req.user!._id.toString(), id);

    res.status(200).json(result);
  } catch (error) {
    const err = error as any;
    if (typeof err?.status === 'number') {
      res.status(err.status).json({ success: false, message: err.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error', error: (error as Error).message });
  }
};