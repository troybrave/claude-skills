/**
 * Asset Manager
 *
 * Handles loading and encoding of logo, font, and image assets
 * Implements caching and validation
 */

const fs = require('fs').promises;
const path = require('path');
const security = require('./security');

class AssetManager {
  constructor() {
    this.cache = new Map();
    this.fileHashes = new Map();
    this.maxCacheSize = 50;  // Limit cache size to prevent memory issues
  }

  /**
   * Load required assets for a template
   *
   * @param {Object} brand - Brand configuration
   * @param {string[]} requiredAssets - Array of required asset types
   * @returns {Promise<Object>} Loaded assets
   */
  async loadAssets(brand, requiredAssets = []) {
    const assets = {};

    for (const assetType of requiredAssets) {
      switch (assetType) {
        case 'logo':
          assets.logo = await this.loadLogo(brand);
          break;

        case 'logo-inverse':
          assets.logoInverse = await this.loadLogoInverse(brand);
          break;

        case 'icon':
          assets.icon = await this.loadIcon(brand);
          break;

        case 'texture':
          assets.textures = await this.loadTextures(brand);
          break;

        default:
          console.warn(`⚠️  Unknown asset type: ${assetType}`);
      }
    }

    return assets;
  }

  /**
   * Load primary logo
   *
   * @param {Object} brand - Brand configuration
   * @returns {Promise<Object>} Logo data
   */
  async loadLogo(brand) {
    const logoPath = brand._resolvedAssets?.logos?.primary || brand.logos?.primary?.path;

    if (!logoPath) {
      throw new Error('Primary logo not configured in brand');
    }

    return await this._loadImageWithCache(logoPath);
  }

  /**
   * Load inverse logo (for dark backgrounds)
   *
   * @param {Object} brand - Brand configuration
   * @returns {Promise<Object>} Logo data
   */
  async loadLogoInverse(brand) {
    const logoPath = brand._resolvedAssets?.logos?.inverse || brand.logos?.inverse?.path;

    if (!logoPath) {
      // Fallback to primary logo
      console.warn('⚠️  Inverse logo not found, using primary logo');
      return await this.loadLogo(brand);
    }

    return await this._loadImageWithCache(logoPath);
  }

  /**
   * Load icon logo
   *
   * @param {Object} brand - Brand configuration
   * @returns {Promise<Object>} Icon data
   */
  async loadIcon(brand) {
    const iconPath = brand._resolvedAssets?.logos?.icon || brand.logos?.icon?.path;

    if (!iconPath) {
      throw new Error('Icon logo not configured in brand');
    }

    return await this._loadImageWithCache(iconPath);
  }

  /**
   * Load texture overlays
   *
   * @param {Object} brand - Brand configuration
   * @returns {Promise<Array>} Array of loaded textures
   */
  async loadTextures(brand) {
    const textures = brand._resolvedAssets?.textures || [];
    const loaded = [];

    for (const texture of textures) {
      try {
        const data = await this._loadImageWithCache(texture.path);
        loaded.push({
          ...texture,
          ...data
        });
      } catch (error) {
        console.warn(`⚠️  Failed to load texture ${texture.path}: ${error.message}`);
      }
    }

    return loaded;
  }

  /**
   * Preload all assets for batch generation
   * Prevents file changes during batch and improves performance
   *
   * @param {Object} brand - Brand configuration
   * @param {Set} requiredAssetTypes - Set of required asset types
   */
  async preloadAssets(brand, requiredAssetTypes) {
    console.log('📦 Preloading assets for batch generation...');

    const assetTypes = Array.from(requiredAssetTypes);

    for (const assetType of assetTypes) {
      try {
        await this.loadAssets(brand, [assetType]);
      } catch (error) {
        console.warn(`⚠️  Failed to preload ${assetType}: ${error.message}`);
      }
    }

    console.log(`✅ Preloaded ${this.cache.size} assets`);
  }

  /**
   * Load image with caching and file change detection
   *
   * @private
   * @param {string} filepath - Path to image file
   * @returns {Promise<Object>} Image data with base64
   */
  async _loadImageWithCache(filepath) {
    // SECURITY: Validate asset path
    const validPath = await security.validateAssetPath(filepath);

    // Check if file exists
    try {
      await fs.access(validPath);
    } catch (error) {
      throw new Error(`Asset file not found: ${validPath}`);
    }

    // Calculate file hash (size + mtime)
    const stats = await fs.stat(validPath);
    const currentHash = `${stats.size}-${stats.mtime.getTime()}`;

    // Check if file changed since last load
    if (this.fileHashes.has(validPath)) {
      const previousHash = this.fileHashes.get(validPath);

      if (previousHash !== currentHash) {
        console.warn(`⚠️  File changed during generation, reloading: ${path.basename(validPath)}`);
        this.cache.delete(validPath);
      }
    }

    this.fileHashes.set(validPath, currentHash);

    // Check cache
    if (this.cache.has(validPath)) {
      return this.cache.get(validPath);
    }

    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.fileHashes.delete(firstKey);
    }

    // Load and encode image
    const imageData = await this._loadImageAsBase64(validPath);

    // Cache the data
    this.cache.set(validPath, imageData);

    return imageData;
  }

  /**
   * Load image file and encode as base64
   *
   * @private
   * @param {string} filepath - Path to image
   * @returns {Promise<Object>} Image data
   */
  async _loadImageAsBase64(filepath) {
    try {
      const buffer = await fs.readFile(filepath);
      const ext = path.extname(filepath).toLowerCase();

      // Determine MIME type
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };

      const mimeType = mimeTypes[ext] || 'image/png';
      const base64 = buffer.toString('base64');

      return {
        base64,
        mimeType,
        dataUri: `data:${mimeType};base64,${base64}`,
        size: buffer.length,
        filename: path.basename(filepath)
      };

    } catch (error) {
      throw new Error(`Failed to load image ${filepath}: ${error.message}`);
    }
  }

  /**
   * Clear cache
   *
   * @param {string} [filepath] - Specific file to clear, or all if not provided
   */
  clearCache(filepath = null) {
    if (filepath) {
      this.cache.delete(filepath);
      this.fileHashes.delete(filepath);
      console.log(`🗑️  Cleared cache for ${path.basename(filepath)}`);
    } else {
      const size = this.cache.size;
      this.cache.clear();
      this.fileHashes.clear();
      console.log(`🗑️  Cleared ${size} cached assets`);
    }
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    let totalSize = 0;

    for (const data of this.cache.values()) {
      totalSize += data.size || 0;
    }

    return {
      entries: this.cache.size,
      maxEntries: this.maxCacheSize,
      totalSize: this._formatBytes(totalSize),
      files: Array.from(this.cache.keys()).map(p => path.basename(p))
    };
  }

  /**
   * Format bytes to human-readable size
   *
   * @private
   */
  _formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Export singleton instance
module.exports = new AssetManager();
