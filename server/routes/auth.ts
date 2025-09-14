import express from 'express';
import { authenticateAdmin, refreshToken, generateSessionId } from '../utils/auth';
import { rateLimitAuth, recordFailedAuth, clearAuthAttempts } from '../middleware/auth';
import { validateAdminLogin } from '../middleware/validation';
import { asyncHandler, sendSuccess, sendError } from '../middleware/errorHandler';

const router = express.Router();

// Admin login endpoint
router.post('/login', 
  rateLimitAuth(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validateAdminLogin,
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    try {
      const result = await authenticateAdmin(password);

      if (result.success && result.token) {
        // Clear any failed attempts
        clearAuthAttempts(req);

        // Generate session ID
        const sessionId = generateSessionId();

        sendSuccess(res, {
          token: result.token,
          sessionId,
          expiresIn: '24h',
          tokenType: 'Bearer'
        });
      } else {
        // Record failed attempt
        recordFailedAuth(req);

        sendError(res, result.error || 'Authentication failed', 401, 'AUTHENTICATION_FAILED');
      }
    } catch (error) {
      recordFailedAuth(req);
      throw error;
    }
  })
);

// Token refresh endpoint
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Bearer token is required', 401, 'MISSING_TOKEN');
      return;
    }

    const currentToken = authHeader.split(' ')[1];
    const newToken = refreshToken(currentToken);

    if (newToken) {
      sendSuccess(res, {
        token: newToken,
        expiresIn: '24h',
        tokenType: 'Bearer'
      });
    } else {
      sendError(res, 'Invalid or expired token', 401, 'TOKEN_REFRESH_FAILED');
    }
  })
);

// Logout endpoint (client-side token invalidation)
router.post('/logout',
  asyncHandler(async (req, res) => {
    // In a production app with Redis or database sessions,
    // you would invalidate the token/session here
    
    sendSuccess(res, {
      message: 'Logged out successfully'
    });
  })
);

// Verify token endpoint
router.get('/verify',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Bearer token is required', 401, 'MISSING_TOKEN');
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const { verifyToken } = await import('../utils/auth');
      const payload = verifyToken(token);

      if (payload) {
        sendSuccess(res, {
          valid: true,
          user: {
            userId: payload.userId,
            role: payload.role
          },
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
        });
      } else {
        sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
      }
    } catch (error) {
      sendError(res, 'Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  })
);

// Get current user info
router.get('/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Bearer token is required', 401, 'MISSING_TOKEN');
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const { verifyToken } = await import('../utils/auth');
      const payload = verifyToken(token);

      if (payload) {
        sendSuccess(res, {
          userId: payload.userId,
          role: payload.role,
          loginTime: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
        });
      } else {
        sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
      }
    } catch (error) {
      sendError(res, 'Failed to get user info', 401, 'USER_INFO_FAILED');
    }
  })
);

export default router;