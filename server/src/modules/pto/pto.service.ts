import mongoose from 'mongoose';
import PTORequest from './pto.model.js';
import User from '../user/user.model.js';
import { IPTORequest, IPTORequestBody } from '../../types/models.js';

const MONTHLY_PTO_HOURS = 16;

const createDateSearchConditions = (searchStr: string) => {
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
          $eq: [{ $month: '$date' }, parseInt(monthNum)],
        },
      });
    }
  }

  conditions.push({
    $expr: {
      $regexMatch: {
        input: {
          $dateToString: {
            date: '$date',
            format: '%Y-%m-%d',
          },
        },
        regex: searchStr,
        options: 'i',
      },
    },
  });

  return conditions;
};

export const PTOService = {
  createRequest: async (userId: string, body: IPTORequestBody): Promise<IPTORequest> => {
    const { date, hours, reason } = body;
    const user = await User.findById(userId);

    if (!user) {
      const err: any = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const requestDate = new Date(date);

    if (requestDate < now) {
      const err: any = new Error('Request date must be in the future');
      err.status = 400;
      throw err;
    }

    if (hours < 1 || hours > 8) {
      const err: any = new Error('PTO hours must be between 1 and 8');
      err.status = 400;
      throw err;
    }

    const requestMonth = requestDate.getMonth();
    const requestYear = requestDate.getFullYear();

    const existingRequestsThisMonth = await PTORequest.find({
      userId: user._id,
      status: 'approved',
      $expr: {
        $and: [
          { $eq: [{ $month: '$date' }, requestMonth + 1] },
          { $eq: [{ $year: '$date' }, requestYear] },
        ],
      },
    });

    const hoursUsedThisMonth = existingRequestsThisMonth.reduce(
      (total, request) => total + request.hours,
      0,
    );

    if (hoursUsedThisMonth + hours > MONTHLY_PTO_HOURS) {
      const remaining = MONTHLY_PTO_HOURS - hoursUsedThisMonth;
      const err: any = new Error(
        `You have ${remaining} PTO hours remaining for ${new Date(
          requestYear,
          requestMonth,
        ).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      );
      err.status = 400;
      throw err;
    }

    const ptoRequest = new PTORequest({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      date: requestDate,
      hours,
      reason,
      expiryYear: requestYear,
    }) as IPTORequest;

    await ptoRequest.save();
    return ptoRequest;
  },

  getUserRequests: async (userId: string, search?: string) => {
    let query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (search) {
      const searchStr = search.toLowerCase();
      const dateConditions = createDateSearchConditions(searchStr);

      query = {
        $and: [
          { userId: new mongoose.Types.ObjectId(userId) },
          {
            $or: [
              { reason: { $regex: searchStr, $options: 'i' } },
              { status: { $regex: searchStr, $options: 'i' } },
              { hours: isNaN(Number(search)) ? null : Number(search) },
              ...dateConditions,
            ].filter((c) => c !== null),
          },
        ],
      };
    }

    const requests = (await PTORequest.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })) as IPTORequest[];

    const transformed = requests.map((request) => ({
      ...request.toObject(),
      userName: request.userId
        ? `${(request.userId as any).firstName} ${(request.userId as any).lastName}`
        : 'Unknown User',
      userEmail: (request.userId as any).email || 'No Email',
    }));

    return transformed;
  },

  updateRequestStatus: async (
    requestId: string,
    approverId: string,
    status: 'approved' | 'denied',
  ) => {
    if (!['approved', 'denied'].includes(status)) {
      const err: any = new Error('Invalid status');
      err.status = 400;
      throw err;
    }

    const ptoRequest = (await PTORequest.findById(requestId).populate(
      'userId',
      'firstName lastName email',
    )) as IPTORequest | null;

    if (!ptoRequest) {
      const err: any = new Error('PTO request not found');
      err.status = 404;
      throw err;
    }

    ptoRequest.status = status;
    ptoRequest.approvedBy = new mongoose.Types.ObjectId(approverId);
    ptoRequest.approvalDate = new Date();

    if (ptoRequest.userId) {
      ptoRequest.userName = `${(ptoRequest.userId as any).firstName} ${
        (ptoRequest.userId as any).lastName
      }`;
      ptoRequest.userEmail = (ptoRequest.userId as any).email;
    }

    await ptoRequest.save();

    const updated = await PTORequest.findById(requestId)
      .populate('userId', 'firstName lastName email')
      .exec();

    return updated;
  },

  getAllRequests: async (search?: string) => {
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
      const searchTerms = searchStr.split(/\s+/).filter((term) => term.length > 0);
      const dateConditions = createDateSearchConditions(searchStr);

      if (searchTerms.length > 0) {
        type SearchCondition = {
          $or?: Array<{ [key: string]: any }>;
          hours?: number;
          $expr?: any;
        };

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

        pipeline.push({
          $match: {
            $or: searchConditions,
          },
        });
      }
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const requests = await PTORequest.aggregate(pipeline);

    const transformed = requests.map((request: any) => ({
      ...request,
      userId: {
        _id: request.userDetails._id,
        firstName: request.userDetails.firstName,
        lastName: request.userDetails.lastName,
        email: request.userDetails.email,
      },
      userName: `${request.userDetails.firstName} ${request.userDetails.lastName}`,
      userEmail: request.userDetails.email,
    }));

    return transformed;
  },

  getMonthlyRequestCount: async (userId: string, year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const requests = await PTORequest.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'approved',
      date: { $gte: startDate, $lte: endDate },
    });

    const totalHours = requests.reduce((total, request) => total + request.hours, 0);
    return { count: totalHours };
  },

  getYearlyPTOHours: async (userId: string, year: number) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const requests = await PTORequest.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'approved',
      date: { $gte: startDate, $lte: endDate },
    });

    const totalHoursUsed = requests.reduce((total, request) => total + request.hours, 0);
    const yearlyLimit = MONTHLY_PTO_HOURS * 12;
    const remainingHours = yearlyLimit - totalHoursUsed;

    return {
      totalHoursUsed,
      yearlyLimit,
      remainingHours,
    };
  },
};
