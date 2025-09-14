import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiError } from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const sessionId = localStorage.getItem('admin_session_id');
        
        if (token && sessionId) {
          // Verify token is still valid by making a test API call
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-session-id': sessionId
            }
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_session_id');
          }
        }
      } catch (error) {
        // Network error or other issue, assume not authenticated
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_session_id');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.error?.message || 'Login failed',
          response.status,
          data.error?.code
        );
      }

      // Store authentication data
      localStorage.setItem('admin_token', data.data.token);
      localStorage.setItem('admin_session_id', data.data.sessionId);
      
      setIsAuthenticated(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Login failed. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_session_id');
    setIsAuthenticated(false);
    setError(null);

    // Optional: Call logout endpoint to invalidate session on server
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'x-session-id': localStorage.getItem('admin_session_id') || ''
      }
    }).catch(() => {
      // Ignore errors on logout
    });
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};