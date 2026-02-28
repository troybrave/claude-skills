/**
 * Template: Geometric Bold
 *
 * Dynamic asymmetric layout with bold geometric shapes, split composition,
 * and creative typography placement. Modern, eye-catching design.
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-geometric',
  name: 'Quote Geometric',
  description: 'Bold asymmetric design with geometric shapes and dynamic composition',
  category: 'quote',
  platforms: ['instagram-feed', 'instagram-story', 'facebook-post', 'twitter-post'],
  requiredAssets: ['logo'],

  render: async (context) => {
    const { brand, content, assets, platform, overrides = {} } = context;

    const safeContent = security.escapeHTML(content.main);
    const safeReference = content.reference ? security.escapeHTML(content.reference) : '';

    const { width, height } = platform.dimensions;

    const primary = brand.colors.primary.main;
    const accent = brand.colors.accent?.main || brand.colors.secondary?.main;
    const dark = brand.colors.primary.dark || primary;
    const textColor = brand.colors.text?.inverse || '#FFFFFF';

    const fontFamily = brand.typography?.families?.primary?.fallback ||
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

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
      background: ${dark};
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Dynamic geometric background */
    .bg-shape-1 {
      position: absolute;
      top: -20%;
      right: -15%;
      width: 60%;
      height: 70%;
      background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%);
      border-radius: 40% 60% 50% 70% / 60% 40% 70% 50%;
      transform: rotate(-15deg);
      opacity: 0.9;
    }

    .bg-shape-2 {
      position: absolute;
      bottom: -25%;
      left: -20%;
      width: 55%;
      height: 65%;
      background: linear-gradient(45deg, ${accent} 0%, ${primary} 100%);
      border-radius: 60% 40% 70% 50% / 40% 60% 50% 70%;
      transform: rotate(25deg);
      opacity: 0.7;
    }

    /* Accent circles */
    .circle-1 {
      position: absolute;
      top: 15%;
      left: 10%;
      width: 150px;
      height: 150px;
      border: 3px solid ${textColor};
      border-radius: 50%;
      opacity: 0.3;
    }

    .circle-2 {
      position: absolute;
      bottom: 20%;
      right: 15%;
      width: 200px;
      height: 200px;
      border: 2px solid ${accent};
      border-radius: 50%;
      opacity: 0.4;
    }

    /* Content container - asymmetric placement */
    .container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 85%;
      max-width: 900px;
      z-index: 10;
    }

    /* Large decorative quote mark */
    .quote-mark {
      position: absolute;
      top: -80px;
      left: -40px;
      font-size: 280px;
      font-weight: 900;
      color: ${accent};
      opacity: 0.15;
      line-height: 1;
      font-family: Georgia, serif;
    }

    .quote {
      font-size: 52px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.02em;
      color: ${textColor};
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
      position: relative;
      margin-bottom: 50px;
    }

    /* Diagonal accent bar */
    .accent-bar {
      position: absolute;
      right: -60px;
      top: 50%;
      transform: translateY(-50%) rotate(-15deg);
      width: 6px;
      height: 120%;
      background: linear-gradient(180deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%);
      opacity: 0.6;
    }

    .reference-container {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .ref-dot {
      width: 8px;
      height: 8px;
      background: ${accent};
      border-radius: 50%;
    }

    .reference {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${textColor};
      opacity: 0.9;
    }

    .logo {
      position: absolute;
      bottom: 50px;
      right: 50px;
      max-width: 180px;
      z-index: 20;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 2px 12px rgba(0,0,0,0.4));
    }
  </style>
</head>
<body>
  <div class="bg-shape-1"></div>
  <div class="bg-shape-2"></div>
  <div class="circle-1"></div>
  <div class="circle-2"></div>

  <div class="container">
    <div class="quote-mark">"</div>
    <div class="accent-bar"></div>
    <div class="quote">${safeContent}</div>
    ${safeReference ? `
      <div class="reference-container">
        <div class="ref-dot"></div>
        <div class="reference">${safeReference}</div>
      </div>
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
