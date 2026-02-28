/**
 * Template: Professional Quote with Gradient
 *
 * Elite design with refined typography, elegant spacing, and sophisticated visual hierarchy
 * Perfect for inspirational quotes, scripture verses, and key messages
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-gradient-pro',
  name: 'Quote with Gradient (Professional)',
  description: 'Premium quote design with refined typography and elegant visual hierarchy',
  category: 'quote',
  platforms: ['instagram-feed', 'instagram-story', 'facebook-post', 'twitter-post'],
  requiredAssets: ['logo'],

  render: async (context) => {
    const { brand, content, assets, platform, overrides = {} } = context;

    const safeContent = security.escapeHTML(content.main);
    const safeReference = content.reference ? security.escapeHTML(content.reference) : '';

    // Gradient selection
    const gradient = overrides.gradient && brand.colors.gradients
      ? brand.colors.gradients.find(g => g.name === overrides.gradient)
      : brand.colors.gradients?.[0] || {
          css: `linear-gradient(135deg, ${brand.colors.primary.main} 0%, ${brand.colors.primary.dark || brand.colors.primary.main} 100%)`
        };

    const { width, height } = platform.dimensions;
    const safeZone = brand.layout?.safeZones?.[platform.platform]?.[platform.type] || { top: 100, bottom: 100, left: 100, right: 100 };

    const quoteSize = platform.platform === 'instagram' && platform.type === 'story' ? 56 : 52;
    const refSize = platform.platform === 'instagram' && platform.type === 'story' ? 22 : 20;

    const fontFamily = brand.typography?.families?.primary?.fallback ||
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
    const textColor = brand.colors?.text?.inverse || '#FFFFFF';

    const logoPlacement = overrides.logoPlacement || brand.logos?.primary?.preferredPlacement?.[0] || 'bottom-center';
    const logoCSS = getLogoPosition(logoPlacement, safeZone);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, height=${height}">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

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

    /* Subtle overlay for depth */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08) 0%, transparent 60%);
      pointer-events: none;
    }

    .container {
      text-align: center;
      color: ${textColor};
      max-width: ${width - safeZone.left - safeZone.right - 40}px;
      z-index: 2;
      position: relative;
    }

    /* Refined opening quote */
    .quote::before {
      content: '"';
      position: absolute;
      top: -12px;
      left: -4px;
      font-size: ${quoteSize * 1.8}px;
      opacity: 0.3;
      font-weight: 300;
      line-height: 1;
    }

    .quote {
      position: relative;
      font-size: ${quoteSize}px;
      font-weight: 600;
      line-height: 1.35;
      letter-spacing: -0.02em;
      margin-bottom: 48px;
      text-shadow: 0 4px 24px rgba(0,0,0,0.15);
      padding: 0 20px;
    }

    /* Elegant divider */
    .divider {
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, ${textColor} 50%, transparent 100%);
      margin: 0 auto 32px;
      opacity: 0.7;
      border-radius: 2px;
    }

    .reference {
      font-size: ${refSize}px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.95;
      text-shadow: 0 2px 12px rgba(0,0,0,0.12);
    }

    .logo {
      position: absolute;
      ${logoCSS}
      max-width: ${brand.logos?.primary?.maxWidth || 200}px;
      min-width: ${brand.logos?.primary?.minWidth || 100}px;
      z-index: 3;
      opacity: 0.95;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="quote">${safeContent}</div>
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
</html>`.trim();
  }
};

function getLogoPosition(placement, safeZone) {
  const offset = 40;
  const positions = {
    'top-left': `top: ${offset}px; left: ${offset}px;`,
    'top-right': `top: ${offset}px; right: ${offset}px;`,
    'top-center': `top: ${offset}px; left: 50%; transform: translateX(-50%);`,
    'bottom-left': `bottom: ${offset}px; left: ${offset}px;`,
    'bottom-right': `bottom: ${offset}px; right: ${offset}px;`,
    'bottom-center': `bottom: ${offset}px; left: 50%; transform: translateX(-50%);`
  };
  return positions[placement] || positions['bottom-center'];
}
