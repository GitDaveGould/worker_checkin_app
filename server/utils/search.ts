// SAVAGE SEARCH UTILITIES WITH CACHING!!! 🔥🔥🔥

// In-memory cache for search results
class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 500; // Maximum cache entries

  set(key: string, data: any, ttlMinutes: number = 5): void {
    // Clean up if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

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
}

// GLOBAL SEARCH CACHE INSTANCE!!! ⚡
export const searchCache = new SearchCache();

// Performance monitoring for search operations
class SearchPerformanceMonitor {
  private searchTimes: number[] = [];
  private maxSamples = 100;

  recordSearchTime(duration: number): void {
    this.searchTimes.push(duration);
    if (this.searchTimes.length > this.maxSamples) {
      this.searchTimes.shift();
    }
  }

  getAverageSearchTime(): number {
    if (this.searchTimes.length === 0) return 0;
    return this.searchTimes.reduce((sum, time) => sum + time, 0) / this.searchTimes.length;
  }

  getStats() {
    if (this.searchTimes.length === 0) {
      return { avg: 0, min: 0, max: 0, samples: 0 };
    }

    return {
      avg: Math.round(this.getAverageSearchTime()),
      min: Math.min(...this.searchTimes),
      max: Math.max(...this.searchTimes),
      samples: this.searchTimes.length
    };
  }
}

export const searchPerformanceMonitor = new SearchPerformanceMonitor();

export interface SearchOptions {
  limit?: number;
  fuzzy?: boolean;
  includeInactive?: boolean;
}

export interface SearchResult<T> {
  results: T[];
  totalCount: number;
  searchTerm: string;
  executionTime: number;
}

// Debounce utility for search requests
export class SearchDebouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  debounce<T extends any[]>(
    key: string,
    fn: (...args: T) => Promise<any>,
    delay: number = 300
  ): (...args: T) => Promise<any> {
    return (...args: T) => {
      return new Promise((resolve, reject) => {
        // Clear existing timer for this key
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.timers.delete(key);
          }
        }, delay);

        this.timers.set(key, timer);
      });
    };
  }

  // Clear all pending searches
  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  // Clear specific search
  clear(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
}

// Global search debouncer instance
export const searchDebouncer = new SearchDebouncer();

// Search term preprocessing
export const preprocessSearchTerm = (term: string): string => {
  return term
    .trim()
    .toLowerCase()
    .replace(/[^\w\s@.-]/g, '') // Remove special chars except email/phone chars
    .replace(/\s+/g, ' '); // Normalize whitespace
};

// Search term validation
export const validateSearchTerm = (term: string): { isValid: boolean; error?: string } => {
  if (!term || typeof term !== 'string') {
    return { isValid: false, error: 'Search term must be a string' };
  }

  const trimmed = term.trim();
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Search term must be at least 3 characters' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Search term must be less than 100 characters' };
  }

  return { isValid: true };
};

// Generate search suggestions based on partial input
export const generateSearchSuggestions = (term: string): string[] => {
  const suggestions: string[] = [];
  const processed = preprocessSearchTerm(term);

  // Email pattern detection
  if (processed.includes('@')) {
    suggestions.push('Search by email address');
  }

  // Phone pattern detection
  if (/\d{3,}/.test(processed)) {
    suggestions.push('Search by phone number');
  }

  // Name pattern detection
  if (/^[a-z\s]+$/.test(processed) && processed.includes(' ')) {
    suggestions.push('Search by full name');
  }

  return suggestions;
};

// Search result ranking
export interface RankedResult<T> {
  item: T;
  score: number;
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy';
}

export const rankSearchResults = <T>(
  results: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string[]
): RankedResult<T>[] => {
  const term = preprocessSearchTerm(searchTerm);
  
  return results.map(item => {
    const searchableTexts = getSearchableText(item);
    let bestScore = 0;
    let bestMatchType: RankedResult<T>['matchType'] = 'fuzzy';

    searchableTexts.forEach(text => {
      const normalizedText = preprocessSearchTerm(text);
      
      // Exact match (highest score)
      if (normalizedText === term) {
        bestScore = Math.max(bestScore, 100);
        bestMatchType = 'exact';
      }
      // Prefix match
      else if (normalizedText.startsWith(term)) {
        bestScore = Math.max(bestScore, 80);
        if (bestMatchType !== 'exact') bestMatchType = 'prefix';
      }
      // Contains match
      else if (normalizedText.includes(term)) {
        bestScore = Math.max(bestScore, 60);
        if (!['exact', 'prefix'].includes(bestMatchType)) bestMatchType = 'contains';
      }
      // Fuzzy match (basic implementation)
      else if (calculateSimilarity(normalizedText, term) > 0.7) {
        bestScore = Math.max(bestScore, 40);
        if (bestMatchType === 'fuzzy') bestMatchType = 'fuzzy';
      }
    });

    return {
      item,
      score: bestScore,
      matchType: bestMatchType
    };
  })
  .filter(result => result.score > 0)
  .sort((a, b) => b.score - a.score);
};

// Simple similarity calculation (Levenshtein distance based)
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Levenshtein distance calculation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Search performance monitoring
export class SearchPerformanceMonitor {
  private searchTimes: number[] = [];
  private readonly maxSamples = 100;

  recordSearchTime(duration: number): void {
    this.searchTimes.push(duration);
    if (this.searchTimes.length > this.maxSamples) {
      this.searchTimes.shift();
    }
  }

  getAverageSearchTime(): number {
    if (this.searchTimes.length === 0) return 0;
    return this.searchTimes.reduce((sum, time) => sum + time, 0) / this.searchTimes.length;
  }

  getSearchStats(): {
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalSearches: number;
  } {
    if (this.searchTimes.length === 0) {
      return { averageTime: 0, minTime: 0, maxTime: 0, totalSearches: 0 };
    }

    return {
      averageTime: this.getAverageSearchTime(),
      minTime: Math.min(...this.searchTimes),
      maxTime: Math.max(...this.searchTimes),
      totalSearches: this.searchTimes.length
    };
  }
}

// Global performance monitor
export const searchPerformanceMonitor = new SearchPerformanceMonitor();

// Search cache for frequently searched terms
export class SearchCache {
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly ttl: number = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize: number = 100;

  set(key: string, value: any): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      result: value,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global search cache
export const searchCache = new SearchCache();

// Cleanup interval for search cache
setInterval(() => {
  searchCache.cleanup();
}, 60000); // Clean every minute