/**
 * Template Engine
 *
 * Loads and renders templates with brand context
 * Validates template structure and output
 */

const path = require('path');
const fs = require('fs').promises;
const security = require('./security');

class TemplateEngine {
  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.cache = new Map();
  }

  /**
   * Load a template module
   *
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Template module
   */
  async loadTemplate(templateId) {
    // SECURITY: Sanitize template name
    const safeTemplateId = security.sanitizeTemplateName(templateId);

    const templatePath = path.join(this.templatesDir, `${safeTemplateId}.js`);

    try {
      // Clear require cache for hot reloading during development
      delete require.cache[require.resolve(templatePath)];

      const template = require(templatePath);

      // Validate template structure
      this._validateTemplate(template);

      return template;

    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(`Template "${safeTemplateId}" not found`);
      }
      throw error;
    }
  }

  /**
   * Render a template with context
   *
   * @param {Object} template - Template module
   * @param {Object} context - Render context
   * @returns {Promise<string>} Rendered HTML
   */
  async render(template, context, depth = 0) {
    const MAX_DEPTH = 5;

    if (depth > MAX_DEPTH) {
      throw new Error('Template render depth exceeded - possible infinite recursion');
    }

    // Validate context
    this._validateContext(context);

    // Apply defaults for optional overrides
    const fullContext = {
      ...context,
      overrides: {
        ...context.overrides
      }
    };

    // Call template render function with timeout
    let html;
    try {
      html = await Promise.race([
        template.render(fullContext),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Template render timeout')), 15000)
        )
      ]);
    } catch (error) {
      if (error.message.includes('Maximum call stack size exceeded')) {
        throw new Error('Template render caused stack overflow - check for infinite recursion');
      }
      throw new Error(`Template rendering failed: ${error.message}`);
    }

    // Validate output
    if (typeof html !== 'string') {
      throw new Error('Template render must return a string');
    }

    if (html.length === 0) {
      throw new Error('Template render returned empty string');
    }

    if (html.length > 10 * 1024 * 1024) {  // 10MB
      throw new Error('Template render output is too large (>10MB)');
    }

    return html;
  }

  /**
   * List all available templates
   *
   * @returns {Promise<Array>} Array of template metadata
   */
  async listTemplates() {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templates = [];

      for (const file of files) {
        if (file.endsWith('.js') && file !== 'registry.js') {
          try {
            const templateId = file.replace('.js', '');
            const template = await this.loadTemplate(templateId);

            templates.push({
              id: template.id,
              name: template.name,
              description: template.description,
              category: template.category || 'general',
              platforms: template.platforms || []
            });
          } catch (error) {
            console.warn(`⚠️  Failed to load template ${file}:`, error.message);
          }
        }
      }

      return templates.sort((a, b) => a.id.localeCompare(b.id));

    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get templates by category
   *
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of templates
   */
  async getByCategory(category) {
    const all = await this.listTemplates();
    return all.filter(t => t.category === category);
  }

  /**
   * Get templates by platform
   *
   * @param {string} platform - Platform identifier
   * @returns {Promise<Array>} Array of templates
   */
  async getByPlatform(platform) {
    const all = await this.listTemplates();
    return all.filter(t => t.platforms.includes(platform));
  }

  /**
   * Validate template structure
   *
   * @private
   * @param {Object} template - Template module
   */
  _validateTemplate(template) {
    const required = ['id', 'name', 'description', 'platforms', 'render'];

    for (const field of required) {
      if (!template[field]) {
        throw new Error(`Template missing required field: ${field}`);
      }
    }

    if (typeof template.render !== 'function') {
      throw new Error('Template render must be a function');
    }

    if (!Array.isArray(template.platforms) || template.platforms.length === 0) {
      throw new Error('Template must specify at least one platform');
    }

    // Validate platforms
    const validPlatforms = [
      'instagram-feed',
      'instagram-story',
      'instagram-carousel',
      'facebook-post',
      'facebook-story',
      'twitter-post',
      'linkedin-post'
    ];

    for (const platform of template.platforms) {
      if (!validPlatforms.includes(platform)) {
        throw new Error(`Invalid platform in template: ${platform}`);
      }
    }
  }

  /**
   * Validate render context
   *
   * @private
   * @param {Object} context - Render context
   */
  _validateContext(context) {
    if (!context.brand) {
      throw new Error('Context missing brand configuration');
    }

    if (!context.content) {
      throw new Error('Context missing content data');
    }

    if (!context.platform) {
      throw new Error('Context missing platform specification');
    }
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️  Cleared template cache');
  }
}

// Export singleton instance
module.exports = new TemplateEngine();
