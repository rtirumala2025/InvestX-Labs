/**
 * Performance & Metrics Monitoring for InvestIQ Chatbot
 * Tracks response time, token usage, engagement, and system health
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byQueryType: {},
        byUser: {}
      },
      performance: {
        responseTimes: [],
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowestRequests: []
      },
      tokens: {
        total: 0,
        byQueryType: {},
        byUser: {},
        averagePerRequest: 0
      },
      engagement: {
        totalMessages: 0,
        averageConversationLength: 0,
        userSentiment: {},
        topicDistribution: {}
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      concurrency: {
        currentActive: 0,
        peakConcurrent: 0,
        queuedRequests: 0
      }
    };
    
    this.requestQueue = [];
    this.activeRequests = new Map();
  }

  /**
   * Start tracking a request
   * @param {string} requestId - Unique request identifier
   * @param {string} userId - User identifier
   * @param {string} queryType - Type of query
   * @returns {Object} Request tracking object
   */
  startRequest(requestId, userId, queryType) {
    const request = {
      requestId,
      userId,
      queryType,
      startTime: Date.now(),
      status: 'processing'
    };

    this.activeRequests.set(requestId, request);
    this.metrics.concurrency.currentActive++;
    
    if (this.metrics.concurrency.currentActive > this.metrics.concurrency.peakConcurrent) {
      this.metrics.concurrency.peakConcurrent = this.metrics.concurrency.currentActive;
    }

    return request;
  }

  /**
   * Complete a request and record metrics
   * @param {string} requestId - Request identifier
   * @param {Object} result - Request result with tokens, response, etc.
   */
  completeRequest(requestId, result) {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    const responseTime = Date.now() - request.startTime;
    const { userId, queryType } = request;
    const { tokens, success, error } = result;

    // Update request metrics
    this.metrics.requests.total++;
    this.metrics.requests.byQueryType[queryType] = 
      (this.metrics.requests.byQueryType[queryType] || 0) + 1;
    this.metrics.requests.byUser[userId] = 
      (this.metrics.requests.byUser[userId] || 0) + 1;

    // Update performance metrics
    this.metrics.performance.responseTimes.push(responseTime);
    this.updatePerformanceStats(responseTime, requestId, queryType);

    // Update token metrics
    if (tokens) {
      this.metrics.tokens.total += tokens;
      this.metrics.tokens.byQueryType[queryType] = 
        (this.metrics.tokens.byQueryType[queryType] || 0) + tokens;
      this.metrics.tokens.byUser[userId] = 
        (this.metrics.tokens.byUser[userId] || 0) + tokens;
      this.metrics.tokens.averagePerRequest = 
        this.metrics.tokens.total / this.metrics.requests.total;
    }

    // Handle errors
    if (!success && error) {
      this.recordError(error, requestId, queryType);
    }

    // Cleanup
    this.activeRequests.delete(requestId);
    this.metrics.concurrency.currentActive--;
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats(responseTime, requestId, queryType) {
    const times = this.metrics.performance.responseTimes;
    
    // Calculate average
    this.metrics.performance.averageResponseTime = 
      times.reduce((sum, t) => sum + t, 0) / times.length;

    // Calculate percentiles
    const sorted = [...times].sort((a, b) => a - b);
    this.metrics.performance.p95ResponseTime = 
      sorted[Math.floor(sorted.length * 0.95)];
    this.metrics.performance.p99ResponseTime = 
      sorted[Math.floor(sorted.length * 0.99)];

    // Track slowest requests
    if (responseTime > 2000) { // Slower than 2 seconds
      this.metrics.performance.slowestRequests.push({
        requestId,
        queryType,
        responseTime,
        timestamp: new Date().toISOString()
      });

      // Keep only last 10 slowest
      this.metrics.performance.slowestRequests = 
        this.metrics.performance.slowestRequests
          .sort((a, b) => b.responseTime - a.responseTime)
          .slice(0, 10);
    }
  }

  /**
   * Record an error
   */
  recordError(error, requestId, queryType) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[error.type || 'unknown'] = 
      (this.metrics.errors.byType[error.type || 'unknown'] || 0) + 1;

    this.metrics.errors.recent.push({
      requestId,
      queryType,
      error: error.message,
      type: error.type,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 errors
    if (this.metrics.errors.recent.length > 20) {
      this.metrics.errors.recent.shift();
    }
  }

  /**
   * Record engagement metrics
   * @param {string} userId - User identifier
   * @param {Object} engagement - Engagement data
   */
  recordEngagement(userId, engagement) {
    const { messageCount, sentiment, topics } = engagement;

    this.metrics.engagement.totalMessages += messageCount;

    // Track sentiment
    if (sentiment) {
      this.metrics.engagement.userSentiment[userId] = sentiment;
    }

    // Track topics
    if (topics && topics.length > 0) {
      topics.forEach(topic => {
        this.metrics.engagement.topicDistribution[topic] = 
          (this.metrics.engagement.topicDistribution[topic] || 0) + 1;
      });
    }

    // Update average conversation length
    const totalConversations = Object.keys(this.metrics.requests.byUser).length;
    this.metrics.engagement.averageConversationLength = 
      this.metrics.engagement.totalMessages / Math.max(1, totalConversations);
  }

  /**
   * Get current metrics snapshot
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0
    };
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    const { performance, requests, tokens } = this.metrics;

    return {
      health: this.getHealthStatus(),
      requests: {
        total: requests.total,
        perMinute: this.calculateRequestsPerMinute(),
        byQueryType: requests.byQueryType
      },
      performance: {
        average: Math.round(performance.averageResponseTime),
        p95: Math.round(performance.p95ResponseTime),
        p99: Math.round(performance.p99ResponseTime),
        target: 3000, // 3 seconds
        meetingTarget: performance.averageResponseTime < 3000
      },
      tokens: {
        total: tokens.total,
        average: Math.round(tokens.averagePerRequest),
        byQueryType: tokens.byQueryType
      },
      concurrency: {
        current: this.metrics.concurrency.currentActive,
        peak: this.metrics.concurrency.peakConcurrent
      }
    };
  }

  /**
   * Get health status
   * @returns {string} Health status: healthy, degraded, or critical
   */
  getHealthStatus() {
    const { averageResponseTime } = this.metrics.performance;
    const { currentActive } = this.metrics.concurrency;
    const errorRate = this.metrics.errors.total / Math.max(1, this.metrics.requests.total);

    if (averageResponseTime > 5000 || currentActive > 50 || errorRate > 0.1) {
      return 'critical';
    }
    
    if (averageResponseTime > 3000 || currentActive > 20 || errorRate > 0.05) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Calculate requests per minute
   */
  calculateRequestsPerMinute() {
    const recentRequests = this.metrics.performance.responseTimes
      .slice(-60); // Last 60 requests
    
    if (recentRequests.length === 0) return 0;

    const timeSpan = recentRequests.length > 1 
      ? (Date.now() - (Date.now() - recentRequests[0])) / 1000 / 60
      : 1;

    return Math.round(recentRequests.length / timeSpan);
  }

  /**
   * Get user-specific metrics
   * @param {string} userId - User identifier
   * @returns {Object} User metrics
   */
  getUserMetrics(userId) {
    return {
      totalRequests: this.metrics.requests.byUser[userId] || 0,
      totalTokens: this.metrics.tokens.byUser[userId] || 0,
      sentiment: this.metrics.engagement.userSentiment[userId] || 'neutral',
      averageTokensPerRequest: Math.round(
        (this.metrics.tokens.byUser[userId] || 0) / 
        Math.max(1, this.metrics.requests.byUser[userId] || 1)
      )
    };
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  reset() {
    this.metrics = {
      requests: { total: 0, byQueryType: {}, byUser: {} },
      performance: { responseTimes: [], averageResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0, slowestRequests: [] },
      tokens: { total: 0, byQueryType: {}, byUser: {}, averagePerRequest: 0 },
      engagement: { totalMessages: 0, averageConversationLength: 0, userSentiment: {}, topicDistribution: {} },
      errors: { total: 0, byType: {}, recent: [] },
      concurrency: { currentActive: 0, peakConcurrent: 0, queuedRequests: 0 }
    };
  }

  /**
   * Export metrics for dashboard/monitoring
   * @returns {Object} Formatted metrics for external systems
   */
  exportForDashboard() {
    const summary = this.getPerformanceSummary();
    
    return {
      timestamp: new Date().toISOString(),
      health: summary.health,
      metrics: {
        requests: {
          total: summary.requests.total,
          perMinute: summary.requests.perMinute,
          distribution: summary.requests.byQueryType
        },
        performance: {
          averageMs: summary.performance.average,
          p95Ms: summary.performance.p95,
          p99Ms: summary.performance.p99,
          targetMs: summary.performance.target,
          meetingTarget: summary.performance.meetingTarget,
          slowestRequests: this.metrics.performance.slowestRequests.slice(0, 5)
        },
        tokens: {
          total: summary.tokens.total,
          averagePerRequest: summary.tokens.average,
          byQueryType: summary.tokens.byQueryType
        },
        engagement: {
          totalMessages: this.metrics.engagement.totalMessages,
          averageConversationLength: Math.round(this.metrics.engagement.averageConversationLength),
          topTopics: this.getTopTopics(5),
          sentimentDistribution: this.getSentimentDistribution()
        },
        errors: {
          total: this.metrics.errors.total,
          rate: (this.metrics.errors.total / Math.max(1, this.metrics.requests.total) * 100).toFixed(2) + '%',
          byType: this.metrics.errors.byType,
          recent: this.metrics.errors.recent.slice(0, 5)
        },
        concurrency: {
          current: summary.concurrency.current,
          peak: summary.concurrency.peak
        }
      }
    };
  }

  /**
   * Get top topics
   */
  getTopTopics(limit = 5) {
    return Object.entries(this.metrics.engagement.topicDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Get sentiment distribution
   */
  getSentimentDistribution() {
    const sentiments = Object.values(this.metrics.engagement.userSentiment);
    const distribution = { positive: 0, neutral: 0, negative: 0, confused: 0, confident: 0 };
    
    sentiments.forEach(sentiment => {
      distribution[sentiment] = (distribution[sentiment] || 0) + 1;
    });

    return distribution;
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * import { PerformanceMonitor } from './performanceMonitor.js';
 * 
 * const monitor = new PerformanceMonitor();
 * 
 * // In your ChatService
 * async processUserMessage(message) {
 *   const requestId = `req_${Date.now()}`;
 *   monitor.startRequest(requestId, this.userId, queryType);
 *   
 *   try {
 *     const response = await this.generateResponse(message, queryType);
 *     const tokens = this.estimateTokens(response);
 *     
 *     monitor.completeRequest(requestId, { 
 *       tokens, 
 *       success: true 
 *     });
 *     
 *     return response;
 *   } catch (error) {
 *     monitor.completeRequest(requestId, { 
 *       success: false, 
 *       error: { message: error.message, type: error.name } 
 *     });
 *     throw error;
 *   }
 * }
 * 
 * // Get metrics
 * const metrics = monitor.getPerformanceSummary();
 * console.log('Average response time:', metrics.performance.average, 'ms');
 * console.log('Meeting 3s target:', metrics.performance.meetingTarget);
 * 
 * // Export for dashboard
 * const dashboardData = monitor.exportForDashboard();
 * // Send to monitoring service or display in admin panel
 */

export default PerformanceMonitor;
