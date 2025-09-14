import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/types';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public field?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', field?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      if (error.constraint?.includes('email')) {
        return new AppError('Email address is already registered', 409, 'DUPLICATE_EMAIL', 'email');
      }
      if (error.constraint?.includes('phone')) {
        return new AppError('Phone number is already registered', 409, 'DUPLICATE_PHONE', 'phone');
      }
      return new AppError('Duplicate entry found', 409, 'DUPLICATE_ENTRY');

    case '23503': // Foreign key violation
      return new AppError('Referenced record does not exist', 400, 'INVALID_REFERENCE');

    case '23502': // Not null violation
      const field = error.column;
      return new AppError(`${field} is required`, 400, 'MISSING_REQUIRED_FIELD', field);

    case '23514': // Check constraint violation
      return new AppError('Data validation failed', 400, 'VALIDATION_ERROR');

    case '42P01': // Undefined table
      return new AppError('Database table not found', 500, 'DATABASE_ERROR');

    case '42703': // Undefined column
      return new AppError('Database column not found', 500, 'DATABASE_ERROR');

    case '08006': // Connection failure
    case '08001': // Unable to connect
      return new AppError('Database connection failed', 503, 'DATABASE_UNAVAILABLE');

    default:
      console.error('Unhandled database error:', error);
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

// Validation error handler
export const handleValidationError = (errors: any[]): AppError => {
  const firstError = errors[0];
  return new AppError(
    firstError.message || 'Validation failed',
    400,
    'VALIDATION_ERROR',
    firstError.field
  );
};

// JWT error handler
export const handleJWTError = (error: any): AppError => {
  switch (error.name) {
    case 'JsonWebTokenError':
      return new AppError('Invalid token', 401, 'INVALID_TOKEN');
    case 'TokenExpiredError':
      return new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
    case 'NotBeforeError':
      return new AppError('Token not active yet', 401, 'TOKEN_NOT_ACTIVE');
    default:
      return new AppError('Token verification failed', 401, 'TOKEN_ERROR');
  }
};

// Main error handling middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name?.includes('JsonWebToken')) {
    appError = handleJWTError(error);
  } else if (error.name === 'ValidationError') {
    appError = handleValidationError([error]);
  } else if ((error as any).code && typeof (error as any).code === 'string') {
    // Database error
    appError = handleDatabaseError(error);
  } else {
    // Generic error
    appError = new AppError(
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      statusCode: appError.statusCode,
      code: appError.code,
      field: appError.field,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  } else {
    // In production, log only essential info
    console.error('Error:', {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Send error response
  const response: ApiResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.field && { field: appError.field })
    }
  };

  res.status(appError.statusCode).json(response);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  };

  res.status(404).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Success response helper
export const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200): void => {
  const response: ApiResponse<T> = {
    success: true,
    data
  };

  res.status(statusCode).json(response);
};

// Error response helper
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  code: string = 'ERROR',
  field?: string
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(field && { field })
    }
  };

  res.status(statusCode).json(response);
};

// Validation middleware
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    fields.forEach(field => {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      sendError(
        res,
        `Missing required fields: ${missing.join(', ')}`,
        400,
        'MISSING_REQUIRED_FIELDS'
      );
      return;
    }

    next();
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      console.error('Request error:', logData);
    } else {
      console.log('Request:', logData);
    }
  });

  next();
};