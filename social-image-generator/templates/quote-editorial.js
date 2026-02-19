/**
 * Template: Editorial
 *
 * Magazine-style editorial layout with dramatic typography hierarchy,
 * textured background, and sophisticated composition.
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-editorial',
  name: 'Quote Editorial',
  description: 'Magazine-style editorial with dramatic typography and texture',
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
    const textColor = brand.colors.text?.inverse || '#FFFFFF';

    const fontFamily = brand.typography?.families?.primary?.fallback ||
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

    // Extract words for dramatic typography
    const words = safeContent.split(' ');
    const firstPart = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const secondPart = words.slice(Math.ceil(words.length / 2)).join(' ');

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
      background: #0a0a0a;
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Textured background with grain */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        repeating-linear-gradient(
          0deg,
          rgba(255,255,255,0.03) 0px,
          transparent 1px,
          transparent 2px,
          rgba(255,255,255,0.03) 3px
        ),
        repeating-linear-gradient(
          90deg,
          rgba(255,255,255,0.03) 0px,
          transparent 1px,
          transparent 2px,
          rgba(255,255,255,0.03) 3px
        );
      opacity: 0.3;
      pointer-events: none;
    }

    /* Noise texture */
    body::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      right: -50%;
      bottom: -50%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
      opacity: 0.5;
      pointer-events: none;
    }

    /* Orange accent bar */
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 12px;
      height: 100%;
      background: linear-gradient(180deg, ${primary} 0%, ${accent} 100%);
    }

    /* Vertical line elements */
    .line-accent {
      position: absolute;
      width: 1px;
      height: 200px;
      background: rgba(255,255,255,0.15);
    }

    .line-1 { top: 100px; right: 200px; }
    .line-2 { bottom: 150px; left: 180px; height: 150px; }

    /* Content container */
    .container {
      position: absolute;
      top: 50%;
      left: 60px;
      right: 60px;
      transform: translateY(-50%);
      z-index: 10;
    }

    /* Issue number / decorative element */
    .issue {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: ${primary};
      margin-bottom: 40px;
      opacity: 0.9;
    }

    /* Main quote with dramatic hierarchy */
    .quote-wrapper {
      margin-bottom: 60px;
    }

    .quote-line-1 {
      font-size: 82px;
      font-weight: 900;
      line-height: 0.95;
      letter-spacing: -0.04em;
      color: ${textColor};
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .quote-line-2 {
      font-size: 52px;
      font-weight: 300;
      line-height: 1.1;
      letter-spacing: 0.02em;
      color: rgba(255,255,255,0.85);
      padding-left: 4px;
    }

    /* Highlight word */
    .highlight {
      color: ${primary};
      font-weight: 900;
    }

    /* Reference with editorial style */
    .reference-container {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .reference-line {
      width: 60px;
      height: 2px;
      background: ${primary};
    }

    .reference {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.7);
    }

    /* Decorative corner elements */
    .corner-tl, .corner-br {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .corner-tl {
      top: 40px;
      left: 40px;
      border-right: none;
      border-bottom: none;
    }

    .corner-br {
      bottom: 40px;
      right: 40px;
      border-left: none;
      border-top: none;
    }

    /* Logo */
    .logo {
      position: absolute;
      bottom: 50px;
      right: 60px;
      max-width: 140px;
      z-index: 20;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      opacity: 0.95;
    }

    /* Page number decoration */
    .page-number {
      position: absolute;
      bottom: 50px;
      left: 60px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: rgba(255,255,255,0.3);
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="line-accent line-1"></div>
  <div class="line-accent line-2"></div>
  <div class="corner-tl"></div>
  <div class="corner-br"></div>

  <div class="container">
    <div class="issue">Vol. 001 — Faith</div>

    <div class="quote-wrapper">
      <div class="quote-line-1">${firstPart}</div>
      <div class="quote-line-2">${secondPart}</div>
    </div>

    ${safeReference ? `
      <div class="reference-container">
        <div class="reference-line"></div>
        <div class="reference">${safeReference}</div>
      </div>
    ` : ''}
  </div>

  <div class="page-number">— 01</div>

  ${assets.logo ? `
    <div class="logo">
      <img src="${assets.logo.dataUri}" alt="Logo">
    </div>
  ` : ''}
</body>
</html>`.trim();
  }
};
