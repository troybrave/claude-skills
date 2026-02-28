/**
 * Template: Minimal Quote
 *
 * Ultra-clean, modern design with maximum breathing room
 * Swiss design principles - less is more
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-minimal',
  name: 'Quote Minimal',
  description: 'Ultra-clean design with sophisticated typography and breathing room',
  category: 'quote',
  platforms: ['instagram-feed', 'instagram-story', 'facebook-post', 'twitter-post'],
  requiredAssets: ['logo'],

  render: async (context) => {
    const { brand, content, assets, platform, overrides = {} } = context;

    const safeContent = security.escapeHTML(content.main);
    const safeReference = content.reference ? security.escapeHTML(content.reference) : '';

    const { width, height } = platform.dimensions;
    const safeZone = brand.layout?.safeZones?.[platform.platform]?.[platform.type] || { top: 120, bottom: 120, left: 120, right: 120 };

    const bgColor = overrides.backgroundColor || brand.colors?.background?.light || '#FFFFFF';
    const primaryColor = brand.colors?.primary?.main || '#1A1A1A';
    const textColor = brand.colors?.text?.primary || '#1A1A1A';
    const accentColor = brand.colors?.accent?.main || brand.colors?.primary?.main;

    const quoteSize = platform.platform === 'instagram' && platform.type === 'story' ? 48 : 46;
    const refSize = platform.platform === 'instagram' && platform.type === 'story' ? 18 : 16;

    const fontFamily = brand.typography?.families?.primary?.fallback ||
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

    const logoPlacement = overrides.logoPlacement || brand.logos?.primary?.preferredPlacement?.[0] || 'bottom-left';
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
      background: ${bgColor};
      font-family: ${fontFamily};
      padding: ${safeZone.top}px ${safeZone.right}px ${safeZone.bottom}px ${safeZone.left}px;
      position: relative;
    }

    .container {
      text-align: left;
      color: ${textColor};
      max-width: ${width - safeZone.left - safeZone.right}px;
      position: relative;
    }

    /* Minimal accent line */
    .accent-line {
      width: 60px;
      height: 4px;
      background: ${accentColor};
      margin-bottom: 48px;
      border-radius: 2px;
    }

    .quote {
      font-size: ${quoteSize}px;
      font-weight: 500;
      line-height: 1.5;
      letter-spacing: -0.015em;
      margin-bottom: ${safeReference ? '60px' : '0'};
      color: ${textColor};
    }

    .reference {
      font-size: ${refSize}px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${primaryColor};
      opacity: 0.7;
    }

    .logo {
      position: absolute;
      ${logoCSS}
      max-width: ${brand.logos?.primary?.maxWidth || 180}px;
      min-width: ${brand.logos?.primary?.minWidth || 90}px;
      opacity: 0.9;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="accent-line"></div>
    <div class="quote">${safeContent}</div>
    ${safeReference ? `<div class="reference">${safeReference}</div>` : ''}
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
    'bottom-left': `bottom: ${offset}px; left: ${offset}px;`,
    'bottom-right': `bottom: ${offset}px; right: ${offset}px;`,
    'bottom-center': `bottom: ${offset}px; left: 50%; transform: translateX(-50%);`
  };
  return positions[placement] || positions['bottom-left'];
}
