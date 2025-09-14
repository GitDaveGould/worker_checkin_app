import express from 'express';
import { EventModel } from '../models/Event';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateEventData, validatePagination, validateIdParam } from '../middleware/validation';
import { asyncHandler, sendSuccess, sendError } from '../middleware/errorHandler';

const router = express.Router();

// Get active event (public - for check-in interface)
router.get('/active',
  asyncHandler(async (req, res) => {
    try {
      const activeEvent = await EventModel.getActiveEvent();
      
      if (!activeEvent) {
        sendSuccess(res, null);
        return;
      }

      sendSuccess(res, activeEvent);
    } catch (error) {
      console.error('Get active event error:', error);
      sendError(res, 'Failed to get active event', 500, 'ACTIVE_EVENT_ERROR');
    }
  })
);

// Get all events with pagination and filtering (admin only)
router.get('/',
  authenticateToken,
  requireAdmin,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, location, isActive, startDate, endDate, sortBy, sortOrder } = req.query;

    const filters = {
      search: search as string,
      location: location as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    };

    const options = {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as any,
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC'
    };

    const result = await EventModel.findAll(filters, options);
    sendSuccess(res, result);
  })
);

// Get event by ID
router.get('/:id',
  optionalAuth, // Can be accessed by admin or for check-in verification
  validateIdParam(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await EventModel.findById(Number(id));

    if (!event) {
      sendError(res, 'Event not found', 404, 'EVENT_NOT_FOUND');
      return;
    }

    sendSuccess(res, event);
  })
);

// Create new event (admin only)
router.post('/',
  authenticateToken,
  requireAdmin,
  validateEventData,
  asyncHandler(async (req, res) => {
    const eventData = req.body;

    // Validate date logic
    if (!EventModel.validateEventDates(eventData.startDate, eventData.endDate)) {
      sendError(res, 'End date must be after start date', 400, 'INVALID_DATE_RANGE');
      return;
    }

    // Check for overlapping events (optional warning)
    const overlapping = await EventModel.findOverlappingEvents(
      eventData.startDate,
      eventData.endDate
    );

    try {
      const event = await EventModel.create(eventData);
      
      const response: any = { event };
      if (overlapping.length > 0) {
        response.warning = {
          message: `This event overlaps with ${overlapping.length} existing event(s)`,
          overlappingEvents: overlapping.map(e => ({ id: e.id, name: e.name }))
        };
      }

      sendSuccess(res, response, 201);
    } catch (error) {
      console.error('Event creation error:', error);
      throw error;
    }
  })
);

// Update event (admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  validateEventData,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if event exists
    const existingEvent = await EventModel.findById(Number(id));
    if (!existingEvent) {
      sendError(res, 'Event not found', 404, 'EVENT_NOT_FOUND');
      return;
    }

    // Validate date logic
    if (!EventModel.validateEventDates(updateData.startDate, updateData.endDate)) {
      sendError(res, 'End date must be after start date', 400, 'INVALID_DATE_RANGE');
      return;
    }

    // Check for overlapping events (excluding current event)
    const overlapping = await EventModel.findOverlappingEvents(
      updateData.startDate,
      updateData.endDate,
      Number(id)
    );

    const updatedEvent = await EventModel.update(Number(id), updateData);
    if (!updatedEvent) {
      sendError(res, 'Failed to update event', 500, 'UPDATE_FAILED');
      return;
    }

    const response: any = { event: updatedEvent };
    if (overlapping.length > 0) {
      response.warning = {
        message: `This event overlaps with ${overlapping.length} existing event(s)`,
        overlappingEvents: overlapping.map(e => ({ id: e.id, name: e.name }))
      };
    }

    sendSuccess(res, response);
  })
);

// Delete event (admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if event exists
    const existingEvent = await EventModel.findById(Number(id));
    if (!existingEvent) {
      sendError(res, 'Event not found', 404, 'EVENT_NOT_FOUND');
      return;
    }

    const deleted = await EventModel.delete(Number(id));
    if (!deleted) {
      sendError(res, 'Failed to delete event', 500, 'DELETE_FAILED');
      return;
    }

    sendSuccess(res, { message: 'Event deleted successfully' });
  })
);

// Set event as active (admin only) - "event of the week" override
router.post('/:id/activate',
  authenticateToken,
  requireAdmin,
  validateIdParam(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if event exists
    const existingEvent = await EventModel.findById(Number(id));
    if (!existingEvent) {
      sendError(res, 'Event not found', 404, 'EVENT_NOT_FOUND');
      return;
    }

    const activeEvent = await EventModel.setActive(Number(id));
    if (!activeEvent) {
      sendError(res, 'Failed to activate event', 500, 'ACTIVATION_FAILED');
      return;
    }

    sendSuccess(res, {
      message: 'Event activated successfully',
      event: activeEvent
    });
  })
);

// Deactivate all events (admin only)
router.post('/deactivate-all',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await EventModel.deactivateAll();
    sendSuccess(res, { message: 'All events deactivated successfully' });
  })
);

// Get current events (events within date range)
router.get('/status/current',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const currentEvents = await EventModel.getCurrentEvents();
    sendSuccess(res, {
      currentEvents,
      count: currentEvents.length
    });
  })
);

// Get upcoming events
router.get('/status/upcoming',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    const upcomingEvents = await EventModel.getUpcomingEvents(Number(limit));
    sendSuccess(res, {
      upcomingEvents,
      count: upcomingEvents.length
    });
  })
);

// Get past events
router.get('/status/past',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    const pastEvents = await EventModel.getPastEvents(Number(limit));
    sendSuccess(res, {
      pastEvents,
      count: pastEvents.length
    });
  })
);

// Get event statistics (admin only)
router.get('/stats/overview',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const stats = await EventModel.getStats();
    sendSuccess(res, stats);
  })
);

// JSON import functionality for bulk event creation (admin only)
router.post('/import',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { events, validateOnly = false } = req.body;

    if (!Array.isArray(events)) {
      sendError(res, 'Events must be an array', 400, 'INVALID_EVENTS_FORMAT');
      return;
    }

    if (events.length === 0) {
      sendError(res, 'Events array cannot be empty', 400, 'EMPTY_EVENTS_ARRAY');
      return;
    }

    if (events.length > 100) {
      sendError(res, 'Cannot import more than 100 events at once', 400, 'TOO_MANY_EVENTS');
      return;
    }

    // Validate each event
    const validationErrors: Array<{ index: number; field: string; message: string }> = [];
    const validEvents: any[] = [];

    events.forEach((event, index) => {
      const errors: Array<{ field: string; message: string }> = [];

      // Required field validation
      if (!event.name?.trim()) errors.push({ field: 'name', message: 'Event name is required' });
      if (!event.startDate) errors.push({ field: 'startDate', message: 'Start date is required' });
      if (!event.endDate) errors.push({ field: 'endDate', message: 'End date is required' });
      if (!event.location?.trim()) errors.push({ field: 'location', message: 'Location is required' });

      // Date validation
      if (event.startDate && event.endDate) {
        if (!EventModel.validateEventDates(event.startDate, event.endDate)) {
          errors.push({ field: 'endDate', message: 'End date must be after start date' });
        }
      }

      // Length validation
      if (event.name && event.name.length > 255) {
        errors.push({ field: 'name', message: 'Event name must be less than 255 characters' });
      }
      if (event.location && event.location.length > 255) {
        errors.push({ field: 'location', message: 'Location must be less than 255 characters' });
      }

      if (errors.length > 0) {
        errors.forEach(error => {
          validationErrors.push({ index, ...error });
        });
      } else {
        validEvents.push({
          name: event.name.trim(),
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location.trim(),
          isActive: Boolean(event.isActive)
        });
      }
    });

    if (validationErrors.length > 0) {
      sendError(res, 'Validation failed for some events', 400, 'VALIDATION_ERRORS', undefined);
      // Include validation errors in response
      res.json({
        success: false,
        error: {
          code: 'VALIDATION_ERRORS',
          message: 'Validation failed for some events',
          validationErrors
        }
      });
      return;
    }

    // If validateOnly is true, just return validation success
    if (validateOnly) {
      sendSuccess(res, {
        message: 'All events are valid',
        validEventCount: validEvents.length,
        events: validEvents
      });
      return;
    }

    try {
      // Check for overlapping events
      const overlappingWarnings: Array<{ eventIndex: number; overlappingWith: any[] }> = [];
      
      for (let i = 0; i < validEvents.length; i++) {
        const event = validEvents[i];
        const overlapping = await EventModel.findOverlappingEvents(
          event.startDate,
          event.endDate
        );
        
        if (overlapping.length > 0) {
          overlappingWarnings.push({
            eventIndex: i,
            overlappingWith: overlapping.map(e => ({ id: e.id, name: e.name }))
          });
        }
      }

      // Create events
      const createdEvents = await EventModel.bulkCreate(validEvents);

      const response: any = {
        message: `Successfully imported ${createdEvents.length} events`,
        importedCount: createdEvents.length,
        events: createdEvents
      };

      if (overlappingWarnings.length > 0) {
        response.warnings = {
          message: `${overlappingWarnings.length} events have date overlaps with existing events`,
          overlappingEvents: overlappingWarnings
        };
      }

      sendSuccess(res, response, 201);
    } catch (error) {
      console.error('Event import error:', error);
      sendError(res, 'Failed to import events', 500, 'IMPORT_FAILED');
    }
  })
);

// Export events as JSON (admin only)
router.get('/export/json',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { includeInactive = false } = req.query;
    
    const filters = includeInactive === 'true' ? {} : { isActive: true };
    const result = await EventModel.findAll(filters, { limit: 1000 }); // Large limit for export

    const exportData = {
      exportDate: new Date().toISOString(),
      totalEvents: result.data.length,
      events: result.data.map(event => ({
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        isActive: event.isActive
      }))
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="events-export-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json(exportData);
  })
);

// Bulk operations (admin only)
router.post('/bulk/delete',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { eventIds } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      sendError(res, 'Event IDs array is required', 400, 'MISSING_EVENT_IDS');
      return;
    }

    // Validate all IDs are numbers
    const invalidIds = eventIds.filter(id => !Number.isInteger(Number(id)));
    if (invalidIds.length > 0) {
      sendError(res, 'All event IDs must be valid numbers', 400, 'INVALID_EVENT_IDS');
      return;
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const id of eventIds) {
      try {
        const deleted = await EventModel.delete(Number(id));
        if (deleted) {
          deletedCount++;
        } else {
          errors.push(`Event ${id} not found`);
        }
      } catch (error) {
        errors.push(`Failed to delete event ${id}: ${error}`);
      }
    }

    sendSuccess(res, {
      deletedCount,
      totalRequested: eventIds.length,
      errors: errors.length > 0 ? errors : undefined
    });
  })
);

// Bulk activate/deactivate events (admin only)
router.post('/bulk/activate',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { eventIds, activate = true } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      sendError(res, 'Event IDs array is required', 400, 'MISSING_EVENT_IDS');
      return;
    }

    let updatedCount = 0;
    const errors: string[] = [];

    for (const id of eventIds) {
      try {
        const updated = await EventModel.update(Number(id), { isActive: activate });
        if (updated) {
          updatedCount++;
        } else {
          errors.push(`Event ${id} not found`);
        }
      } catch (error) {
        errors.push(`Failed to update event ${id}: ${error}`);
      }
    }

    sendSuccess(res, {
      updatedCount,
      totalRequested: eventIds.length,
      action: activate ? 'activated' : 'deactivated',
      errors: errors.length > 0 ? errors : undefined
    });
  })
);

export default router;