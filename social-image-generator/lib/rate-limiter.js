/**
 * Rate Limiter
 *
 * Per-client rate limiting to prevent abuse
 *
 * Protects against:
 * - API abuse
 * - Resource monopolization
 * - Accidental infinite loops
 */

class RateLimiter {
  constructor() {
    // Rate limits
    this.limits = {
      perMinute: 20,     // 20 requests per minute
      perHour: 1000,     // 1,000 requests per hour
      perDay: 5000       // 5,000 requests per day
    };

    // Request history: clientId -> array of timestamps
    this.requests = new Map();

    // Violation tracking
    this.violations = new Map();

    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      uniqueClients: 0
    };

    // Start periodic cleanup
    this._startCleanup();
  }

  /**
   * Check rate limit for a client
   *
   * @param {string} clientId - Client identifier
   * @throws {Error} If rate limit exceeded
   */
  checkLimit(clientId) {
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;

    // Get request history
    const requests = this.requests.get(clientId) || [];

    // Count recent requests
    const recentMinute = requests.filter(t => t > minuteAgo).length;
    const recentHour = requests.filter(t => t > hourAgo).length;
    const recentDay = requests.filter(t => t > dayAgo).length;

    // Check limits
    if (recentMinute >= this.limits.perMinute) {
      this._recordViolation(clientId, 'minute');
      this.stats.blockedRequests++;

      throw new Error(
        `Rate limit exceeded: ${this.limits.perMinute} requests per minute. ` +
        `Try again in ${this._getRetryAfter(requests, minuteAgo, 60000)} seconds.`
      );
    }

    if (recentHour >= this.limits.perHour) {
      this._recordViolation(clientId, 'hour');
      this.stats.blockedRequests++;

      throw new Error(
        `Rate limit exceeded: ${this.limits.perHour} requests per hour. ` +
        `Try again in ${this._getRetryAfter(requests, hourAgo, 3600000)} seconds.`
      );
    }

    if (recentDay >= this.limits.perDay) {
      this._recordViolation(clientId, 'day');
      this.stats.blockedRequests++;

      throw new Error(
        `Rate limit exceeded: ${this.limits.perDay} requests per day. ` +
        `Try again in ${this._getRetryAfter(requests, dayAgo, 86400000)} seconds.`
      );
    }

    // Record this request
    const recentDayRequests = requests.filter(t => t > dayAgo);
    recentDayRequests.push(now);
    this.requests.set(clientId, recentDayRequests);

    // Update stats
    this.stats.totalRequests++;

    if (!requests.length) {
      this.stats.uniqueClients++;
    }
  }

  /**
   * Get remaining requests for a client
   *
   * @param {string} clientId - Client identifier
   * @returns {Object} Remaining requests for each time window
   */
  getRemaining(clientId) {
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;

    const requests = this.requests.get(clientId) || [];

    const recentMinute = requests.filter(t => t > minuteAgo).length;
    const recentHour = requests.filter(t => t > hourAgo).length;
    const recentDay = requests.filter(t => t > dayAgo).length;

    return {
      minute: {
        limit: this.limits.perMinute,
        used: recentMinute,
        remaining: Math.max(0, this.limits.perMinute - recentMinute)
      },
      hour: {
        limit: this.limits.perHour,
        used: recentHour,
        remaining: Math.max(0, this.limits.perHour - recentHour)
      },
      day: {
        limit: this.limits.perDay,
        used: recentDay,
        remaining: Math.max(0, this.limits.perDay - recentDay)
      }
    };
  }

  /**
   * Get violations for a client
   *
   * @param {string} clientId - Client identifier
   * @returns {Array} Violation history
   */
  getViolations(clientId) {
    return this.violations.get(clientId) || [];
  }

  /**
   * Reset rate limit for a client
   * Useful for testing or manual intervention
   *
   * @param {string} clientId - Client identifier
   */
  reset(clientId) {
    this.requests.delete(clientId);
    this.violations.delete(clientId);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.requests.clear();
    this.violations.clear();
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      uniqueClients: 0
    };
  }

  /**
   * Get statistics
   *
   * @returns {Object} Rate limiter statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeClients: this.requests.size,
      clientsWithViolations: this.violations.size,
      blockRate: this.stats.totalRequests > 0
        ? ((this.stats.blockedRequests / this.stats.totalRequests) * 100).toFixed(1)
        : '0.0'
    };
  }

  /**
   * Get rate limits
   *
   * @returns {Object} Current rate limits
   */
  getLimits() {
    return { ...this.limits };
  }

  /**
   * Update rate limits
   * Useful for testing or dynamic adjustment
   *
   * @param {Object} newLimits - Partial limits to update
   */
  updateLimits(newLimits) {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Check if client is approaching limit
   *
   * @param {string} clientId - Client identifier
   * @param {number} threshold - Warning threshold (0-1)
   * @returns {Object|null} Warning info if approaching limit
   */
  checkWarning(clientId, threshold = 0.8) {
    const remaining = this.getRemaining(clientId);

    // Check each time window
    for (const [window, data] of Object.entries(remaining)) {
      const percentUsed = data.used / data.limit;

      if (percentUsed >= threshold && percentUsed < 1.0) {
        return {
          window,
          used: data.used,
          limit: data.limit,
          remaining: data.remaining,
          percentUsed: (percentUsed * 100).toFixed(1)
        };
      }
    }

    return null;
  }

  /**
   * Periodic cleanup of old entries
   *
   * @private
   */
  cleanup() {
    const dayAgo = Date.now() - 86400000;
    let cleaned = 0;

    for (const [clientId, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(t => t > dayAgo);

      if (recent.length === 0) {
        this.requests.delete(clientId);
        cleaned++;
      } else {
        this.requests.set(clientId, recent);
      }
    }

    // Clean up old violations (keep last 7 days)
    const weekAgo = Date.now() - 604800000;

    for (const [clientId, violations] of this.violations.entries()) {
      const recent = violations.filter(v => v.timestamp > weekAgo);

      if (recent.length === 0) {
        this.violations.delete(clientId);
      } else {
        this.violations.set(clientId, recent);
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleaned up ${cleaned} inactive clients`);
    }
  }

  /**
   * Start periodic cleanup
   *
   * @private
   */
  _startCleanup() {
    // Cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 600000);

    // Don't block Node.js exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Record a rate limit violation
   *
   * @private
   * @param {string} clientId - Client identifier
   * @param {string} window - Time window (minute, hour, day)
   */
  _recordViolation(clientId, window) {
    const violations = this.violations.get(clientId) || [];

    violations.push({
      timestamp: Date.now(),
      window,
      limit: this.limits[`per${window.charAt(0).toUpperCase()}${window.slice(1)}`]
    });

    this.violations.set(clientId, violations);

    // Log repeated violations
    const recentViolations = violations.filter(v => v.timestamp > Date.now() - 3600000);
    if (recentViolations.length > 5) {
      console.warn(
        `⚠️  Client ${clientId} has ${recentViolations.length} rate limit violations in the last hour`
      );
    }
  }

  /**
   * Calculate retry-after seconds
   *
   * @private
   * @param {Array} requests - Request timestamps
   * @param {number} windowStart - Window start time
   * @param {number} windowDuration - Window duration in ms
   * @returns {number} Seconds until oldest request expires
   */
  _getRetryAfter(requests, windowStart, windowDuration) {
    const requestsInWindow = requests.filter(t => t > windowStart);

    if (requestsInWindow.length === 0) {
      return 0;
    }

    // Time until oldest request in window expires
    const oldestRequest = Math.min(...requestsInWindow);
    const expiresAt = oldestRequest + windowDuration;
    const retryAfter = Math.ceil((expiresAt - Date.now()) / 1000);

    return Math.max(1, retryAfter);
  }

  /**
   * Shutdown gracefully
   */
  shutdown() {
    this.stopCleanup();
    console.log('✅ Rate limiter shutdown complete');
    console.log(`   Final stats:`, this.getStats());
  }
}

// Export singleton instance
module.exports = new RateLimiter();
