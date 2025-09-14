import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/auth';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Authentication middleware for protected routes
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token is required'
      }
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
    return;
  }

  // Add user info to request
  req.user = payload;
  next();
};

// Admin role middleware (use after authenticateToken)
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin access required'
      }
    });
    return;
  }

  next();
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};

// Rate limiting middleware for authentication endpoints
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const rateLimitAuth = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const attempts = authAttempts.get(clientIP);
    
    if (attempts) {
      // Reset if window has passed
      if (now - attempts.lastAttempt > windowMs) {
        authAttempts.delete(clientIP);
      } else if (attempts.count >= maxAttempts) {
        res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_ATTEMPTS',
            message: `Too many authentication attempts. Try again in ${Math.ceil((windowMs - (now - attempts.lastAttempt)) / 60000)} minutes.`
          }
        });
        return;
      }
    }

    next();
  };
};

// Update auth attempts (call this after failed authentication)
export const recordFailedAuth = (req: Request): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  const attempts = authAttempts.get(clientIP);
  if (attempts) {
    attempts.count += 1;
    attempts.lastAttempt = now;
  } else {
    authAttempts.set(clientIP, { count: 1, lastAttempt: now });
  }
};

// Clear auth attempts (call this after successful authentication)
export const clearAuthAttempts = (req: Request): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  authAttempts.delete(clientIP);
};

// Session validation middleware
export const validateSession = (req: Request, res: Response, next: NextFunction): void => {
  const sessionId = req.headers['x-session-id'] as string;
  
  if (!sessionId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_SESSION',
        message: 'Session ID is required'
      }
    });
    return;
  }

  // In a production app, you'd validate the session against a store (Redis, database, etc.)
  // For now, we'll just check if it's a valid JWT
  try {
    const payload = verifyToken(sessionId);
    if (!payload) {
      throw new Error('Invalid session');
    }
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_SESSION',
        message: 'Invalid or expired session'
      }
    });
  }
};