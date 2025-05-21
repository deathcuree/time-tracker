import { Request, Response } from 'express';
import PTORequest from '../models/PTORequest.js';
import User from '../models/User.js';
import { IPTORequest, IPTORequestBody } from '../types/models.js';

const PTO_LIMIT_PER_MONTH = 2;

export const createRequest = async (req: Request<{}, {}, IPTORequestBody>, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, reason } = req.body;
    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Validate dates are in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const requestStartDate = new Date(startDate);
    const requestEndDate = new Date(endDate);

    if (requestStartDate < now) {
      res.status(400).json({ message: 'Start date must be in the future' });
      return;
    }

    if (requestEndDate < requestStartDate) {
      res.status(400).json({ message: 'End date must be after start date' });
      return;
    }

    // Check PTO limit for the month of the start date
    const startMonth = requestStartDate.getMonth();
    const startYear = requestStartDate.getFullYear();
    
    const existingRequestsThisMonth = await PTORequest.find({
      userId: user._id,
      status: { $ne: 'denied' }, // Exclude denied requests
      $expr: {
        $and: [
          { $eq: [{ $month: '$startDate' }, startMonth + 1] }, // MongoDB months are 1-indexed
          { $eq: [{ $year: '$startDate' }, startYear] }
        ]
      }
    });

    if (existingRequestsThisMonth.length >= PTO_LIMIT_PER_MONTH) {
      res.status(400).json({ 
        message: `You have already reached the limit of ${PTO_LIMIT_PER_MONTH} PTO requests for ${new Date(startYear, startMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}` 
      });
      return;
    }

    const ptoRequest = new PTORequest({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      startDate: requestStartDate,
      endDate: requestEndDate,
      reason
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
    const requests = await PTORequest.find({ userId: req.user!._id })
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

    const requests = await PTORequest.find()
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 }) as IPTORequest[];

    const transformedRequests = requests.map(request => ({
      ...request.toObject(),
      userName: request.userId ? `${(request.userId as any).firstName} ${(request.userId as any).lastName}` : 'Unknown User',
      userEmail: (request.userId as any).email || 'No Email'
    }));

    res.json(transformedRequests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}; 