/**
 * Contrast Checker
 *
 * WCAG 2.0 color contrast ratio calculator
 * Ensures accessibility compliance for all generated images
 *
 * Standards:
 * - WCAG AA: 4.5:1 for normal text, 3:1 for large text
 * - WCAG AAA: 7:1 for normal text, 4.5:1 for large text
 */

class ContrastChecker {
  /**
   * Calculate contrast ratio between two colors
   * Returns ratio (1-21) per WCAG guidelines
   *
   * @param {string} color1 - Hex color (e.g., "#FF0000")
   * @param {string} color2 - Hex color (e.g., "#FFFFFF")
   * @returns {number} Contrast ratio
   */
  calculate(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standard
   *
   * @param {string} color1 - Foreground color
   * @param {string} color2 - Background color
   * @param {boolean} largeText - Is this large text (18pt+ or 14pt+ bold)?
   * @returns {boolean} True if meets AA standard
   */
  meetsAA(color1, color2, largeText = false) {
    const ratio = this.calculate(color1, color2);
    const threshold = largeText ? 3.0 : 4.5;
    return ratio >= threshold;
  }

  /**
   * Check if contrast meets WCAG AAA standard
   *
   * @param {string} color1 - Foreground color
   * @param {string} color2 - Background color
   * @param {boolean} largeText - Is this large text?
   * @returns {boolean} True if meets AAA standard
   */
  meetsAAA(color1, color2, largeText = false) {
    const ratio = this.calculate(color1, color2);
    const threshold = largeText ? 4.5 : 7.0;
    return ratio >= threshold;
  }

  /**
   * Get relative luminance of a color
   * Per WCAG 2.0 formula
   *
   * @param {string} hexColor - Hex color
   * @returns {number} Relative luminance (0-1)
   */
  getLuminance(hexColor) {
    const rgb = this.hexToRgb(hexColor);

    // Convert RGB to relative luminance
    const [r, g, b] = rgb.map(val => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    // Calculate luminance using WCAG formula
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB array
   *
   * @param {string} hex - Hex color (with or without #)
   * @returns {number[]} RGB array [r, g, b]
   */
  hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Handle shorthand (e.g., #FFF)
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Validate
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error(`Invalid hex color: #${hex}`);
    }

    return [r, g, b];
  }

  /**
   * Convert RGB array to hex
   *
   * @param {number[]} rgb - RGB array [r, g, b]
   * @returns {string} Hex color with #
   */
  rgbToHex(rgb) {
    return '#' + rgb.map(v => {
      const hex = Math.round(Math.max(0, Math.min(255, v))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

  /**
   * Suggest better color if contrast is insufficient
   *
   * @param {string} foreground - Foreground color
   * @param {string} background - Background color
   * @param {number} targetRatio - Target contrast ratio (default 4.5)
   * @returns {Object} Suggestion result
   */
  suggestBetterColor(foreground, background, targetRatio = 4.5) {
    const MAX_ATTEMPTS = 20;

    const currentRatio = this.calculate(foreground, background);

    // Already meets target
    if (currentRatio >= targetRatio) {
      return {
        current: foreground,
        currentRatio: currentRatio.toFixed(2),
        sufficient: true,
        message: 'Current color already meets target contrast ratio'
      };
    }

    const rgb = this.hexToRgb(foreground);
    const backgroundLum = this.getLuminance(background);

    // Determine adjustment direction
    // If background is light, darken foreground; if dark, lighten foreground
    const adjustment = backgroundLum > 0.5 ? -15 : 15;

    let adjustedRgb = [...rgb];
    let previousRatio = currentRatio;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      // Adjust color
      adjustedRgb = adjustedRgb.map(v => Math.max(0, Math.min(255, v + adjustment)));
      const adjustedHex = this.rgbToHex(adjustedRgb);
      const newRatio = this.calculate(adjustedHex, background);

      // Check if we've reached target
      if (newRatio >= targetRatio) {
        return {
          current: foreground,
          suggested: adjustedHex,
          currentRatio: currentRatio.toFixed(2),
          suggestedRatio: newRatio.toFixed(2),
          sufficient: true,
          message: `Adjusted color meets target ratio`
        };
      }

      // Detect if we're stuck (not making progress)
      if (Math.abs(newRatio - previousRatio) < 0.01) {
        break;
      }

      previousRatio = newRatio;
      attempts++;
    }

    // Could not find sufficient contrast
    return {
      current: foreground,
      suggested: null,
      currentRatio: currentRatio.toFixed(2),
      sufficient: false,
      message: 'Unable to find sufficient contrast by adjusting brightness. Consider using a completely different color or adjusting the background.'
    };
  }

  /**
   * Batch validate all text/background combinations in brand config
   *
   * @param {Object} brand - Brand configuration
   * @returns {Array} Validation results
   */
  validateBrandColors(brand) {
    const results = [];

    // Primary text on light background
    if (brand.colors?.text?.primary && brand.colors?.background?.light) {
      const ratio = this.calculate(
        brand.colors.text.primary,
        brand.colors.background.light
      );

      results.push({
        pair: 'Primary text on light background',
        foreground: brand.colors.text.primary,
        background: brand.colors.background.light,
        ratio: ratio.toFixed(2),
        meetsAA: this.meetsAA(brand.colors.text.primary, brand.colors.background.light),
        meetsAAA: this.meetsAAA(brand.colors.text.primary, brand.colors.background.light),
        grade: this._getGrade(ratio)
      });
    }

    // Inverse text on dark background
    if (brand.colors?.text?.inverse && brand.colors?.background?.dark) {
      const ratio = this.calculate(
        brand.colors.text.inverse,
        brand.colors.background.dark
      );

      results.push({
        pair: 'Inverse text on dark background',
        foreground: brand.colors.text.inverse,
        background: brand.colors.background.dark,
        ratio: ratio.toFixed(2),
        meetsAA: this.meetsAA(brand.colors.text.inverse, brand.colors.background.dark),
        meetsAAA: this.meetsAAA(brand.colors.text.inverse, brand.colors.background.dark),
        grade: this._getGrade(ratio)
      });
    }

    // Primary color on light background (for buttons/CTAs)
    if (brand.colors?.primary?.main && brand.colors?.background?.light) {
      const ratio = this.calculate(
        brand.colors.primary.main,
        brand.colors.background.light
      );

      results.push({
        pair: 'Primary color on light background',
        foreground: brand.colors.primary.main,
        background: brand.colors.background.light,
        ratio: ratio.toFixed(2),
        meetsAA: this.meetsAA(brand.colors.primary.main, brand.colors.background.light),
        meetsAAA: this.meetsAAA(brand.colors.primary.main, brand.colors.background.light),
        grade: this._getGrade(ratio)
      });
    }

    // Secondary text on light background
    if (brand.colors?.text?.secondary && brand.colors?.background?.light) {
      const ratio = this.calculate(
        brand.colors.text.secondary,
        brand.colors.background.light
      );

      results.push({
        pair: 'Secondary text on light background',
        foreground: brand.colors.text.secondary,
        background: brand.colors.background.light,
        ratio: ratio.toFixed(2),
        meetsAA: this.meetsAA(brand.colors.text.secondary, brand.colors.background.light),
        meetsAAA: this.meetsAAA(brand.colors.text.secondary, brand.colors.background.light),
        grade: this._getGrade(ratio)
      });
    }

    return results;
  }

  /**
   * Get contrast grade
   *
   * @private
   * @param {number} ratio - Contrast ratio
   * @returns {string} Grade (AAA, AA, Fail)
   */
  _getGrade(ratio) {
    if (ratio >= 7.0) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3.0) return 'AA Large';
    return 'Fail';
  }

  /**
   * Get readable description of contrast quality
   *
   * @param {number} ratio - Contrast ratio
   * @returns {string} Description
   */
  getDescription(ratio) {
    if (ratio >= 7.0) return 'Excellent (WCAG AAA)';
    if (ratio >= 4.5) return 'Good (WCAG AA)';
    if (ratio >= 3.0) return 'Acceptable for large text only';
    if (ratio >= 2.0) return 'Poor - not recommended';
    return 'Very poor - inaccessible';
  }

  /**
   * Validate a color pair
   *
   * @param {string} foreground - Foreground color
   * @param {string} background - Background color
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validate(foreground, background, options = {}) {
    const { largeText = false, targetLevel = 'AA' } = options;

    const ratio = this.calculate(foreground, background);
    const meetsAA = this.meetsAA(foreground, background, largeText);
    const meetsAAA = this.meetsAAA(foreground, background, largeText);

    const targetMet = targetLevel === 'AAA' ? meetsAAA : meetsAA;

    const result = {
      foreground,
      background,
      ratio: ratio.toFixed(2),
      meetsAA,
      meetsAAA,
      targetLevel,
      targetMet,
      grade: this._getGrade(ratio),
      description: this.getDescription(ratio)
    };

    // Add suggestion if target not met
    if (!targetMet) {
      const targetRatio = targetLevel === 'AAA' ? (largeText ? 4.5 : 7.0) : (largeText ? 3.0 : 4.5);
      const suggestion = this.suggestBetterColor(foreground, background, targetRatio);
      result.suggestion = suggestion;
    }

    return result;
  }
}

// Export singleton instance
module.exports = new ContrastChecker();
