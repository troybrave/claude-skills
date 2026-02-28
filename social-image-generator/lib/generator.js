/**
 * Image Generation Orchestrator
 *
 * Coordinates brand loading, template rendering, and image export
 * Integrates all security controls and resource management
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Security and validation
const security = require('./security');
const governor = require('./resource-governor');
const rateLimiter = require('./rate-limiter');
const validator = require('./validator');

// Core modules
const brandLoader = require('./brand-loader');
const templateEngine = require('./template-engine');
const assetManager = require('./asset-manager');

class ImageGenerator {
  /**
   * Generate a single image
   *
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async generateSingle(options) {
    const {
      clientId,
      template,
      platform,
      content,
      overrides = {},
      outputDir
    } = options;

    // SECURITY: Sanitize all inputs
    const safeClientId = security.sanitizeClientId(clientId);
    const safeTemplate = security.sanitizeTemplateName(template);
    const safePlatform = security.validatePlatform(platform);
    const safeContent = security.sanitizeContent(content);
    const safeOutputDir = await security.sanitizeOutputPath(outputDir);

    // SECURITY: Check rate limit
    rateLimiter.checkLimit(safeClientId);

    // SECURITY: Acquire resource slot
    await governor.acquire();

    try {
      console.log(`🎨 Generating ${safePlatform} image for ${safeClientId}...`);

      // Load brand configuration
      const brand = await brandLoader.load(safeClientId);

      // Parse platform specification
      const platformSpec = this._parsePlatformSpec(safePlatform, brand);

      // Load template
      const templateModule = await templateEngine.loadTemplate(safeTemplate);

      // Validate template compatibility
      if (!templateModule.platforms.includes(platformSpec.fullId)) {
        throw new Error(
          `Template "${safeTemplate}" does not support platform "${safePlatform}". ` +
          `Supported: ${templateModule.platforms.join(', ')}`
        );
      }

      // Load required assets
      const assets = await assetManager.loadAssets(
        brand,
        templateModule.requiredAssets || ['logo']
      );

      // Render HTML with template
      const html = await templateEngine.render(templateModule, {
        brand,
        content: safeContent,
        assets,
        platform: platformSpec,
        overrides
      });

      // Determine output path
      const outputPath = await this._getUniqueOutputPath(
        safeClientId,
        safeTemplate,
        safePlatform,
        safeOutputDir
      );

      // Generate image with Playwright
      const imageData = await this._generateImage(html, platformSpec, outputPath);

      // Validate output
      await this._validateOutput(outputPath, platformSpec);

      // Generate metadata
      const metadata = {
        clientId: safeClientId,
        template: safeTemplate,
        platform: safePlatform,
        content: safeContent,
        timestamp: new Date().toISOString(),
        dimensions: platformSpec.dimensions,
        fileSize: imageData.fileSize,
        brandVersion: brand.metadata?.version || 'unknown'
      };

      await fs.writeFile(
        outputPath.replace(/\.(png|jpg)$/, '.meta.json'),
        JSON.stringify(metadata, null, 2)
      );

      // Track disk usage
      governor.addDiskUsage(imageData.fileSize);

      // Record success
      governor.recordSuccess();

      console.log(`✅ Image generated: ${path.basename(outputPath)}`);

      return {
        path: outputPath,
        width: platformSpec.dimensions.width,
        height: platformSpec.dimensions.height,
        fileSize: this._formatBytes(imageData.fileSize),
        metadata
      };

    } finally {
      // SECURITY: Always release resource
      governor.release();
    }
  }

  /**
   * Generate image with Playwright
   * @private
   */
  async _generateImage(html, platformSpec, outputPath) {
    let browser;
    let killTimeout;

    try {
      // Launch browser with timeout
      browser = await chromium.launch({
        headless: true,
        timeout: 30000,
        args: [
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });

      // Set hard kill timeout (60 seconds)
      killTimeout = setTimeout(async () => {
        if (browser) {
          try {
            const pid = browser._initializer?.browserProcess?.pid;
            if (pid) {
              process.kill(pid, 'SIGKILL');
            }
          } catch (err) {
            console.error('Failed to kill zombie browser:', err);
          }
        }
      }, 60000);

      const context = await browser.newContext({
        viewport: {
          width: platformSpec.dimensions.width,
          height: platformSpec.dimensions.height
        },
        javaScriptEnabled: true,
        serviceWorkers: 'block'
      });

      const page = await context.newPage();

      // Block all network requests (except data URIs)
      await page.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith('data:') || url.startsWith('file:')) {
          route.continue();
        } else {
          route.abort();
        }
      });

      // Set content with timeout
      await page.setContent(html, {
        timeout: 10000,
        waitUntil: 'networkidle'
      });

      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready);

      // Disable animations
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      });

      // Take screenshot with timeout
      // Normalize format: 'jpg' -> 'jpeg' for Playwright
      const screenshotFormat = platformSpec.format === 'jpg' ? 'jpeg' : platformSpec.format;

      await page.screenshot({
        path: outputPath,
        type: screenshotFormat,
        quality: platformSpec.quality,
        timeout: 10000
      });

      // Get file size
      const stats = await fs.stat(outputPath);

      return { fileSize: stats.size };

    } finally {
      clearTimeout(killTimeout);

      if (browser) {
        try {
          await Promise.race([
            browser.close(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Browser close timeout')), 5000)
            )
          ]);
        } catch (error) {
          // Force kill if close fails
          try {
            const pid = browser._initializer?.browserProcess?.pid;
            if (pid) {
              process.kill(pid, 'SIGKILL');
            }
          } catch (killError) {
            console.error('Failed to kill browser:', killError);
          }
        }
      }
    }
  }

  /**
   * Parse platform specification string
   * @private
   */
  _parsePlatformSpec(platformStr, brand) {
    const [platform, type] = platformStr.split('-');

    if (!brand.platforms[platform] || !brand.platforms[platform][type]) {
      throw new Error(`Platform "${platformStr}" not configured in brand`);
    }

    const spec = brand.platforms[platform][type];

    return {
      platform,
      type,
      fullId: platformStr,
      dimensions: spec.dimensions,
      format: spec.format || 'jpg',
      quality: spec.quality || 90,
      maxFileSize: spec.maxFileSize
    };
  }

  /**
   * Get unique output path
   * @private
   */
  async _getUniqueOutputPath(clientId, template, platform, customDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const randomId = crypto.randomBytes(4).toString('hex');
    const processId = process.pid;

    const dirName = `${timestamp}-${processId}-${randomId}`;
    const defaultOutput = path.join(
      require('os').homedir(),
      'Documents', 'Projects', 'Full Vault',
      'Assets', 'Social Images', clientId, dirName
    );
    const baseDir = customDir || defaultOutput;

    await fs.mkdir(baseDir, { recursive: true });

    const filename = `${platform}-${template}-${Date.now()}.${platform.includes('png') ? 'png' : 'jpg'}`;
    return path.join(baseDir, filename);
  }

  /**
   * Validate output file
   * @private
   */
  async _validateOutput(outputPath, platformSpec) {
    const stats = await fs.stat(outputPath);

    // Check file size
    if (stats.size === 0) {
      throw new Error('Generated image file is empty');
    }

    if (platformSpec.maxFileSize) {
      const maxBytes = this._parseFileSize(platformSpec.maxFileSize);
      if (stats.size > maxBytes) {
        throw new Error(
          `File size ${this._formatBytes(stats.size)} exceeds maximum ${platformSpec.maxFileSize}`
        );
      }
    }

    // Validate image signature
    const buffer = await fs.readFile(outputPath);

    if (platformSpec.format === 'png') {
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      if (!buffer.slice(0, 8).equals(pngSignature)) {
        throw new Error('Invalid PNG signature - file may be corrupted');
      }
    } else if (platformSpec.format === 'jpg' || platformSpec.format === 'jpeg') {
      const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
      if (!buffer.slice(0, 3).equals(jpegSignature)) {
        throw new Error('Invalid JPEG signature - file may be corrupted');
      }
    }
  }

  /**
   * Format bytes
   * @private
   */
  _formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Parse file size string
   * @private
   */
  _parseFileSize(sizeStr) {
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
    if (!match) return Infinity;
    return parseFloat(match[1]) * (units[match[2].toUpperCase()] || 1);
  }
}

// Export singleton instance
module.exports = new ImageGenerator();
