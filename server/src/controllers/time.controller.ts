import { Request, Response } from 'express';
import { ITimeEntry } from '../types/models.js';
import { TimeService } from '../services/time.service.js';

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

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeEntry = (await TimeService.clockOut(req.user!._id.toString())) as ITimeEntry;
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

export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query as any;

    const result = await TimeService.getTimeEntries(req.user!._id.toString(), {
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

export const getTimeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await TimeService.getTimeStats(req.user!._id.toString());
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getCurrentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await TimeService.getCurrentStatus(req.user!._id.toString());
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

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
    res
      .status(500)
      .json({ success: false, message: 'Server error', error: (error as Error).message });
  }
};
