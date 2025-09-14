import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export interface JWTPayload {
  userId: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

// JWT token generation
export const generateToken = (userId: string, role: 'admin' = 'admin'): string => {
  const payload: JWTPayload = {
    userId,
    role
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'worker-checkin-system',
    audience: 'worker-checkin-admin'
  });
};

// JWT token verification
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'worker-checkin-system',
      audience: 'worker-checkin-admin'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Password verification
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
};

// Admin authentication (simple password-based for now)
export const authenticateAdmin = async (password: string): Promise<AuthResult> => {
  // For now, we'll use a simple environment-based admin password
  // In production, this should be stored in the database with proper hashing
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  try {
    // For development, we'll do a simple comparison
    // In production, this should be hashed
    const isValid = password === adminPassword;
    
    if (isValid) {
      const token = generateToken('admin');
      return {
        success: true,
        token
      };
    } else {
      return {
        success: false,
        error: 'Invalid password'
      };
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
};

// Enhanced admin authentication with hashed passwords (for future use)
export const authenticateAdminHashed = async (password: string, hashedPassword: string): Promise<AuthResult> => {
  try {
    const isValid = await verifyPassword(password, hashedPassword);
    
    if (isValid) {
      const token = generateToken('admin');
      return {
        success: true,
        token
      };
    } else {
      return {
        success: false,
        error: 'Invalid password'
      };
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
};

// Token refresh
export const refreshToken = (currentToken: string): string | null => {
  const payload = verifyToken(currentToken);
  if (!payload) {
    return null;
  }

  // Generate new token with same payload
  return generateToken(payload.userId, payload.role);
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Validate token expiration
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Generate secure session ID
export const generateSessionId = (): string => {
  return jwt.sign(
    { sessionId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};