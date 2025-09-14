import express, { Request, Response } from 'express';
import { CheckInModel } from '../models/CheckIn';
import { WorkerModel } from '../models/Worker';
import { EventModel } from '../models/Event';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateCheckInData, validatePagination, validateIdParam } from '../middleware/validation';
import { asyncHandler, sendSuccess, sendError } from '../middleware/errorHandler';

const router = express.Router();

// Create new check-in (public - for tablet interface)
router.post('/',
  validateCheckInData,
  asyncHandler(async (req: Request, res: Response) => {
    const checkInData = req.body;

    // Verify worker exists
    const worker = await WorkerModel.findById(checkInData.workerId);
    if (!worker) {
      sendError(res, 'Worker not found', 404, 'WORKER_NOT_FOUND', 'workerId');
      return;
    }

    // Verify event exists and is active
    const event = await EventModel.findById(checkInData.eventId);
    if (!event) {
      sendError(res, 'Event not found', 404, 'EVENT_NOT_FOUND', 'eventId');
      return;
    }

    // Check if event is active (either within date range OR manually set as active)
    const currentDate = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const isWithinDateRange = currentDate >= startDate && currentDate <= endDate;
    const isManuallyActive = event.isActive;
    
    if (!isWithinDateRange && !isManuallyActive) {
      sendError(res, 'Event is not currently active', 400, 'EVENT_NOT_ACTIVE', 'eventId');
      return;
    }

    // Check for duplicate check-in (one check-in per worker per event)
    const existingCheckIn = await CheckInModel.findByWorkerAndEvent(
      checkInData.workerId, 
      checkInData.eventId
    );
    
    if (existingCheckIn) {
      sendError(res, 'Worker has already checked in for this event', 409, 'DUPLICATE_CHECKIN');
      return;
    }

    // Validate terms acceptance
    if (!checkInData.termsAccepted) {
      sendError(res, 'Terms and conditions must be accepted', 400, 'TERMS_NOT_ACCEPTED', 'termsAccepted');
      return;
    }

    try {
      // Create check-in with automatic timestamp
      const checkIn = await CheckInModel.create(checkInData);
      
      // Return success with check-in details
      sendSuccess(res, {
        checkIn,
        worker: {
          id: worker.id,
          firstName: worker.firstName,
          lastName: worker.lastName,
          email: worker.email
        },
        event: {
          id: event.id,
          name: event.name,
          location: event.location
        }
      }, 201);
    } catch (error) {
      console.error('Check-in creation error:', error);
      throw error; // Let error handler deal with it
    }
  })
);

// Get all check-ins (admin only) with pagination and filtering
router.get('/',
  authenticateToken,
  requireAdmin,
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 20, 
      workerId, 
      eventId, 
      startDate, 
      endDate,
      question1Response,
      question2Response,
      termsAccepted,
      sortBy,
      sortOrder 
    } = req.query;

    const filters = {
      workerId: workerId ? Number(workerId) : undefined,
      eventId: eventId ? Number(eventId) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      question1Response: question1Response as string,
      question2Response: question2Response === 'true' ? true : question2Response === 'false' ? false : undefined,
      termsAccepted: termsAccepted === 'true' ? true : termsAccepted === 'false' ? false : undefined
    };

    const options = {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as any,
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC'
    };

    const result = await CheckInModel.findWithDetails(filters, options);
    sendSuccess(res, result);
  })
);

// Check if worker has already checked in for event (public - for duplicate prevention)
router.get('/check/:workerId/:eventId',
  validateIdParam('workerId'),
  validateIdParam('eventId'),
  asyncHandler(async (req: Request, res: Response) => {
    const { workerId, eventId } = req.params;

    const hasCheckedIn = await CheckInModel.hasWorkerCheckedIn(
      Number(workerId), 
      Number(eventId)
    );

    sendSuccess(res, {
      hasCheckedIn,
      workerId: Number(workerId),
      eventId: Number(eventId)
    });
  })
);

// Get check-in by ID (admin only)
router.get('/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const checkIn = await CheckInModel.findById(Number(id));

    if (!checkIn) {
      sendError(res, 'Check-in not found', 404, 'CHECKIN_NOT_FOUND');
      return;
    }

    sendSuccess(res, checkIn);
  })
);

// Update check-in (admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if check-in exists
    const existingCheckIn = await CheckInModel.findById(Number(id));
    if (!existingCheckIn) {
      sendError(res, 'Check-in not found', 404, 'CHECKIN_NOT_FOUND');
      return;
    }

    // Validate update data
    const allowedFields = [
      'question1Response',
      'question2Response', 
      'question3Response1',
      'question3Response2',
      'termsAccepted'
    ];

    const filteredUpdateData: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    if (Object.keys(filteredUpdateData).length === 0) {
      sendError(res, 'No valid fields to update', 400, 'NO_VALID_FIELDS');
      return;
    }

    // Validate field types
    if (filteredUpdateData.question2Response !== undefined && 
        typeof filteredUpdateData.question2Response !== 'boolean') {
      sendError(res, 'Question 2 response must be true or false', 400, 'INVALID_QUESTION2_TYPE');
      return;
    }

    if (filteredUpdateData.termsAccepted !== undefined && 
        typeof filteredUpdateData.termsAccepted !== 'boolean') {
      sendError(res, 'Terms accepted must be true or false', 400, 'INVALID_TERMS_TYPE');
      return;
    }

    const updatedCheckIn = await CheckInModel.update(Number(id), filteredUpdateData);
    if (!updatedCheckIn) {
      sendError(res, 'Failed to update check-in', 500, 'UPDATE_FAILED');
      return;
    }

    sendSuccess(res, updatedCheckIn);
  })
);

// Delete check-in (admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if check-in exists
    const existingCheckIn = await CheckInModel.findById(Number(id));
    if (!existingCheckIn) {
      sendError(res, 'Check-in not found', 404, 'CHECKIN_NOT_FOUND');
      return;
    }

    const deleted = await CheckInModel.delete(Number(id));
    if (!deleted) {
      sendError(res, 'Failed to delete check-in', 500, 'DELETE_FAILED');
      return;
    }

    sendSuccess(res, { message: 'Check-in deleted successfully' });
  })
);

// Get check-in statistics overview (admin only)
router.get('/stats/overview',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await CheckInModel.getStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Error fetching check-in stats:', error);
      sendError(res, 'Failed to fetch statistics', 500, 'STATS_ERROR');
    }
  })
);

// Get recent check-ins (admin only)
router.get('/recent/:limit',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.params;
    const limitNum = parseInt(limit);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      sendError(res, 'Limit must be a number between 1 and 100', 400, 'INVALID_LIMIT');
      return;
    }

    try {
      const recentCheckIns = await CheckInModel.getRecentCheckIns(limitNum);
      sendSuccess(res, {
        checkIns: recentCheckIns,
        count: recentCheckIns.length
      });
    } catch (error) {
      console.error('Error fetching recent check-ins:', error);
      sendError(res, 'Failed to fetch recent check-ins', 500, 'RECENT_CHECKINS_ERROR');
    }
  })
);

export default router;