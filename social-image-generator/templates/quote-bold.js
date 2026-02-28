/**
 * Template: Bold Quote
 *
 * High-impact design with dynamic typography and visual energy
 * Perfect for powerful statements and attention-grabbing content
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-bold',
  name: 'Quote Bold',
  description: 'High-impact design with oversized typography and dynamic energy',
  category: 'quote',
  platforms: ['instagram-feed', 'instagram-story', 'facebook-post', 'twitter-post'],
  requiredAssets: ['logo'],

  render: async (context) => {
    const { brand, content, assets, platform, overrides = {} } = context;

    const safeContent = security.escapeHTML(content.main);
    const safeReference = content.reference ? security.escapeHTML(content.reference) : '';

    // Use secondary/accent gradient if available
    const gradient = overrides.gradient && brand.colors.gradients
      ? brand.colors.gradients.find(g => g.name === overrides.gradient)
      : brand.colors.gradients?.[1] || brand.colors.gradients?.[0] || {
          css: `linear-gradient(135deg, ${brand.colors.accent?.main || brand.colors.primary.main} 0%, ${brand.colors.accent?.dark || brand.colors.primary.dark || brand.colors.primary.main} 100%)`
        };

    const { width, height } = platform.dimensions;
    const safeZone = brand.layout?.safeZones?.[platform.platform]?.[platform.type] || { top: 80, bottom: 80, left: 80, right: 80 };

    const quoteSize = platform.platform === 'instagram' && platform.type === 'story' ? 72 : 68;
    const refSize = platform.platform === 'instagram' && platform.type === 'story' ? 24 : 22;

    const fontFamily = brand.typography?.families?.heading?.fallback || brand.typography?.families?.primary?.fallback ||
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
    const textColor = brand.colors?.text?.inverse || '#FFFFFF';

    const logoPlacement = overrides.logoPlacement || brand.logos?.primary?.preferredPlacement?.[0] || 'top-right';
    const logoCSS = getLogoPosition(logoPlacement);

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

    /* Dynamic background pattern */
    body::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(0,0,0,0.12) 0%, transparent 50%);
      pointer-events: none;
      animation: pulse 8s ease-in-out infinite alternate;
    }

    @keyframes pulse {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-5%, -5%) scale(1.05); }
    }

    .container {
      text-align: center;
      color: ${textColor};
      max-width: ${width - safeZone.left - safeZone.right}px;
      z-index: 2;
      position: relative;
    }

    .quote {
      font-size: ${quoteSize}px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      margin-bottom: ${safeReference ? '40px' : '0'};
      text-shadow:
        0 4px 12px rgba(0,0,0,0.25),
        0 8px 32px rgba(0,0,0,0.15);
      word-spacing: 0.05em;
    }

    /* Bold accent bar */
    .accent-bar {
      width: 120px;
      height: 6px;
      background: ${textColor};
      margin: 40px auto;
      border-radius: 3px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .reference {
      font-size: ${refSize}px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .logo {
      position: absolute;
      ${logoCSS}
      max-width: ${brand.logos?.primary?.maxWidth || 200}px;
      min-width: ${brand.logos?.primary?.minWidth || 100}px;
      z-index: 3;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter:
        drop-shadow(0 2px 8px rgba(0,0,0,0.25))
        contrast(1.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="quote">${safeContent}</div>
    ${safeReference ? `
      <div class="accent-bar"></div>
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

function getLogoPosition(placement) {
  const offset = 40;
  const positions = {
    'top-left': `top: ${offset}px; left: ${offset}px;`,
    'top-right': `top: ${offset}px; right: ${offset}px;`,
    'top-center': `top: ${offset}px; left: 50%; transform: translateX(-50%);`,
    'bottom-left': `bottom: ${offset}px; left: ${offset}px;`,
    'bottom-right': `bottom: ${offset}px; right: ${offset}px;`,
    'bottom-center': `bottom: ${offset}px; left: 50%; transform: translateX(-50%);`
  };
  return positions[placement] || positions['top-right'];
}
