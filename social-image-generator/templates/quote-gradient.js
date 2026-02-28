/**
 * Template: Quote with Gradient Background
 *
 * Bold quote text on a gradient background with optional reference
 * Perfect for inspirational quotes, scripture verses, and key messages
 */

const security = require('../lib/security');

module.exports = {
  // Template metadata
  id: 'quote-gradient',
  name: 'Quote with Gradient Background',
  description: 'Bold quote text on a gradient background with optional reference',
  category: 'quote',

  // Platform compatibility
  platforms: [
    'instagram-feed',
    'instagram-story',
    'facebook-post',
    'twitter-post'
  ],

  // Required assets
  requiredAssets: ['logo'],

  // Customization options
  options: {
    gradient: {
      type: 'string',
      description: 'Gradient name from brand config (uses first gradient if not specified)',
      required: false
    },
    logoPlacement: {
      type: 'string',
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom-center'],
      default: 'bottom-center'
    },
    textAlign: {
      type: 'string',
      enum: ['left', 'center', 'right'],
      default: 'center'
    }
  },

  // Render function
  render: async (context) => {
    const {
      brand,
      content,
      assets,
      platform,
      overrides = {}
    } = context;

    // SECURITY: Escape all user content
    const safeContent = security.escapeHTML(content.main);
    const safeReference = content.reference ? security.escapeHTML(content.reference) : '';

    // Select gradient
    let gradient;
    if (overrides.gradient && brand.colors.gradients) {
      gradient = brand.colors.gradients.find(g => g.name === overrides.gradient);
    }
    if (!gradient && brand.colors.gradients && brand.colors.gradients.length > 0) {
      gradient = brand.colors.gradients[0];
    }
    if (!gradient) {
      // Fallback to primary color
      const primary = brand.colors.primary.main;
      const dark = brand.colors.primary.dark || primary;
      gradient = {
        css: `linear-gradient(135deg, ${primary} 0%, ${dark} 100%)`
      };
    }

    // Get dimensions
    const { width, height } = platform.dimensions;

    // Get safe zones
    const safeZone = brand.layout?.safeZones?.[platform.platform]?.[platform.type] || {
      top: 80,
      bottom: 80,
      left: 80,
      right: 80
    };

    // Get typography
    const quoteStyle = brand.typography?.hierarchy?.quote || {
      size: 48,
      weight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em'
    };

    const captionStyle = brand.typography?.hierarchy?.caption || {
      size: 24,
      weight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    };

    // Font family with web-safe fallback
    const fontFamily = brand.typography?.families?.primary?.fallback ||
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

    // Text color
    const textColor = brand.colors?.text?.inverse || '#FFFFFF';

    // Logo placement
    const logoPlacement = overrides.logoPlacement ||
      brand.logos?.primary?.preferredPlacement?.[0] ||
      'bottom-center';

    const logoStyle = getLogoPositionCSS(logoPlacement);

    // Text alignment
    const textAlign = overrides.textAlign || 'center';

    // Generate HTML
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, height=${height}">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${gradient.css};
      font-family: ${fontFamily};
      padding: ${safeZone.top}px ${safeZone.right}px ${safeZone.bottom}px ${safeZone.left}px;
      position: relative;
      overflow: hidden;
    }

    .container {
      text-align: ${textAlign};
      color: ${textColor};
      max-width: ${width - safeZone.left - safeZone.right}px;
      z-index: 2;
      position: relative;
    }

    .quote {
      font-size: ${quoteStyle.size}px;
      font-weight: ${quoteStyle.weight};
      line-height: ${quoteStyle.lineHeight};
      margin-bottom: 40px;
      text-shadow: 0 2px 20px rgba(0,0,0,0.3);
      letter-spacing: ${quoteStyle.letterSpacing || '-0.01em'};
    }

    .divider {
      width: 60px;
      height: 4px;
      background: ${textColor};
      margin: 30px ${textAlign === 'center' ? 'auto' : '0'};
      border-radius: 2px;
      opacity: 0.9;
    }

    .reference {
      font-size: ${captionStyle.size}px;
      font-weight: ${captionStyle.weight};
      line-height: ${captionStyle.lineHeight};
      opacity: 0.95;
      letter-spacing: ${captionStyle.letterSpacing || '0.05em'};
      text-transform: ${captionStyle.textTransform || 'uppercase'};
    }

    .logo {
      position: absolute;
      ${logoStyle}
      max-width: ${brand.logos?.primary?.maxWidth || 200}px;
      min-width: ${brand.logos?.primary?.minWidth || 100}px;
      z-index: 3;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 2px 10px rgba(0,0,0,0.3));
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="quote">"${safeContent}"</div>
    ${safeReference ? `
      <div class="divider"></div>
      <div class="reference">${safeReference}</div>
    ` : ''}
  </div>

  ${assets.logo ? `
    <div class="logo">
      <img src="${assets.logo.dataUri}" alt="Logo">
    </div>
  ` : ''}
</body>
</html>
    `.trim();
  }
};

/**
 * Get CSS positioning for logo based on placement
 */
function getLogoPositionCSS(placement) {
  const offset = 30;

  const positions = {
    'top-left': `top: ${offset}px; left: ${offset}px;`,
    'top-right': `top: ${offset}px; right: ${offset}px;`,
    'top-center': `top: ${offset}px; left: 50%; transform: translateX(-50%);`,
    'bottom-left': `bottom: ${offset}px; left: ${offset}px;`,
    'bottom-right': `bottom: ${offset}px; right: ${offset}px;`,
    'bottom-center': `bottom: ${offset}px; left: 50%; transform: translateX(-50%);`,
    'center': `top: 50%; left: 50%; transform: translate(-50%, -50%);`
  };

  return positions[placement] || positions['bottom-center'];
}
