/**
 * Template: Cinematic
 *
 * Dramatic cinematic composition with spotlight effects,
 * deep shadows, and movie poster aesthetics.
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-cinematic',
  name: 'Quote Cinematic',
  description: 'Dramatic cinematic design with spotlight effects and deep shadows',
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
      background: #000000;
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Dramatic spotlight gradient */
    .spotlight {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1000px;
      height: 1000px;
      background: radial-gradient(
        circle at center,
        rgba(240, 78, 35, 0.25) 0%,
        rgba(240, 78, 35, 0.12) 30%,
        transparent 70%
      );
      z-index: 1;
    }

    /* Secondary spotlight */
    .spotlight-2 {
      position: absolute;
      top: 20%;
      right: 10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(
        circle at center,
        rgba(255, 107, 64, 0.15) 0%,
        transparent 60%
      );
      z-index: 1;
    }

    /* Film grain texture */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.12'/%3E%3C/svg%3E");
      opacity: 1;
      z-index: 100;
      pointer-events: none;
      mix-blend-mode: overlay;
    }

    /* Vignette effect */
    body::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        ellipse at center,
        transparent 0%,
        transparent 50%,
        rgba(0, 0, 0, 0.8) 100%
      );
      z-index: 99;
      pointer-events: none;
    }

    /* Main container */
    .container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 85%;
      max-width: 900px;
      z-index: 10;
      text-align: center;
    }

    /* Cinematic bars */
    .letterbox-top,
    .letterbox-bottom {
      position: absolute;
      left: 0;
      right: 0;
      height: 80px;
      background: #000;
      z-index: 5;
    }

    .letterbox-top { top: 0; }
    .letterbox-bottom { bottom: 0; }

    /* Main quote with dramatic styling */
    .quote {
      font-size: 68px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      color: ${textColor};
      margin-bottom: 50px;
      text-shadow:
        0 0 60px rgba(240, 78, 35, 0.6),
        0 0 30px rgba(240, 78, 35, 0.4),
        0 4px 40px rgba(0, 0, 0, 0.9),
        0 8px 60px rgba(0, 0, 0, 0.7);
      position: relative;
    }

    /* Beam of light effect */
    .light-beam {
      position: absolute;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 200%;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(240, 78, 35, 0.05) 30%,
        rgba(240, 78, 35, 0.1) 50%,
        rgba(240, 78, 35, 0.05) 70%,
        transparent 100%
      );
      z-index: 2;
      filter: blur(40px);
      opacity: 0.6;
    }

    /* Reference with cinematic treatment */
    .reference-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 30px;
      padding: 20px 40px;
      background: rgba(0, 0, 0, 0.6);
      border-top: 2px solid ${primary};
      border-bottom: 2px solid ${primary};
      backdrop-filter: blur(20px);
    }

    .reference-dot {
      width: 8px;
      height: 8px;
      background: ${primary};
      border-radius: 50%;
      box-shadow: 0 0 20px ${primary};
    }

    .reference {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: ${textColor};
      text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
    }

    /* Film frame markers */
    .frame-marker {
      position: absolute;
      width: 20px;
      height: 15px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255,255,255,0.1) 20%,
        rgba(255,255,255,0.1) 80%,
        transparent 100%
      );
      z-index: 6;
    }

    .frame-tl { top: 70px; left: 40px; }
    .frame-tr { top: 70px; right: 40px; }
    .frame-bl { bottom: 70px; left: 40px; }
    .frame-br { bottom: 70px; right: 40px; }

    /* Logo with cinematic glow */
    .logo {
      position: absolute;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 160px;
      z-index: 20;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter:
        drop-shadow(0 0 30px rgba(240, 78, 35, 0.6))
        drop-shadow(0 4px 40px rgba(0, 0, 0, 0.9));
    }

    /* Aspect ratio marker */
    .aspect-marker {
      position: absolute;
      top: 90px;
      right: 50px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      z-index: 10;
    }
  </style>
</head>
<body>
  <div class="letterbox-top"></div>
  <div class="letterbox-bottom"></div>

  <div class="frame-marker frame-tl"></div>
  <div class="frame-marker frame-tr"></div>
  <div class="frame-marker frame-bl"></div>
  <div class="frame-marker frame-br"></div>

  <div class="spotlight"></div>
  <div class="spotlight-2"></div>
  <div class="light-beam"></div>

  <div class="aspect-marker">1:1</div>

  <div class="container">
    <div class="quote">${safeContent}</div>

    ${safeReference ? `
      <div class="reference-wrapper">
        <div class="reference-dot"></div>
        <div class="reference">${safeReference}</div>
        <div class="reference-dot"></div>
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
