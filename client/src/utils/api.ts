import { ApiResponse, WorkerSearchResult, Worker, Event, CheckInRequest, CheckIn, AdminSettings } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error?.message || 'An error occurred',
        response.status,
        data.error?.code,
        data.error?.field
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or parsing error
    throw new ApiError(
      'Network error or server unavailable',
      0
    );
  }
}

// Worker API functions
export const workerApi = {
  search: async (query: string): Promise<{ results: WorkerSearchResult[]; totalCount: number }> => {
    if (query.length < 3) {
      return { results: [], totalCount: 0 };
    }
    return apiRequest(`/workers/search?q=${encodeURIComponent(query)}`);
  },

  getById: async (id: number): Promise<Worker> => {
    return apiRequest(`/workers/${id}`);
  },

  create: async (workerData: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Worker> => {
    return apiRequest('/workers', {
      method: 'POST',
      body: JSON.stringify(workerData),
    });
  },

  checkEmail: async (email: string): Promise<{ available: boolean; message: string }> => {
    return apiRequest('/workers/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  checkPhone: async (phone: string): Promise<{ available: boolean; message: string }> => {
    return apiRequest('/workers/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
};

// Event API functions
export const eventApi = {
  getActive: async (): Promise<Event | null> => {
    return apiRequest('/events/active');
  },

  getById: async (id: number): Promise<Event> => {
    return apiRequest(`/events/${id}`);
  },
};

// Check-in API functions
export const checkInApi = {
  create: async (checkInData: CheckInRequest): Promise<{
    checkIn: CheckIn;
    worker: { id: number; firstName: string; lastName: string; email: string };
    event: { id: number; name: string; location: string };
  }> => {
    return apiRequest('/checkins', {
      method: 'POST',
      body: JSON.stringify(checkInData),
    });
  },

  checkDuplicate: async (workerId: number, eventId: number): Promise<{
    hasCheckedIn: boolean;
    workerId: number;
    eventId: number;
  }> => {
    return apiRequest(`/checkins/check/${workerId}/${eventId}`);
  },
};

// Admin settings API functions
export const adminApi = {
  getSettings: async (): Promise<AdminSettings> => {
    return apiRequest('/admin/settings');
  },
};

export { ApiError };