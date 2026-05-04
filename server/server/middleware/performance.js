/**
 * Performance monitoring middleware for Lekki Stays
 */

const { performance } = require('perf_hooks');

// Performance metrics storage
const metrics = {
  requests: [],
  totalRequests: 0,
  averageResponseTime: 0,
  slowRequests: [], // Requests taking > 1000ms
  errorRequests: []
};

/**
 * Performance monitoring middleware
 */
function performanceMonitor(req, res, next) {
  const startTime = performance.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Record metrics
    const requestMetric = {
      id: requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Store metrics
    metrics.requests.push(requestMetric);
    metrics.totalRequests++;
    
    // Keep only last 1000 requests to prevent memory issues
    if (metrics.requests.length > 1000) {
      metrics.requests.shift();
    }
    
    // Track slow requests (> 1000ms)
    if (responseTime > 1000) {
      metrics.slowRequests.push(requestMetric);
      console.warn(`🐌 Slow request detected: ${req.method} ${req.url} - ${responseTime.toFixed(2)}ms`);
    }
    
    // Track error requests (4xx, 5xx)
    if (res.statusCode >= 400) {
      metrics.errorRequests.push(requestMetric);
    }
    
    // Calculate average response time
    const recentRequests = metrics.requests.slice(-100); // Last 100 requests
    metrics.averageResponseTime = recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length;
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
      console.log(`${statusColor} ${req.method} ${req.url} - ${res.statusCode} - ${responseTime.toFixed(2)}ms`);
    }
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Get performance metrics
 */
function getMetrics() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const fiveMinutesAgo = now - 300000;
  
  const recentRequests = metrics.requests.filter(req => 
    new Date(req.timestamp).getTime() > oneMinuteAgo
  );
  
  const last5MinRequests = metrics.requests.filter(req => 
    new Date(req.timestamp).getTime() > fiveMinutesAgo
  );
  
  return {
    totalRequests: metrics.totalRequests,
    averageResponseTime: metrics.averageResponseTime,
    requestsLastMinute: recentRequests.length,
    requestsLast5Minutes: last5MinRequests.length,
    slowRequestsCount: metrics.slowRequests.length,
    errorRequestsCount: metrics.errorRequests.length,
    slowRequests: metrics.slowRequests.slice(-10), // Last 10 slow requests
    errorRequests: metrics.errorRequests.slice(-10), // Last 10 error requests
    recentRequests: recentRequests.slice(-20) // Last 20 requests in the minute
  };
}

/**
 * Reset metrics (useful for testing)
 */
function resetMetrics() {
  metrics.requests = [];
  metrics.totalRequests = 0;
  metrics.averageResponseTime = 0;
  metrics.slowRequests = [];
  metrics.errorRequests = [];
}

/**
 * Performance health check
 */
function getHealthStatus() {
  const currentMetrics = getMetrics();
  
  const health = {
    status: 'healthy',
    issues: []
  };
  
  // Check average response time
  if (currentMetrics.averageResponseTime > 2000) {
    health.status = 'unhealthy';
    health.issues.push('High average response time');
  } else if (currentMetrics.averageResponseTime > 1000) {
    health.status = 'degraded';
    health.issues.push('Elevated response time');
  }
  
  // Check error rate
  const errorRate = currentMetrics.errorRequestsCount / Math.max(currentMetrics.totalRequests, 1);
  if (errorRate > 0.1) { // > 10% error rate
    health.status = 'unhealthy';
    health.issues.push('High error rate');
  } else if (errorRate > 0.05) { // > 5% error rate
    health.status = 'degraded';
    health.issues.push('Elevated error rate');
  }
  
  // Check for too many slow requests
  if (currentMetrics.slowRequestsCount > 10) {
    health.status = 'degraded';
    health.issues.push('Multiple slow requests detected');
  }
  
  return {
    ...health,
    metrics: currentMetrics
  };
}

module.exports = {
  performanceMonitor,
  getMetrics,
  resetMetrics,
  getHealthStatus
};