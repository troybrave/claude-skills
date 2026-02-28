/**
 * Template: Duotone Split
 *
 * Bold split-screen composition with contrasting duotone sections,
 * creative typography placement, and modern asymmetric design
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-duotone',
  name: 'Quote Duotone Split',
  description: 'Bold split-screen design with contrasting duotone sections and asymmetric layout',
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
    const light = brand.colors.background?.light || '#FFFFFF';
    const textDark = brand.colors.text?.primary || '#1A1A1A';
    const textLight = brand.colors.text?.inverse || '#FFFFFF';

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
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Diagonal split background */
    .split-left {
      position: absolute;
      top: 0;
      left: 0;
      width: 60%;
      height: 100%;
      background: linear-gradient(135deg, ${dark} 0%, ${primary} 100%);
      clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
    }

    .split-right {
      position: absolute;
      top: 0;
      right: 0;
      width: 45%;
      height: 100%;
      background: ${light};
    }

    /* Pattern overlay on dark side */
    .pattern-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 60%;
      height: 100%;
      background-image:
        repeating-linear-gradient(45deg,
          transparent,
          transparent 40px,
          rgba(255,255,255,0.03) 40px,
          rgba(255,255,255,0.03) 80px);
      clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
    }

    /* Accent stripe crossing the divide */
    .accent-stripe {
      position: absolute;
      top: 40%;
      left: -10%;
      width: 120%;
      height: 8px;
      background: linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%);
      transform: rotate(-5deg);
      opacity: 0.8;
      z-index: 5;
    }

    /* Content container bridging both sides */
    .container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 85%;
      max-width: 880px;
      z-index: 10;
    }

    .quote {
      font-size: 54px;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.025em;
      margin-bottom: 50px;
      position: relative;
    }

    /* Creative word coloring - split across divide */
    .quote-dark {
      color: ${textLight};
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .quote-light {
      color: ${textDark};
    }

    /* Split the quote visually */
    .quote::before {
      content: '';
      position: absolute;
      left: -100px;
      top: -30px;
      width: 60px;
      height: calc(100% + 60px);
      background: ${accent};
      opacity: 0.15;
      border-radius: 8px;
    }

    .reference-container {
      background: rgba(0,0,0,0.05);
      backdrop-filter: blur(10px);
      padding: 20px 35px;
      border-left: 4px solid ${accent};
      display: inline-block;
      margin-left: 60px;
    }

    .reference {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${textDark};
    }

    /* Geometric accent shapes */
    .geo-shape {
      position: absolute;
      border: 2px solid ${accent};
      opacity: 0.3;
    }

    .geo-1 {
      top: 10%;
      right: 12%;
      width: 120px;
      height: 120px;
      border-radius: 50%;
    }

    .geo-2 {
      bottom: 15%;
      left: 8%;
      width: 80px;
      height: 80px;
      transform: rotate(45deg);
    }

    .geo-3 {
      top: 60%;
      right: 8%;
      width: 100px;
      height: 100px;
      border-radius: 20px;
      transform: rotate(25deg);
    }

    .logo {
      position: absolute;
      bottom: 50px;
      right: 80px;
      max-width: 180px;
      z-index: 20;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 2px 12px rgba(0,0,0,0.3));
    }
  </style>
</head>
<body>
  <div class="split-left"></div>
  <div class="split-right"></div>
  <div class="pattern-overlay"></div>
  <div class="accent-stripe"></div>

  <div class="geo-shape geo-1"></div>
  <div class="geo-shape geo-2"></div>
  <div class="geo-shape geo-3"></div>

  <div class="container">
    <div class="quote">
      <span class="quote-dark">${safeContent}</span>
    </div>
    ${safeReference ? `
      <div class="reference-container">
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
