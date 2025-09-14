import { ApiResponse, Worker, CheckIn, Event } from '../types';
import { performanceCache, CACHE_KEYS, invalidateCache } from './cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  const sessionId = localStorage.getItem('admin_session_id');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(sessionId && { 'x-session-id': sessionId }),
  };
}

async function adminApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new AdminApiError(
        data.error?.message || 'An error occurred',
        response.status,
        data.error?.code,
        data.error?.field
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }
    
    // Network or parsing error
    throw new AdminApiError(
      'Network error or server unavailable',
      0
    );
  }
}

// Worker management API WITH SAVAGE CACHING!!! 🔥
export const adminWorkerApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    state?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{
    data: Worker[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const cacheKey = `${CACHE_KEYS.WORKERS}_${queryParams.toString()}`;
    const cached = performanceCache.get<{
      data: Worker[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await adminApiRequest<{
      data: Worker[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/workers?${queryParams.toString()}`);
    performanceCache.set(cacheKey, result, 2); // Cache for 2 minutes
    return result;
  },

  getById: async (id: number): Promise<Worker> => {
    return adminApiRequest(`/workers/${id}`);
  },

  create: async (data: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Worker> => {
    const result = await adminApiRequest<Worker>('/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // INVALIDATE CACHE AFTER MUTATIONS!!! ⚡
    invalidateCache.workers();
    return result;
  },

  update: async (id: number, data: Partial<Worker>): Promise<Worker> => {
    const result = await adminApiRequest<Worker>(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    // INVALIDATE CACHE AFTER MUTATIONS!!! ⚡
    invalidateCache.workers();
    return result;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const result = await adminApiRequest<{ message: string }>(`/workers/${id}`, {
      method: 'DELETE',
    });
    // INVALIDATE CACHE AFTER MUTATIONS!!! ⚡
    invalidateCache.workers();
    return result;
  },

  bulkDelete: async (workerIds: number[]): Promise<{
    deletedCount: number;
    totalRequested: number;
    errors?: string[];
  }> => {
    const result = await adminApiRequest<{
      deletedCount: number;
      totalRequested: number;
      errors?: string[];
    }>('/workers/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ workerIds }),
    });
    // INVALIDATE CACHE AFTER MUTATIONS!!! ⚡
    invalidateCache.workers();
    return result;
  },

  getStats: async (): Promise<{
    totalWorkers: number;
    newThisWeek: number;
    newThisMonth: number;
    topCities: Array<{ city: string; count: number }>;
    topStates: Array<{ state: string; count: number }>;
  }> => {
    const cached = performanceCache.get<{
      totalWorkers: number;
      newThisWeek: number;
      newThisMonth: number;
      topCities: Array<{ city: string; count: number }>;
      topStates: Array<{ state: string; count: number }>;
    }>(CACHE_KEYS.WORKER_STATS);
    if (cached) return cached;
    
    const result = await adminApiRequest<{
      totalWorkers: number;
      newThisWeek: number;
      newThisMonth: number;
      topCities: Array<{ city: string; count: number }>;
      topStates: Array<{ state: string; count: number }>;
    }>('/workers/stats/overview');
    performanceCache.set(CACHE_KEYS.WORKER_STATS, result, 5); // Cache for 5 minutes
    return result;
  },
};

// Check-in management API
export const adminCheckInApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    workerId?: number;
    eventId?: number;
    startDate?: string;
    endDate?: string;
    question1Response?: string;
    question2Response?: boolean;
    termsAccepted?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{
    data: Array<CheckIn & {
      workerName: string;
      workerEmail: string;
      eventName: string;
      eventLocation: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return adminApiRequest(`/checkins?${queryParams.toString()}`);
  },

  getById: async (id: number): Promise<CheckIn> => {
    return adminApiRequest(`/checkins/${id}`);
  },

  update: async (id: number, data: {
    question1Response?: string;
    question2Response?: boolean;
    question3Response1?: string;
    question3Response2?: string;
    termsAccepted?: boolean;
  }): Promise<CheckIn> => {
    return adminApiRequest(`/checkins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return adminApiRequest(`/checkins/${id}`, {
      method: 'DELETE',
    });
  },

  bulkDelete: async (checkInIds: number[]): Promise<{
    deletedCount: number;
    totalRequested: number;
    errors?: string[];
  }> => {
    return adminApiRequest('/checkins/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ checkInIds }),
    });
  },

  getByEvent: async (eventId: number, params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{
    data: Array<CheckIn & {
      workerName: string;
      workerEmail: string;
      eventName: string;
      eventLocation: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return adminApiRequest(`/checkins/event/${eventId}?${queryParams.toString()}`);
  },

  getByWorker: async (workerId: number, params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{
    data: Array<CheckIn & {
      workerName: string;
      workerEmail: string;
      eventName: string;
      eventLocation: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return adminApiRequest(`/checkins/worker/${workerId}?${queryParams.toString()}`);
  },

  getStats: async (eventId?: number): Promise<{
    totalCheckIns: number;
    todayCheckIns: number;
    thisWeekCheckIns: number;
    thisMonthCheckIns: number;
  }> => {
    const endpoint = eventId ? `/checkins/stats/overview/${eventId}` : '/checkins/stats/overview';
    return adminApiRequest(endpoint);
  },

  getAnalytics: async (eventId?: number): Promise<{
    question1Responses: Record<string, number>;
    question2Responses: { yes: number; no: number };
    question3Response1: Record<string, number>;
    question3Response2: Record<string, number>;
  }> => {
    const endpoint = eventId ? `/checkins/analytics/${eventId}` : '/checkins/analytics';
    return adminApiRequest(endpoint);
  },

  getRecent: async (limit: number = 10, eventId?: number): Promise<{
    checkIns: Array<CheckIn & {
      workerName: string;
      workerEmail: string;
      eventName: string;
      eventLocation: string;
    }>;
    count: number;
  }> => {
    const endpoint = eventId 
      ? `/checkins/recent/${limit}/${eventId}` 
      : `/checkins/recent/${limit}`;
    return adminApiRequest(endpoint);
  },
};

// Event management API
export const adminEventApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<{
    data: Event[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return adminApiRequest(`/events?${queryParams.toString()}`);
  },

  getById: async (id: number): Promise<Event> => {
    return adminApiRequest(`/events/${id}`);
  },

  create: async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
    return adminApiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Event>): Promise<Event> => {
    return adminApiRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return adminApiRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  bulkDelete: async (eventIds: number[]): Promise<{
    deletedCount: number;
    totalRequested: number;
    errors?: string[];
  }> => {
    return adminApiRequest('/events/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ eventIds }),
    });
  },

  importFromJson: async (jsonData: any[]): Promise<{
    imported: number;
    errors: string[];
    events: Event[];
  }> => {
    return adminApiRequest('/events/import/json', {
      method: 'POST',
      body: JSON.stringify({ events: jsonData }),
    });
  },

  setActiveEvent: async (eventId: number): Promise<{ message: string }> => {
    return adminApiRequest(`/events/${eventId}/activate`, {
      method: 'POST',
    });
  },

  getStats: async (): Promise<{
    totalEvents: number;
    activeEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    eventsThisMonth: number;
  }> => {
    return adminApiRequest('/events/stats/overview');
  },
};

// Admin settings API
export const adminSettingsApi = {
  get: async (): Promise<{
    termsAndConditions: string;
    question1Options: string[];
    question3Options1: string[];
    question3Options2: string[];
  }> => {
    return adminApiRequest('/admin/settings');
  },

  update: async (settings: {
    termsAndConditions?: string;
    question1Options?: string[];
    question3Options1?: string[];
    question3Options2?: string[];
  }): Promise<{
    termsAndConditions: string;
    question1Options: string[];
    question3Options1: string[];
    question3Options2: string[];
  }> => {
    return adminApiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  reset: async (): Promise<{ message: string }> => {
    return adminApiRequest('/admin/settings/reset', {
      method: 'POST',
    });
  },
};

export { AdminApiError };