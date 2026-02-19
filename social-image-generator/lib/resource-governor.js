/**
 * Resource Governor
 *
 * Manages and enforces resource limits to prevent exhaustion attacks
 *
 * Protects against:
 * - CPU exhaustion (concurrent operation limits)
 * - Memory exhaustion (heap limit monitoring)
 * - Disk exhaustion (disk usage tracking)
 * - Long-running operations (timeout enforcement)
 */

class ResourceGovernor {
  constructor() {
    // Resource limits
    this.limits = {
      maxConcurrent: 5,                          // Max simultaneous generations
      maxMemory: 2 * 1024 * 1024 * 1024,        // 2GB heap limit
      maxDiskUsage: 10 * 1024 * 1024 * 1024,    // 10GB total output
      maxGenerationTime: 30000,                  // 30 seconds per generation
      maxBrowserCloseTime: 5000,                 // 5 seconds to close browser
      maxMemoryWarningThreshold: 0.8             // Warn at 80% memory usage
    };

    // Current resource usage
    this.current = {
      concurrent: 0,
      diskUsage: 0,
      peakMemory: 0
    };

    // Queue for waiting operations
    this.queue = [];

    // Statistics
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      queuedOperations: 0,
      rejectedOperations: 0
    };
  }

  /**
   * Acquire a resource slot
   * Blocks if at max concurrent operations
   *
   * @returns {Promise<void>}
   * @throws {Error} If resource limits exceeded
   */
  async acquire() {
    // Check limits before acquiring
    await this._checkLimits();

    // Wait if at max concurrent
    if (this.current.concurrent >= this.limits.maxConcurrent) {
      this.stats.queuedOperations++;

      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          // Remove from queue if timeout
          const index = this.queue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
          }
          reject(new Error('Resource acquisition timeout (queue full)'));
        }, 60000);  // 60 second queue timeout

        this.queue.push({ resolve, reject, timeoutId });
      });
    }

    this.current.concurrent++;
    this.stats.totalOperations++;
  }

  /**
   * Release a resource slot
   * Allows next queued operation to proceed
   */
  release() {
    if (this.current.concurrent > 0) {
      this.current.concurrent--;
    }

    // Process queue
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      clearTimeout(next.timeoutId);
      next.resolve();
    }
  }

  /**
   * Record successful operation
   */
  recordSuccess() {
    this.stats.successfulOperations++;
  }

  /**
   * Record failed operation
   */
  recordFailure() {
    this.stats.failedOperations++;
  }

  /**
   * Add disk usage
   *
   * @param {number} bytes - Bytes to add
   */
  addDiskUsage(bytes) {
    this.current.diskUsage += bytes;
  }

  /**
   * Get current resource usage
   *
   * @returns {Object} Current usage stats
   */
  getUsage() {
    const memUsage = process.memoryUsage();

    return {
      concurrent: this.current.concurrent,
      maxConcurrent: this.limits.maxConcurrent,
      queueLength: this.queue.length,
      memoryUsed: memUsage.heapUsed,
      memoryLimit: this.limits.maxMemory,
      memoryPercent: ((memUsage.heapUsed / this.limits.maxMemory) * 100).toFixed(1),
      diskUsed: this.current.diskUsage,
      diskLimit: this.limits.maxDiskUsage,
      diskPercent: ((this.current.diskUsage / this.limits.maxDiskUsage) * 100).toFixed(1)
    };
  }

  /**
   * Get statistics
   *
   * @returns {Object} Operation statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalOperations > 0
        ? ((this.stats.successfulOperations / this.stats.totalOperations) * 100).toFixed(1)
        : '0.0'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      queuedOperations: 0,
      rejectedOperations: 0
    };
  }

  /**
   * Get resource limits
   *
   * @returns {Object} Current limits
   */
  getLimits() {
    return { ...this.limits };
  }

  /**
   * Update resource limits
   * Useful for testing or dynamic adjustment
   *
   * @param {Object} newLimits - Partial limits to update
   */
  updateLimits(newLimits) {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Check if resources are available
   *
   * @returns {boolean} True if resources available
   */
  isAvailable() {
    return this.current.concurrent < this.limits.maxConcurrent;
  }

  /**
   * Force garbage collection if available
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      console.log('🗑️  Forced garbage collection');
    } else {
      console.warn('⚠️  Garbage collection not available (run with --expose-gc)');
    }
  }

  /**
   * Check resource limits
   * Throws if limits exceeded
   *
   * @private
   * @throws {Error} If resource limits exceeded
   */
  async _checkLimits() {
    // Check memory
    const memUsage = process.memoryUsage();
    const memPercent = memUsage.heapUsed / this.limits.maxMemory;

    // Update peak memory
    if (memUsage.heapUsed > this.current.peakMemory) {
      this.current.peakMemory = memUsage.heapUsed;
    }

    // Warn at 80%
    if (memPercent > this.limits.maxMemoryWarningThreshold) {
      console.warn(
        `⚠️  Memory usage high: ${this._formatBytes(memUsage.heapUsed)} / ` +
        `${this._formatBytes(this.limits.maxMemory)} (${(memPercent * 100).toFixed(1)}%)`
      );

      // Try to free memory
      this.forceGC();

      // Check again after GC
      const newMemUsage = process.memoryUsage().heapUsed;
      const newMemPercent = newMemUsage / this.limits.maxMemory;

      if (newMemPercent > 1.0) {
        this.stats.rejectedOperations++;
        throw new Error(
          `Memory limit exceeded: ${this._formatBytes(newMemUsage)} / ` +
          `${this._formatBytes(this.limits.maxMemory)}`
        );
      }
    }

    // Hard limit at 100%
    if (memPercent > 1.0) {
      this.stats.rejectedOperations++;
      throw new Error(
        `Memory limit exceeded: ${this._formatBytes(memUsage.heapUsed)} / ` +
        `${this._formatBytes(this.limits.maxMemory)}`
      );
    }

    // Check disk usage
    if (this.current.diskUsage > this.limits.maxDiskUsage) {
      this.stats.rejectedOperations++;
      throw new Error(
        `Disk usage limit exceeded: ${this._formatBytes(this.current.diskUsage)} / ` +
        `${this._formatBytes(this.limits.maxDiskUsage)}`
      );
    }
  }

  /**
   * Format bytes to human-readable size
   *
   * @private
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted size
   */
  _formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Shutdown gracefully
   * Waits for all operations to complete
   *
   * @param {number} timeout - Max wait time in ms
   * @returns {Promise<void>}
   */
  async shutdown(timeout = 30000) {
    const startTime = Date.now();

    console.log('🛑 Resource governor shutting down...');
    console.log(`   Waiting for ${this.current.concurrent} operations to complete...`);

    // Reject all queued operations
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      clearTimeout(next.timeoutId);
      next.reject(new Error('System shutting down'));
    }

    // Wait for active operations
    while (this.current.concurrent > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn(`⚠️  Shutdown timeout: ${this.current.concurrent} operations still active`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Resource governor shutdown complete');
    console.log(`   Final stats:`, this.getStats());
  }
}

// Export singleton instance
module.exports = new ResourceGovernor();
