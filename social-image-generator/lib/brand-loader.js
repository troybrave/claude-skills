/**
 * Brand Configuration Loader
 *
 * Loads, validates, and caches brand configurations
 * Integrates security checks and validation
 */

const path = require('path');
const fs = require('fs').promises;
const security = require('./security');
const validator = require('./validator');

class BrandLoader {
  constructor() {
    this.cache = new Map();
    this.brandsDir = path.join(__dirname, '..', 'brands');
  }

  /**
   * Load brand configuration
   *
   * @param {string} clientId - Client identifier
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Brand configuration
   */
  async load(clientId, options = {}) {
    const { skipCache = false, validate = true } = options;

    // SECURITY: Sanitize client ID
    const safeClientId = security.sanitizeClientId(clientId);

    // Check cache
    if (!skipCache && this.cache.has(safeClientId)) {
      console.log(`📦 Using cached brand config for ${safeClientId}`);
      return this.cache.get(safeClientId);
    }

    const configPath = path.join(this.brandsDir, `${safeClientId}.json`);

    // Read file safely
    let configData;
    try {
      const buffer = await fs.readFile(configPath);

      // SECURITY: Validate UTF-8
      try {
        configData = buffer.toString('utf-8');
      } catch (error) {
        throw new Error(`Brand configuration contains invalid UTF-8: ${error.message}`);
      }

      // Verify UTF-8 validity
      if (Buffer.from(configData, 'utf-8').toString('utf-8') !== configData) {
        throw new Error('Brand configuration file contains invalid UTF-8 characters');
      }

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Brand configuration not found for client "${safeClientId}"`);
      }
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied reading brand configuration for "${safeClientId}"`);
      }
      throw error;
    }

    // SECURITY: Parse JSON safely
    let config;
    try {
      config = security.parseJSONSafe(configData);
    } catch (error) {
      throw new Error(`Failed to parse brand configuration: ${error.message}`);
    }

    // Validate structure
    if (typeof config !== 'object' || config === null) {
      throw new Error('Brand configuration must be a JSON object');
    }

    // SECURITY: Validate logo paths
    if (config.logos?.primary?.path) {
      try {
        await security.validateLogoFile(config.logos.primary.path);
      } catch (error) {
        throw new Error(`Invalid primary logo: ${error.message}`);
      }
    }

    // Validate if requested
    if (validate) {
      const validation = await validator.validateBrandConfig(config);

      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => `  • ${e.field}: ${e.message}`).join('\n');
        throw new Error(`Brand configuration validation failed:\n${errorMessages}`);
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        console.warn(`⚠️  Brand configuration warnings for ${safeClientId}:`);
        validation.warnings.forEach(w => {
          console.warn(`   • ${w.message}`);
        });
      }
    }

    // Resolve asset paths
    config._resolvedAssets = await this._resolveAssetPaths(config);

    // Cache the config
    this.cache.set(safeClientId, config);

    console.log(`✅ Loaded brand config for ${safeClientId}`);

    return config;
  }

  /**
   * List all available clients
   *
   * @returns {Promise<string[]>} Array of client IDs
   */
  async listClients() {
    try {
      const files = await fs.readdir(this.brandsDir);

      return files
        .filter(f => f.endsWith('.json') && !f.startsWith('_'))
        .map(f => f.replace('.json', ''))
        .sort();

    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Check if client exists
   *
   * @param {string} clientId - Client identifier
   * @returns {Promise<boolean>} True if exists
   */
  async exists(clientId) {
    const safeClientId = security.sanitizeClientId(clientId);
    const configPath = path.join(this.brandsDir, `${safeClientId}.json`);

    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache
   *
   * @param {string} [clientId] - Specific client to clear, or all if not provided
   */
  clearCache(clientId = null) {
    if (clientId) {
      const safeClientId = security.sanitizeClientId(clientId);
      this.cache.delete(safeClientId);
      console.log(`🗑️  Cleared cache for ${safeClientId}`);
    } else {
      this.cache.clear();
      console.log(`🗑️  Cleared all brand config cache`);
    }
  }

  /**
   * Reload brand configuration (clear cache and load fresh)
   *
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} Brand configuration
   */
  async reload(clientId) {
    this.clearCache(clientId);
    return await this.load(clientId);
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      clients: Array.from(this.cache.keys())
    };
  }

  /**
   * Resolve and validate asset paths
   *
   * @private
   * @param {Object} config - Brand configuration
   * @returns {Promise<Object>} Resolved asset paths
   */
  async _resolveAssetPaths(config) {
    const resolved = {
      logos: {},
      fonts: {},
      textures: []
    };

    // Check primary logo
    if (config.logos?.primary?.path) {
      const exists = await this._fileExists(config.logos.primary.path);
      if (!exists) {
        throw new Error(`Primary logo not found: ${config.logos.primary.path}`);
      }
      resolved.logos.primary = config.logos.primary.path;
    }

    // Check icon logo (optional)
    if (config.logos?.icon?.path) {
      const exists = await this._fileExists(config.logos.icon.path);
      if (exists) {
        resolved.logos.icon = config.logos.icon.path;
      } else {
        console.warn(`⚠️  Icon logo not found: ${config.logos.icon.path}`);
      }
    }

    // Check inverse logo (optional)
    if (config.logos?.inverse?.path) {
      const exists = await this._fileExists(config.logos.inverse.path);
      if (exists) {
        resolved.logos.inverse = config.logos.inverse.path;
      } else {
        console.warn(`⚠️  Inverse logo not found: ${config.logos.inverse.path}`);
      }
    }

    // Validate textures if specified
    if (config.imagery?.textures) {
      for (const texture of config.imagery.textures) {
        const exists = await this._fileExists(texture.path);
        if (exists) {
          resolved.textures.push(texture);
        } else {
          console.warn(`⚠️  Texture not found: ${texture.path}`);
        }
      }
    }

    return resolved;
  }

  /**
   * Check if file exists
   *
   * @private
   * @param {string} filepath - File path to check
   * @returns {Promise<boolean>} True if exists
   */
  async _fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
module.exports = new BrandLoader();
