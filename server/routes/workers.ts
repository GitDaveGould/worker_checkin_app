import express from 'express';
import { WorkerModel } from '../models/Worker';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateWorkerData, validatePagination, validateIdParam, validateSearchQuery } from '../middleware/validation';
import { asyncHandler, sendSuccess, sendError } from '../middleware/errorHandler';

const router = express.Router();

// Real-time worker search endpoint (public - for check-in interface)
router.get('/search',
  validateSearchQuery,
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      sendSuccess(res, []);
      return;
    }

    // Minimum 3 characters for search (as per requirements)
    if (q.length < 3) {
      sendSuccess(res, []);
      return;
    }

    const startTime = Date.now();

    try {
      // Perform database search directly (bypassing cache for debugging)
      const workers = await WorkerModel.search(q, 10); // Limit to 10 results for performance
      
      // Return only essential fields for check-in interface
      const searchResults = workers.map((worker: any) => ({
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        phone: worker.phone
      }));

      // Record search performance
      const duration = Date.now() - startTime;
      console.log(`Search completed in ${duration}ms for query: "${q}"`);

      sendSuccess(res, {
        results: searchResults,
        totalCount: searchResults.length,
        searchTerm: q,
        cached: false
      });
    } catch (error) {
      console.error('Worker search error:', error);
      sendError(res, 'Search failed', 500, 'SEARCH_ERROR');
    }
  })
);

// Get all workers (admin only) with pagination and filtering
router.get('/',
  authenticateToken,
  requireAdmin,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, city, state, sortBy, sortOrder } = req.query;

    const filters = {
      search: search as string,
      city: city as string,
      state: state as string
    };

    const options = {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as any,
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC'
    };

    const result = await WorkerModel.findAll(filters, options);
    sendSuccess(res, result);
  })
);

// Get worker by ID
router.get('/:id',
  optionalAuth, // Can be accessed by admin or for check-in verification
  validateIdParam(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const worker = await WorkerModel.findById(Number(id));

    if (!worker) {
      sendError(res, 'Worker not found', 404, 'WORKER_NOT_FOUND');
      return;
    }

    // If not admin, return limited info
    if (!req.user || req.user.role !== 'admin') {
      const limitedInfo = {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        phone: worker.phone
      };
      sendSuccess(res, limitedInfo);
    } else {
      sendSuccess(res, worker);
    }
  })
);

// Create new worker (public - for registration during check-in)
router.post('/',
  validateWorkerData,
  asyncHandler(async (req, res) => {
    const workerData = req.body;

    // Check for duplicate email
    const existingEmail = await WorkerModel.findByEmail(workerData.email);
    if (existingEmail) {
      sendError(res, 'Email address is already registered', 409, 'DUPLICATE_EMAIL', 'email');
      return;
    }

    // Check for duplicate phone
    const existingPhone = await WorkerModel.findByPhone(workerData.phone);
    if (existingPhone) {
      sendError(res, 'Phone number is already registered', 409, 'DUPLICATE_PHONE', 'phone');
      return;
    }

    try {
      const worker = await WorkerModel.create(workerData);
      sendSuccess(res, worker, 201);
    } catch (error) {
      console.error('Worker creation error:', error);
      throw error; // Let error handler deal with it
    }
  })
);

// Update worker (admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  validateWorkerData,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if worker exists
    const existingWorker = await WorkerModel.findById(Number(id));
    if (!existingWorker) {
      sendError(res, 'Worker not found', 404, 'WORKER_NOT_FOUND');
      return;
    }

    // Check for duplicate email (excluding current worker)
    if (updateData.email && updateData.email !== existingWorker.email) {
      const emailExists = await WorkerModel.emailExists(updateData.email, Number(id));
      if (emailExists) {
        sendError(res, 'Email address is already registered', 409, 'DUPLICATE_EMAIL', 'email');
        return;
      }
    }

    // Check for duplicate phone (excluding current worker)
    if (updateData.phone && updateData.phone !== existingWorker.phone) {
      const phoneExists = await WorkerModel.phoneExists(updateData.phone, Number(id));
      if (phoneExists) {
        sendError(res, 'Phone number is already registered', 409, 'DUPLICATE_PHONE', 'phone');
        return;
      }
    }

    const updatedWorker = await WorkerModel.update(Number(id), updateData);
    if (!updatedWorker) {
      sendError(res, 'Failed to update worker', 500, 'UPDATE_FAILED');
      return;
    }

    sendSuccess(res, updatedWorker);
  })
);

// Delete worker (admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if worker exists
    const existingWorker = await WorkerModel.findById(Number(id));
    if (!existingWorker) {
      sendError(res, 'Worker not found', 404, 'WORKER_NOT_FOUND');
      return;
    }

    const deleted = await WorkerModel.delete(Number(id));
    if (!deleted) {
      sendError(res, 'Failed to delete worker', 500, 'DELETE_FAILED');
      return;
    }

    sendSuccess(res, { message: 'Worker deleted successfully' });
  })
);

// Check email availability (for registration validation)
router.post('/check-email',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      sendError(res, 'Email is required', 400, 'MISSING_EMAIL');
      return;
    }

    const exists = await WorkerModel.emailExists(email);
    sendSuccess(res, { 
      available: !exists,
      email,
      message: exists ? 'Email is already registered' : 'Email is available'
    });
  })
);

// Check phone availability (for registration validation)
router.post('/check-phone',
  asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
      sendError(res, 'Phone number is required', 400, 'MISSING_PHONE');
      return;
    }

    const exists = await WorkerModel.phoneExists(phone);
    sendSuccess(res, { 
      available: !exists,
      phone,
      message: exists ? 'Phone number is already registered' : 'Phone number is available'
    });
  })
);

// Get worker statistics (admin only)
router.get('/stats/overview',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const stats = await WorkerModel.getStats();
    sendSuccess(res, stats);
  })
);

// Bulk worker operations (admin only)
router.post('/bulk/delete',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { workerIds } = req.body;

    if (!Array.isArray(workerIds) || workerIds.length === 0) {
      sendError(res, 'Worker IDs array is required', 400, 'MISSING_WORKER_IDS');
      return;
    }

    // Validate all IDs are numbers
    const invalidIds = workerIds.filter(id => !Number.isInteger(Number(id)));
    if (invalidIds.length > 0) {
      sendError(res, 'All worker IDs must be valid numbers', 400, 'INVALID_WORKER_IDS');
      return;
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const id of workerIds) {
      try {
        const deleted = await WorkerModel.delete(Number(id));
        if (deleted) {
          deletedCount++;
        } else {
          errors.push(`Worker ${id} not found`);
        }
      } catch (error) {
        errors.push(`Failed to delete worker ${id}: ${error}`);
      }
    }

    sendSuccess(res, {
      deletedCount,
      totalRequested: workerIds.length,
      errors: errors.length > 0 ? errors : undefined
    });
  })
);

export default router;