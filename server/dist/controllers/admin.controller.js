import User from '../models/User.js';
import TimeEntry from '../models/TimeEntry.js';
import mongoose from 'mongoose';
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
export const getUserTimeEntries = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        const query = {
            userId: new mongoose.Types.ObjectId(userId)
        };
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        const timeEntries = await TimeEntry.find(query)
            .sort({ date: -1 });
        res.json(timeEntries);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
export const getTimeReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const timeEntries = await TimeEntry.aggregate([
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }
        const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
