import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TimeEntry from '../models/TimeEntry.js';
import { ITimeEntry } from '../types/models.js';

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeEntry = await TimeEntry.findOne({
      userId: req.user!._id,
      clockOut: null
    });

    if (activeEntry) {
      res.status(400).json({ message: 'You already have an active time entry' });
      return;
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const timeEntry = new TimeEntry({
      userId: req.user!._id,
      date: today,
      clockIn: now
    }) as ITimeEntry;

    await timeEntry.save();
    res.status(201).json(timeEntry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeEntry = await TimeEntry.findOne({
      userId: req.user!._id,
      clockOut: null
    }) as ITimeEntry | null;

    if (!timeEntry) {
      res.status(400).json({ message: 'No active time entry found' });
      return;
    }

    timeEntry.clockOut = new Date();
    await timeEntry.save();

    res.json(timeEntry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const query: any = { userId: req.user!._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (page) {
      const skip = (Number(page) - 1) * Number(limit);
      const entries = await TimeEntry.find(query)
        .sort({ date: -1, clockIn: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await TimeEntry.countDocuments(query);

      res.json({
        entries,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } else {
      const entries = await TimeEntry.find(query)
        .sort({ date: -1, clockIn: -1 });

      res.json({ entries });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getTimeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    const todayEntries = await TimeEntry.find({
      userId: req.user!._id,
      $or: [
        { clockIn: { $gte: today, $lt: tomorrow } },
        { clockOut: null },
        { 
          clockIn: { $lt: today },
          clockOut: { $gte: today, $lt: tomorrow }
        }
      ]
    });

    const weekEntries = await TimeEntry.find({
      userId: req.user!._id,
      date: {
        $gte: startOfWeek,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    let totalHoursToday = 0;
    todayEntries.forEach(entry => {
      const clockIn = new Date(entry.clockIn);
      const clockOut = entry.clockOut ? new Date(entry.clockOut) : new Date();
      
      const startTime = clockIn < today ? today : clockIn;
      const endTime = clockOut > tomorrow ? tomorrow : clockOut;
      
      const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      totalHoursToday += hoursWorked;
    });

    let totalHoursThisWeek = 0;
    weekEntries.forEach(entry => {
      const clockIn = new Date(entry.clockIn).getTime();
      const clockOut = entry.clockOut 
        ? new Date(entry.clockOut).getTime()
        : (new Date().getTime());

      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      totalHoursThisWeek += hoursWorked;
    });

    res.json({
      totalHoursToday: parseFloat(totalHoursToday.toFixed(2)),
      totalHoursThisWeek: parseFloat(totalHoursThisWeek.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getCurrentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeEntry = await TimeEntry.findOne({
      userId: req.user!._id,
      clockOut: null
    }).sort({ clockIn: -1 }) as ITimeEntry | null;

    res.json({
      isClockedIn: !!activeEntry,
      activeEntry
    });
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
 */
export const deleteTimeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid entry id' });
      return;
    }

    const entry = await TimeEntry.findById(id) as ITimeEntry | null;

    if (!entry) {
      res.status(404).json({ success: false, message: 'Time entry not found' });
      return;
    }

    if (entry.userId.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
      return;
    }

    // Prevent deleting an active entry (no clockOut yet)
    if (!entry.clockOut) {
      res.status(400).json({ success: false, message: 'Cannot delete an active time entry. Please clock out first.' });
      return;
    }

    await TimeEntry.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Time entry deleted successfully',
      deletedId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: (error as Error).message });
  }
};