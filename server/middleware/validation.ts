import { Request, Response, NextFunction } from 'express';
import { sendError } from './errorHandler';

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (basic US format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Date validation
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Password strength validation
export const isStrongPassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

// Worker validation middleware
export const validateWorkerData = (req: Request, res: Response, next: NextFunction): void => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    email,
    phone,
    streetAddress,
    city,
    state,
    zipCode,
    country
  } = req.body;

  const errors: Array<{ field: string; message: string }> = [];

  // Required field validation
  if (!firstName?.trim()) errors.push({ field: 'firstName', message: 'First name is required' });
  if (!lastName?.trim()) errors.push({ field: 'lastName', message: 'Last name is required' });
  if (!dateOfBirth) errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
  if (!email?.trim()) errors.push({ field: 'email', message: 'Email is required' });
  if (!phone?.trim()) errors.push({ field: 'phone', message: 'Phone number is required' });
  if (!streetAddress?.trim()) errors.push({ field: 'streetAddress', message: 'Street address is required' });
  if (!city?.trim()) errors.push({ field: 'city', message: 'City is required' });
  if (!state?.trim()) errors.push({ field: 'state', message: 'State is required' });
  if (!zipCode?.trim()) errors.push({ field: 'zipCode', message: 'Zip code is required' });
  if (!country?.trim()) errors.push({ field: 'country', message: 'Country is required' });

  // Format validation
  if (email && !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (phone && !isValidPhone(phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  if (dateOfBirth && !isValidDate(dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'Invalid date format' });
  }

  // Age validation (must be at least 16)
  if (dateOfBirth && isValidDate(dateOfBirth)) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Haven't had birthday this year
    }
    
    if (age < 16) {
      errors.push({ field: 'dateOfBirth', message: 'Worker must be at least 16 years old' });
    }
  }

  // Name length validation
  if (firstName && firstName.length > 100) {
    errors.push({ field: 'firstName', message: 'First name must be less than 100 characters' });
  }
  if (lastName && lastName.length > 100) {
    errors.push({ field: 'lastName', message: 'Last name must be less than 100 characters' });
  }

  if (errors.length > 0) {
    sendError(res, errors[0].message, 400, 'VALIDATION_ERROR', errors[0].field);
    return;
  }

  next();
};

// Event validation middleware
export const validateEventData = (req: Request, res: Response, next: NextFunction): void => {
  const { name, startDate, endDate, location } = req.body;
  const errors: Array<{ field: string; message: string }> = [];

  // Required field validation
  if (!name?.trim()) errors.push({ field: 'name', message: 'Event name is required' });
  if (!startDate) errors.push({ field: 'startDate', message: 'Start date is required' });
  if (!endDate) errors.push({ field: 'endDate', message: 'End date is required' });
  if (!location?.trim()) errors.push({ field: 'location', message: 'Location is required' });

  // Date format validation
  if (startDate && !isValidDate(startDate)) {
    errors.push({ field: 'startDate', message: 'Invalid start date format' });
  }
  if (endDate && !isValidDate(endDate)) {
    errors.push({ field: 'endDate', message: 'Invalid end date format' });
  }

  // Date logic validation
  if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push({ field: 'endDate', message: 'End date must be after start date' });
    }
  }

  // Length validation
  if (name && name.length > 255) {
    errors.push({ field: 'name', message: 'Event name must be less than 255 characters' });
  }
  if (location && location.length > 255) {
    errors.push({ field: 'location', message: 'Location must be less than 255 characters' });
  }

  if (errors.length > 0) {
    sendError(res, errors[0].message, 400, 'VALIDATION_ERROR', errors[0].field);
    return;
  }

  next();
};

// Check-in validation middleware
export const validateCheckInData = (req: Request, res: Response, next: NextFunction): void => {
  const {
    workerId,
    eventId,
    question1Response,
    question2Response,
    question3Response1,
    question3Response2,
    termsAccepted
  } = req.body;

  const errors: Array<{ field: string; message: string }> = [];

  // Required field validation
  if (!workerId) errors.push({ field: 'workerId', message: 'Worker ID is required' });
  if (!eventId) errors.push({ field: 'eventId', message: 'Event ID is required' });
  if (!question1Response?.trim()) errors.push({ field: 'question1Response', message: 'Question 1 response is required' });
  if (question2Response === undefined || question2Response === null) {
    errors.push({ field: 'question2Response', message: 'Question 2 response is required' });
  }
  if (!question3Response1?.trim()) errors.push({ field: 'question3Response1', message: 'Question 3 part 1 response is required' });
  if (!question3Response2?.trim()) errors.push({ field: 'question3Response2', message: 'Question 3 part 2 response is required' });
  if (!termsAccepted) errors.push({ field: 'termsAccepted', message: 'Terms and conditions must be accepted' });

  // Type validation
  if (workerId && !Number.isInteger(Number(workerId))) {
    errors.push({ field: 'workerId', message: 'Worker ID must be a valid number' });
  }
  if (eventId && !Number.isInteger(Number(eventId))) {
    errors.push({ field: 'eventId', message: 'Event ID must be a valid number' });
  }
  if (question2Response !== undefined && typeof question2Response !== 'boolean') {
    errors.push({ field: 'question2Response', message: 'Question 2 response must be true or false' });
  }
  if (termsAccepted !== undefined && typeof termsAccepted !== 'boolean') {
    errors.push({ field: 'termsAccepted', message: 'Terms accepted must be true or false' });
  }

  if (errors.length > 0) {
    sendError(res, errors[0].message, 400, 'VALIDATION_ERROR', errors[0].field);
    return;
  }

  next();
};

// Admin login validation
export const validateAdminLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;

  if (!password) {
    sendError(res, 'Password is required', 400, 'MISSING_PASSWORD', 'password');
    return;
  }

  if (typeof password !== 'string') {
    sendError(res, 'Password must be a string', 400, 'INVALID_PASSWORD_TYPE', 'password');
    return;
  }

  if (password.length < 1) {
    sendError(res, 'Password cannot be empty', 400, 'EMPTY_PASSWORD', 'password');
    return;
  }

  next();
};

// Pagination validation
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      sendError(res, 'Page must be a positive integer', 400, 'INVALID_PAGE');
      return;
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      sendError(res, 'Limit must be a positive integer between 1 and 100', 400, 'INVALID_LIMIT');
      return;
    }
  }

  next();
};

// ID parameter validation
export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    if (!id) {
      sendError(res, `${paramName} is required`, 400, 'MISSING_ID');
      return;
    }

    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum < 1) {
      sendError(res, `${paramName} must be a positive integer`, 400, 'INVALID_ID');
      return;
    }

    next();
  };
};

// Search query validation
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { q } = req.query;

  if (q !== undefined) {
    if (typeof q !== 'string') {
      sendError(res, 'Search query must be a string', 400, 'INVALID_SEARCH_QUERY');
      return;
    }

    if (q.length < 3) {
      sendError(res, 'Search query must be at least 3 characters long', 400, 'SEARCH_QUERY_TOO_SHORT');
      return;
    }

    if (q.length > 100) {
      sendError(res, 'Search query must be less than 100 characters', 400, 'SEARCH_QUERY_TOO_LONG');
      return;
    }
  }

  next();
};