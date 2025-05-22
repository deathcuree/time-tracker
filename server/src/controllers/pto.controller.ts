import { Request, Response } from 'express';
import PTORequest from '../models/PTORequest.js';
import User from '../models/User.js';
import { IPTORequest, IPTORequestBody } from '../types/models.js';
import { format } from 'date-fns';

const MONTHLY_PTO_HOURS = 16; // 16 hours per month

// Helper function to create date search conditions
const createDateSearchConditions = (searchStr: string) => {
  // Convert month names to numbers (1-12)
  const monthMap: { [key: string]: string } = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };

  const searchLower = searchStr.toLowerCase();
  const conditions = [];

  // Check if search string matches a month name
  for (const [monthName, monthNum] of Object.entries(monthMap)) {
    if (monthName.includes(searchLower) || searchLower.includes(monthName)) {
      conditions.push({
        $expr: {
          $eq: [
            { $month: '$date' },
            parseInt(monthNum)
          ]
        }
      });
    }
  }

  // Add condition for searching by formatted date string
  conditions.push({
    $expr: {
      $regexMatch: {
        input: {
          $dateToString: {
            date: '$date',
            format: '%Y-%m-%d'
          }
        },
        regex: searchStr,
        options: 'i'
      }
    }
  });

  return conditions;
};

export const createRequest = async (req: Request<{}, {}, IPTORequestBody>, res: Response): Promise<void> => {
  try {
    const { date, hours, reason } = req.body;
    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Validate date is in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const requestDate = new Date(date);

    if (requestDate < now) {
      res.status(400).json({ message: 'Request date must be in the future' });
      return;
    }

    // Validate hours (1-8 hours per day)
    if (hours < 1 || hours > 8) {
      res.status(400).json({ message: 'PTO hours must be between 1 and 8' });
      return;
    }

    // Check total hours used in the month
    const requestMonth = requestDate.getMonth();
    const requestYear = requestDate.getFullYear();
    
    const existingRequestsThisMonth = await PTORequest.find({
      userId: user._id,
      status: 'approved',
      $expr: {
        $and: [
          { $eq: [{ $month: '$date' }, requestMonth + 1] }, // MongoDB months are 1-indexed
          { $eq: [{ $year: '$date' }, requestYear] }
        ]
      }
    });

    const hoursUsedThisMonth = existingRequestsThisMonth.reduce((total, request) => total + request.hours, 0);

    if (hoursUsedThisMonth + hours > MONTHLY_PTO_HOURS) {
      res.status(400).json({ 
        message: `You have ${MONTHLY_PTO_HOURS - hoursUsedThisMonth} PTO hours remaining for ${new Date(requestYear, requestMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}` 
      });
      return;
    }

    const ptoRequest = new PTORequest({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      date: requestDate,
      hours,
      reason,
      expiryYear: requestYear
    }) as IPTORequest;

    await ptoRequest.save();
    res.status(201).json(ptoRequest);
  } catch (error) {
    console.error('Error creating PTO request:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getUserRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query: any = { userId: req.user!._id };

    if (search) {
      const searchStr = (search as string).toLowerCase();
      const dateConditions = createDateSearchConditions(searchStr);

      query = {
        $and: [
          { userId: req.user!._id },
          {
            $or: [
              { reason: { $regex: searchStr, $options: 'i' } },
              { status: { $regex: searchStr, $options: 'i' } },
              { hours: isNaN(Number(search)) ? null : Number(search) },
              ...dateConditions
            ].filter(condition => condition !== null)
          }
        ]
      };
    }

    const requests = await PTORequest.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 }) as IPTORequest[];
      
    const transformedRequests = requests.map(request => ({
      ...request.toObject(),
      userName: request.userId ? `${(request.userId as any).firstName} ${(request.userId as any).lastName}` : 'Unknown User',
      userEmail: (request.userId as any).email || 'No Email'
    }));

    res.json(transformedRequests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
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
  try {
    const { status } = req.body;
    const { requestId } = req.params;

    if (!['approved', 'denied'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const ptoRequest = await PTORequest.findById(requestId)
      .populate('userId', 'firstName lastName email') as IPTORequest | null;

    if (!ptoRequest) {
      res.status(404).json({ message: 'PTO request not found' });
      return;
    }

    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    ptoRequest.status = status;
    ptoRequest.approvedBy = req.user!._id;
    ptoRequest.approvalDate = new Date();
    
    if (ptoRequest.userId) {
      ptoRequest.userName = `${(ptoRequest.userId as any).firstName} ${(ptoRequest.userId as any).lastName}`;
      ptoRequest.userEmail = (ptoRequest.userId as any).email;
    }

    await ptoRequest.save();
    
    const updatedRequest = await PTORequest.findById(requestId)
      .populate('userId', 'firstName lastName email')
      .exec();
      
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating PTO request:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const { search } = req.query;
    let pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      }
    ];

    if (search) {
      const searchStr = (search as string).toLowerCase();
      const searchTerms = searchStr.split(/\s+/).filter(term => term.length > 0);
      const dateConditions = createDateSearchConditions(searchStr);

      if (searchTerms.length > 0) {
        type SearchCondition = {
          $or?: Array<{ [key: string]: any }>;
          hours?: number;
          $expr?: any;
        };
        
        const searchConditions: SearchCondition[] = searchTerms.map(term => ({
          $or: [
            { reason: { $regex: term, $options: 'i' } },
            { status: { $regex: term, $options: 'i' } },
            { 'userDetails.firstName': { $regex: term, $options: 'i' } },
            { 'userDetails.lastName': { $regex: term, $options: 'i' } },
            { 'userDetails.email': { $regex: term, $options: 'i' } }
          ]
        }));

        // Add number search only for the full search string (not split terms)
        if (!isNaN(Number(searchStr))) {
          searchConditions.push({ hours: Number(searchStr) });
        }

        // Add date conditions
        searchConditions.push(...dateConditions);

        pipeline.push({
          $match: {
            $or: searchConditions
          }
        });
      }
    }

    pipeline.push({
      $sort: { createdAt: -1 }
    });

    const requests = await PTORequest.aggregate(pipeline);

    const transformedRequests = requests.map(request => ({
      ...request,
      userId: {
        _id: request.userDetails._id,
        firstName: request.userDetails.firstName,
        lastName: request.userDetails.lastName,
        email: request.userDetails.email
      },
      userName: `${request.userDetails.firstName} ${request.userDetails.lastName}`,
      userEmail: request.userDetails.email
    }));

    res.json(transformedRequests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getMonthlyRequestCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      res.status(400).json({ message: 'Invalid year or month' });
      return;
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month

    const requests = await PTORequest.find({
      userId: req.user!._id,
      status: 'approved',
      date: { $gte: startDate, $lte: endDate }
    });

    const totalHours = requests.reduce((total, request) => total + request.hours, 0);

    res.json({ count: totalHours });
  } catch (error) {
    console.error('Error getting monthly PTO request count:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getYearlyPTOHours = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.params.year);

    if (isNaN(year)) {
      res.status(400).json({ message: 'Invalid year' });
      return;
    }

    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st

    const requests = await PTORequest.find({
      userId: req.user!._id,
      status: 'approved',
      date: { $gte: startDate, $lte: endDate }
    });

    const totalHoursUsed = requests.reduce((total, request) => total + request.hours, 0);
    const yearlyLimit = MONTHLY_PTO_HOURS * 12;
    const remainingHours = yearlyLimit - totalHoursUsed;

    res.json({
      totalHoursUsed,
      yearlyLimit,
      remainingHours
    });
  } catch (error) {
    console.error('Error getting yearly PTO hours:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}; 