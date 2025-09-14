// SAVAGE FRONTEND CACHING SYSTEM!!! 🔥🔥🔥

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum cache entries

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // If still full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize
    };
  }
}

// GLOBAL CACHE INSTANCE FOR MAXIMUM PERFORMANCE!!! ⚡
export const performanceCache = new PerformanceCache();

// CACHE KEYS FOR DIFFERENT DATA TYPES
export const CACHE_KEYS = {
  WORKERS: 'workers',
  EVENTS: 'events', 
  CHECKINS: 'checkins',
  WORKER_STATS: 'worker_stats',
  EVENT_STATS: 'event_stats',
  CHECKIN_STATS: 'checkin_stats',
  RECENT_CHECKINS: 'recent_checkins',
  WORKER_SEARCH: (query: string) => `worker_search_${query}`,
  EVENT_CHECKINS: (eventId: number) => `event_checkins_${eventId}`,
  WORKER_CHECKINS: (workerId: number) => `worker_checkins_${workerId}`,
} as const;

// CACHE INVALIDATION HELPERS
export const invalidateCache = {
  workers: () => {
    performanceCache.delete(CACHE_KEYS.WORKERS);
    performanceCache.delete(CACHE_KEYS.WORKER_STATS);
    // Clear all worker search results
    const keys = Array.from((performanceCache as any).cache.keys()) as string[];
    keys.filter(key => key.startsWith('worker_search_')).forEach(key => performanceCache.delete(key));
  },
  
  events: () => {
    performanceCache.delete(CACHE_KEYS.EVENTS);
    performanceCache.delete(CACHE_KEYS.EVENT_STATS);
  },
  
  checkins: () => {
    performanceCache.delete(CACHE_KEYS.CHECKINS);
    performanceCache.delete(CACHE_KEYS.CHECKIN_STATS);
    performanceCache.delete(CACHE_KEYS.RECENT_CHECKINS);
    // Clear all event and worker specific check-ins
    const keys = Array.from((performanceCache as any).cache.keys()) as string[];
    keys.filter(key => key.startsWith('event_checkins_') || key.startsWith('worker_checkins_')).forEach(key => performanceCache.delete(key));
  },
  
  all: () => {
    performanceCache.clear();
  }
};