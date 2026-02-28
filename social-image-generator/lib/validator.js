/**
 * Multi-layer Validation System
 *
 * Validates:
 * - Brand configurations (schema + business rules)
 * - Design outputs (contrast, color usage, brand compliance)
 * - Generated files (dimensions, size, format)
 * - Batch inputs (structure, content)
 */

const contrastChecker = require('./contrast-checker');
const security = require('./security');

class Validator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate brand configuration
   *
   * @param {Object} brand - Brand configuration
   * @returns {Object} Validation result
   */
  async validateBrandConfig(brand) {
    this.errors = [];
    this.warnings = [];

    // Check required fields
    this._validateRequiredFields(brand);

    // Validate colors
    this._validateColors(brand.colors);

    // Validate typography
    this._validateTypography(brand.typography);

    // Validate logos
    await this._validateLogos(brand.logos);

    // Validate platforms
    this._validatePlatforms(brand.platforms);

    // Check contrast ratios
    const contrastResults = contrastChecker.validateBrandColors(brand);
    this._processContrastResults(contrastResults);

    // Calculate stats
    const stats = {
      colors: this._countColors(brand.colors),
      gradients: brand.colors?.gradients?.length || 0,
      templates: brand.templates?.defaults ? Object.keys(brand.templates.defaults).length : 0,
      platforms: Object.keys(brand.platforms || {}).length
    };

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      stats,
      contrastResults
    };
  }

  /**
   * Validate required brand fields
   * @private
   */
  _validateRequiredFields(brand) {
    const required = {
      'client.id': brand.client?.id,
      'client.name': brand.client?.name,
      'colors': brand.colors,
      'typography': brand.typography,
      'logos.primary': brand.logos?.primary,
      'platforms': brand.platforms
    };

    for (const [field, value] of Object.entries(required)) {
      if (!value) {
        this.errors.push({ field, message: `Required field missing: ${field}` });
      }
    }
  }

  /**
   * Validate color configuration
   * @private
   */
  _validateColors(colors) {
    if (!colors) {
      this.errors.push({ field: 'colors', message: 'Color configuration is required' });
      return;
    }

    // Validate hex format for key colors
    const hexFields = {
      'colors.primary.main': colors.primary?.main,
      'colors.background.light': colors.background?.light,
      'colors.background.dark': colors.background?.dark,
      'colors.text.primary': colors.text?.primary,
      'colors.text.inverse': colors.text?.inverse
    };

    for (const [field, value] of Object.entries(hexFields)) {
      if (value && !this._isValidHex(value)) {
        this.errors.push({ field, message: `Invalid hex color: ${value}` });
      }
    }

    // Validate gradients
    if (colors.gradients) {
      colors.gradients.forEach((gradient, index) => {
        if (!gradient.css || !gradient.css.startsWith('linear-gradient(')) {
          this.errors.push({
            field: `colors.gradients[${index}]`,
            message: 'Gradient must have valid CSS linear-gradient value'
          });
        }
      });
    }
  }

  /**
   * Validate typography configuration
   * @private
   */
  _validateTypography(typography) {
    if (!typography) {
      this.errors.push({ field: 'typography', message: 'Typography configuration is required' });
      return;
    }

    if (!typography.families?.primary?.name) {
      this.errors.push({ field: 'typography.families.primary.name', message: 'Primary font family is required' });
    }

    if (!typography.scale?.base) {
      this.errors.push({ field: 'typography.scale.base', message: 'Base font size is required' });
    }

    if (!typography.hierarchy) {
      this.errors.push({ field: 'typography.hierarchy', message: 'Typography hierarchy is required' });
    }
  }

  /**
   * Validate logo configuration
   * @private
   */
  async _validateLogos(logos) {
    if (!logos?.primary?.path) {
      this.errors.push({ field: 'logos.primary.path', message: 'Primary logo path is required' });
      return;
    }

    // Validate logo file using security module
    try {
      await security.validateLogoFile(logos.primary.path);
    } catch (error) {
      this.errors.push({ field: 'logos.primary.path', message: error.message });
    }
  }

  /**
   * Validate platforms configuration
   * @private
   */
  _validatePlatforms(platforms) {
    if (!platforms || Object.keys(platforms).length === 0) {
      this.errors.push({ field: 'platforms', message: 'At least one platform must be configured' });
    }
  }

  /**
   * Process contrast validation results
   * @private
   */
  _processContrastResults(results) {
    results.forEach(result => {
      if (!result.meetsAA) {
        this.warnings.push({
          type: 'contrast',
          message: `${result.pair}: Ratio ${result.ratio}:1 is below WCAG AA standard (4.5:1)`,
          ...result
        });
      }
    });
  }

  /**
   * Validate batch input
   *
   * @param {Array} input - Batch input array
   * @throws {Error} If batch input is invalid
   */
  async validateBatchInput(input) {
    if (!Array.isArray(input)) {
      throw new Error('Batch input must be an array');
    }

    // Validate batch size
    security.validateBatchSize(input.length);

    for (let i = 0; i < input.length; i++) {
      const item = input[i];

      if (!item || typeof item !== 'object') {
        throw new Error(`Batch item ${i} must be an object`);
      }

      if (!item.content || typeof item.content !== 'object') {
        throw new Error(`Batch item ${i} missing valid content object`);
      }

      if (!item.content.main) {
        throw new Error(`Batch item ${i} missing content.main text`);
      }

      // Only allow expected keys
      const allowedKeys = ['template', 'platform', 'content', 'overrides'];
      const itemKeys = Object.keys(item);
      const invalidKeys = itemKeys.filter(k => !allowedKeys.includes(k));

      if (invalidKeys.length > 0) {
        throw new Error(`Batch item ${i} has invalid keys: ${invalidKeys.join(', ')}`);
      }
    }
  }

  /**
   * Check if hex color is valid
   * @private
   */
  _isValidHex(hex) {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  }

  /**
   * Count colors in brand config
   * @private
   */
  _countColors(colors) {
    let count = 0;
    if (colors?.primary) count++;
    if (colors?.secondary) count++;
    if (colors?.accent) count += colors.accent.length;
    return count;
  }

  /**
   * Get nested value from object
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
}

// Export singleton instance
module.exports = new Validator();
