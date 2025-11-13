/**
 * Alpha Vantage Rate Limiter
 * 
 * Implements a request queue with rate limiting for Alpha Vantage API calls.
 * Free tier: 5 calls per minute, 500 calls per day
 * 
 * Features:
 * - Request queue to prevent exceeding rate limits
 * - Exponential backoff on rate limit errors
 * - Automatic retry with delays
 * - Per-minute and per-day tracking
 */

class AlphaVantageRateLimiter {
  constructor(options = {}) {
    // Rate limits (free tier)
    this.maxCallsPerMinute = options.maxCallsPerMinute || 5;
    this.maxCallsPerDay = options.maxCallsPerDay || 500;
    this.initialDelay = options.initialDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 60000; // 60 seconds
    this.maxRetries = options.maxRetries || 3;

    // Request queue
    this.queue = [];
    this.processing = false;

    // Rate limit tracking
    this.callsThisMinute = [];
    this.callsToday = 0;
    this.lastResetDate = new Date().toDateString();
    this.rateLimitUntil = null; // Timestamp when rate limit expires

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Reset daily counter if it's a new day
   */
  resetDailyCounter() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.callsToday = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * Clean up old minute-level calls
   */
  cleanupMinuteCalls() {
    const oneMinuteAgo = Date.now() - 60000;
    this.callsThisMinute = this.callsThisMinute.filter(
      timestamp => timestamp > oneMinuteAgo
    );
  }

  /**
   * Check if we can make a request now
   */
  canMakeRequest() {
    this.resetDailyCounter();
    this.cleanupMinuteCalls();

    // Check daily limit
    if (this.callsToday >= this.maxCallsPerDay) {
      return {
        canMake: false,
        reason: 'daily_limit',
        waitUntil: null // Can't make more today
      };
    }

    // Check if we're currently rate limited
    if (this.rateLimitUntil && Date.now() < this.rateLimitUntil) {
      return {
        canMake: false,
        reason: 'rate_limited',
        waitUntil: this.rateLimitUntil
      };
    }

    // Check per-minute limit
    if (this.callsThisMinute.length >= this.maxCallsPerMinute) {
      const oldestCall = this.callsThisMinute[0];
      const waitTime = 60000 - (Date.now() - oldestCall);
      return {
        canMake: false,
        reason: 'minute_limit',
        waitUntil: Date.now() + waitTime
      };
    }

    return { canMake: true };
  }

  /**
   * Calculate delay before next request
   */
  calculateDelay() {
    const check = this.canMakeRequest();
    if (check.canMake) {
      return 0;
    }

    if (check.waitUntil) {
      return Math.max(0, check.waitUntil - Date.now());
    }

    // If daily limit reached, return a long delay
    if (check.reason === 'daily_limit') {
      return 24 * 60 * 60 * 1000; // 24 hours
    }

    // Default delay
    return 12000; // 12 seconds (slightly more than 1 minute / 5 calls)
  }

  /**
   * Record a successful API call
   */
  recordCall() {
    this.callsThisMinute.push(Date.now());
    this.callsToday++;
  }

  /**
   * Handle rate limit error
   */
  handleRateLimitError() {
    // Set rate limit for 1 minute
    this.rateLimitUntil = Date.now() + 60000;
    console.warn('[AlphaVantageRateLimiter] Rate limit hit, backing off for 1 minute');
  }

  /**
   * Add request to queue
   */
  async enqueue(requestFn, retryCount = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
        retryCount,
        addedAt: Date.now()
      });
    });
  }

  /**
   * Process the queue
   */
  async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    while (true) {
      if (this.queue.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const item = this.queue[0];
      const check = this.canMakeRequest();

      if (!check.canMake) {
        const delay = this.calculateDelay();
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (delay >= 24 * 60 * 60 * 1000) {
          // Daily limit reached - reject all queued requests
          item.reject(new Error('Alpha Vantage daily API limit reached. Please try again tomorrow.'));
          this.queue.shift();
          continue;
        }
        continue;
      }

      // Remove from queue
      this.queue.shift();

      try {
        // Make the request
        this.recordCall();
        const result = await item.requestFn();

        // Check if response indicates rate limit
        if (result && typeof result === 'object') {
          if (result['Note'] || result['Error Message']?.includes('rate limit')) {
            this.handleRateLimitError();
            // Retry with exponential backoff
            if (item.retryCount < this.maxRetries) {
              const backoffDelay = Math.min(
                this.initialDelay * Math.pow(2, item.retryCount),
                this.maxDelay
              );
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              this.queue.unshift({
                ...item,
                retryCount: item.retryCount + 1
              });
              continue;
            }
            item.reject(new Error('Alpha Vantage API rate limit exceeded. Please try again later.'));
            continue;
          }
        }

        item.resolve(result);
      } catch (error) {
        // Check if it's a rate limit error
        if (
          error.message?.includes('rate limit') ||
          error.message?.includes('429') ||
          error.status === 429
        ) {
          this.handleRateLimitError();
          // Retry with exponential backoff
          if (item.retryCount < this.maxRetries) {
            const backoffDelay = Math.min(
              this.initialDelay * Math.pow(2, item.retryCount),
              this.maxDelay
            );
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            this.queue.unshift({
              ...item,
              retryCount: item.retryCount + 1
            });
            continue;
          }
        }

        item.reject(error);
      }
    }
  }

  /**
   * Make a rate-limited request
   */
  async request(requestFn) {
    return this.enqueue(requestFn);
  }

  /**
   * Get queue status
   */
  getStatus() {
    this.resetDailyCounter();
    this.cleanupMinuteCalls();

    return {
      queueLength: this.queue.length,
      callsThisMinute: this.callsThisMinute.length,
      callsToday: this.callsToday,
      maxCallsPerMinute: this.maxCallsPerMinute,
      maxCallsPerDay: this.maxCallsPerDay,
      rateLimited: this.rateLimitUntil ? Date.now() < this.rateLimitUntil : false,
      rateLimitUntil: this.rateLimitUntil
    };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Singleton instance
let rateLimiterInstance = null;

/**
 * Get or create the rate limiter instance
 */
function getRateLimiter(options = {}) {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new AlphaVantageRateLimiter(options);
  }
  return rateLimiterInstance;
}

module.exports = {
  AlphaVantageRateLimiter,
  getRateLimiter
};

