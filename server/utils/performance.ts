// SAVAGE PERFORMANCE MONITORING SYSTEM!!! 🔥🔥🔥

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  // Track API endpoint performance
  trackApiCall(name: string, startTime: number, success: boolean, error?: string): void {
    const duration = Date.now() - startTime;
    
    this.addMetric({
      name,
      duration,
      timestamp: Date.now(),
      success,
      error
    });

    // Log slow queries (over 1 second)
    if (duration > 1000) {
      console.warn(`🐌 SLOW API CALL: ${name} took ${duration}ms`);
    }
  }

  // Track database query performance
  trackDbQuery(query: string, startTime: number, success: boolean, error?: string): void {
    const duration = Date.now() - startTime;
    
    this.addMetric({
      name: `DB: ${query.substring(0, 50)}...`,
      duration,
      timestamp: Date.now(),
      success,
      error
    });

    // Log slow queries (over 500ms)
    if (duration > 500) {
      console.warn(`🐌 SLOW DB QUERY: ${query.substring(0, 100)} took ${duration}ms`);
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get performance statistics
  getStats(timeWindowMinutes: number = 60): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    topSlowEndpoints: Array<{ name: string; avgDuration: number; count: number }>;
  } {
    const cutoffTime = Date.now() - (timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        topSlowEndpoints: []
      };
    }

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const slowRequests = recentMetrics.filter(m => m.duration > 1000).length;
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);

    // Group by endpoint name for slow endpoint analysis
    const endpointStats = new Map<string, { totalDuration: number; count: number }>();
    
    recentMetrics.forEach(metric => {
      const existing = endpointStats.get(metric.name) || { totalDuration: 0, count: 0 };
      endpointStats.set(metric.name, {
        totalDuration: existing.totalDuration + metric.duration,
        count: existing.count + 1
      });
    });

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([name, stats]) => ({
        name,
        avgDuration: Math.round(stats.totalDuration / stats.count),
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalRequests,
      successRate: Math.round((successfulRequests / totalRequests) * 100),
      averageResponseTime: Math.round(totalDuration / totalRequests),
      slowRequests,
      errorRate: Math.round(((totalRequests - successfulRequests) / totalRequests) * 100),
      topSlowEndpoints
    };
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => !m.success && m.error)
      .slice(-limit)
      .reverse();
  }

  // Clear old metrics
  cleanup(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // Keep last 24 hours
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
  }
}

// GLOBAL PERFORMANCE MONITOR INSTANCE!!! ⚡
export const performanceMonitor = new PerformanceMonitor();

// Middleware for tracking API performance
export const trackApiPerformance = (endpointName: string) => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Override res.end to capture when response is sent
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const success = res.statusCode < 400;
      const error = success ? undefined : `HTTP ${res.statusCode}`;
      
      performanceMonitor.trackApiCall(
        `${req.method} ${endpointName}`,
        startTime,
        success,
        error
      );
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
};

// Database query performance wrapper
export const trackDbPerformance = async <T>(
  query: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    performanceMonitor.trackDbQuery(query, startTime, true);
    return result;
  } catch (error) {
    performanceMonitor.trackDbQuery(
      query,
      startTime,
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
};

// Cleanup old metrics every hour
setInterval(() => {
  performanceMonitor.cleanup();
}, 60 * 60 * 1000);

// Log performance stats every 10 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = performanceMonitor.getStats(10);
    if (stats.totalRequests > 0) {
      console.log('📊 PERFORMANCE STATS (last 10 min):', {
        requests: stats.totalRequests,
        successRate: `${stats.successRate}%`,
        avgResponseTime: `${stats.averageResponseTime}ms`,
        slowRequests: stats.slowRequests,
        errorRate: `${stats.errorRate}%`
      });
    }
  }, 10 * 60 * 1000);
}