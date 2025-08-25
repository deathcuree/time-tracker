import PTORequest from '../models/PTORequest.js';
import User from '../models/User.js';
import { IPTORequest } from '../types/models.js';
import { Types } from 'mongoose';
import createError from 'http-errors';
import { isValidObjectId } from '../utils/date.js';

const MONTHLY_PTO_HOURS = 16;

export async function createPTORequest(
  userId: string,
  input: { date: string; hours: number; reason: string }
): Promise<IPTORequest> {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const requestDate = new Date(input.date);
    if (isNaN(requestDate.getTime())) {
      throw createError(400, 'Invalid request date');
    }

    if (requestDate < now) {
      throw createError(400, 'Request date must be in the future');
    }

    if (input.hours < 1 || input.hours > 8) {
      throw createError(400, 'PTO hours must be between 1 and 8');
    }

    const requestMonth = requestDate.getMonth();
    const requestYear = requestDate.getFullYear();

    const existingApprovedThisMonth = await PTORequest.find({
      userId: new Types.ObjectId(userId),
      status: 'approved',
      $expr: {
        $and: [{ $eq: [{ $month: '$date' }, requestMonth + 1] }, { $eq: [{ $year: '$date' }, requestYear] }],
      },
    });

    const hoursUsedThisMonth = existingApprovedThisMonth.reduce((total, r) => total + r.hours, 0);
    if (hoursUsedThisMonth + input.hours > MONTHLY_PTO_HOURS) {
      const monthName = new Date(requestYear, requestMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
      throw createError(400, `You have ${MONTHLY_PTO_HOURS - hoursUsedThisMonth} PTO hours remaining for ${monthName}`);
    }

    const ptoRequest = new PTORequest({
      userId: new Types.ObjectId(userId),
      userName: user.name,
      userEmail: user.email,
      date: requestDate,
      hours: input.hours,
      reason: input.reason,
      expiryYear: requestYear,
    }) as IPTORequest;

    await ptoRequest.save();
    return ptoRequest;
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to create PTO request');
  }
}

export async function getUserPTORequests(userId: string, search?: string) {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }

    let query: any = { userId: new Types.ObjectId(userId) };

    if (search) {
      const searchStr = search.toLowerCase();
      const dateConditions = createDateSearchConditions(searchStr);

      query = {
        $and: [
          { userId: new Types.ObjectId(userId) },
          {
            $or: [
              { reason: { $regex: searchStr, $options: 'i' } },
              { status: { $regex: searchStr, $options: 'i' } },
              // Only include hours condition when numeric
              ...(!isNaN(Number(search)) ? [{ hours: Number(search) }] : []),
              ...dateConditions,
            ],
          },
        ],
      };
    }

    const requests = (await PTORequest.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })) as IPTORequest[];

    return requests.map((r) => ({
      ...r.toObject(),
      userName: r.userId ? `${(r.userId as any).firstName} ${(r.userId as any).lastName}` : 'Unknown User',
      userEmail: (r.userId as any).email || 'No Email',
    }));
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to fetch PTO requests');
  }
}

export async function updatePTORequestStatus(
  requestId: string,
  approverId: string,
  status: 'approved' | 'denied'
) {
  try {
    if (!['approved', 'denied'].includes(status)) {
      throw createError(400, 'Invalid status');
    }
    if (!isValidObjectId(requestId)) {
      throw createError(400, 'Invalid requestId');
    }
    if (!isValidObjectId(approverId)) {
      throw createError(400, 'Invalid approverId');
    }

    const ptoRequest = (await PTORequest.findById(requestId).populate('userId', 'firstName lastName email')) as
      | IPTORequest
      | null;
    if (!ptoRequest) {
      throw createError(404, 'PTO request not found');
    }

    ptoRequest.status = status;
    ptoRequest.approvedBy = new Types.ObjectId(approverId);
    ptoRequest.approvalDate = new Date();

    if (ptoRequest.userId) {
      ptoRequest.userName = `${(ptoRequest.userId as any).firstName} ${(ptoRequest.userId as any).lastName}`;
      ptoRequest.userEmail = (ptoRequest.userId as any).email;
    }

    await ptoRequest.save();

    const updated = await PTORequest.findById(requestId).populate('userId', 'firstName lastName email').exec();
    return updated;
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to update PTO request status');
  }
}

export async function getAllPTORequests(search?: string) {
  try {
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
    ];

    if (search) {
      const searchStr = search.toLowerCase();
      const searchTerms = searchStr.split(/\s+/).filter((t) => t.length > 0);
      const dateConditions = createDateSearchConditions(searchStr);

      if (searchTerms.length > 0) {
        type SearchCondition = { $or?: Array<{ [key: string]: any }>; hours?: number; $expr?: any };

        const searchConditions: SearchCondition[] = searchTerms.map((term) => ({
          $or: [
            { reason: { $regex: term, $options: 'i' } },
            { status: { $regex: term, $options: 'i' } },
            { 'userDetails.firstName': { $regex: term, $options: 'i' } },
            { 'userDetails.lastName': { $regex: term, $options: 'i' } },
            { 'userDetails.email': { $regex: term, $options: 'i' } },
          ],
        }));

        if (!isNaN(Number(searchStr))) {
          searchConditions.push({ hours: Number(searchStr) });
        }

        searchConditions.push(...dateConditions);

        pipeline.push({ $match: { $or: searchConditions } });
      }
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const requests = await PTORequest.aggregate(pipeline);

    return requests.map((r: any) => ({
      ...r,
      userId: {
        _id: r.userDetails._id,
        firstName: r.userDetails.firstName,
        lastName: r.userDetails.lastName,
        email: r.userDetails.email,
      },
      userName: `${r.userDetails.firstName} ${r.userDetails.lastName}`,
      userEmail: r.userDetails.email,
    }));
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to fetch all PTO requests');
  }
}

export async function getMonthlyRequestCountForUser(userId: string, year: number, month: number) {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw createError(400, 'Invalid year or month');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const requests = await PTORequest.find({
      userId: new Types.ObjectId(userId),
      status: 'approved',
      date: { $gte: startDate, $lte: endDate },
    });

    const totalHours = requests.reduce((total, r) => total + r.hours, 0);
    return { count: totalHours };
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to get monthly PTO count');
  }
}

export async function getYearlyPTOHoursForUser(userId: string, year: number) {
  try {
    if (!isValidObjectId(userId)) {
      throw createError(400, 'Invalid userId');
    }
    if (isNaN(year)) {
      throw createError(400, 'Invalid year');
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const requests = await PTORequest.find({
      userId: new Types.ObjectId(userId),
      status: 'approved',
      date: { $gte: startDate, $lte: endDate },
    });

    const totalHoursUsed = requests.reduce((total, r) => total + r.hours, 0);
    const yearlyLimit = MONTHLY_PTO_HOURS * 12;
    const remainingHours = yearlyLimit - totalHoursUsed;

    return { totalHoursUsed, yearlyLimit, remainingHours };
  } catch (err) {
    if ((createError as any).isHttpError?.(err)) throw err;
    throw createError(500, (err as Error).message || 'Failed to get yearly PTO hours');
  }
}

function createDateSearchConditions(searchStr: string) {
  const monthMap: { [key: string]: string } = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
  };

  const searchLower = searchStr.toLowerCase();
  const conditions: any[] = [];

  for (const [monthName, monthNum] of Object.entries(monthMap)) {
    if (monthName.includes(searchLower) || searchLower.includes(monthName)) {
      conditions.push({
        $expr: {
          $eq: [{ $month: '$date' }, parseInt(monthNum, 10)],
        },
      });
    }
  }

  conditions.push({
    $expr: {
      $regexMatch: {
        input: { $dateToString: { date: '$date', format: '%Y-%m-%d' } },
        regex: searchStr,
        options: 'i',
      },
    },
  });

  return conditions;
}