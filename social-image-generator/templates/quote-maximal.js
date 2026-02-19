/**
 * Template: Maximal
 *
 * Curated maximalism with scrapbook elements, layered stickers,
 * bold typography, and 2025 aesthetic chaos.
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-maximal',
  name: 'Quote Maximal',
  description: 'Curated maximalism with scrapbook elements and layered design',
  category: 'quote',
  platforms: ['instagram-feed', 'instagram-story', 'facebook-post', 'twitter-post'],
  requiredAssets: ['logo'],

  render: async (context) => {
    const { brand, content, assets, platform, overrides = {} } = context;

    const safeContent = security.escapeHTML(content.main);
    const safeReference = content.reference ? security.escapeHTML(content.reference) : '';

    const { width, height} = platform.dimensions;

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

    @keyframes subtle-float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(2deg); }
    }

    body {
      width: ${width}px;
      height: ${height}px;
      background: #f8f5f0;
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Paper texture */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E");
      opacity: 1;
      pointer-events: none;
    }

    /* Large orange blob sticker */
    .blob-sticker {
      position: absolute;
      top: -80px;
      right: -60px;
      width: 450px;
      height: 450px;
      background: ${primary};
      border-radius: 48% 52% 45% 55% / 52% 48% 52% 48%;
      box-shadow: 0 15px 50px rgba(240, 78, 35, 0.3);
      z-index: 1;
      transform: rotate(15deg);
    }

    /* Secondary blob */
    .blob-secondary {
      position: absolute;
      bottom: -100px;
      left: -70px;
      width: 400px;
      height: 400px;
      background: ${accent};
      border-radius: 45% 55% 48% 52% / 55% 45% 55% 45%;
      box-shadow: 0 15px 50px rgba(240, 78, 35, 0.2);
      z-index: 1;
      transform: rotate(-20deg);
      opacity: 0.9;
    }

    /* Torn paper effect */
    .torn-paper {
      position: absolute;
      width: 520px;
      height: 380px;
      background: #fff;
      box-shadow:
        0 8px 30px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.08);
      z-index: 5;
    }

    .paper-1 {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-2deg);
    }

    /* Ripped edge effect */
    .torn-paper::before {
      content: '';
      position: absolute;
      top: -10px;
      left: 0;
      right: 0;
      height: 15px;
      background: #fff;
      clip-path: polygon(
        0% 100%,
        5% 60%,
        10% 80%,
        15% 40%,
        20% 70%,
        25% 50%,
        30% 65%,
        35% 45%,
        40% 75%,
        45% 55%,
        50% 85%,
        55% 50%,
        60% 70%,
        65% 45%,
        70% 80%,
        75% 60%,
        80% 75%,
        85% 50%,
        90% 70%,
        95% 55%,
        100% 75%,
        100% 100%
      );
      box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
    }

    /* Tape pieces */
    .tape {
      position: absolute;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(2px);
      box-shadow:
        inset 0 1px 2px rgba(0, 0, 0, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.08);
      z-index: 15;
    }

    .tape-1 {
      top: 120px;
      left: 80px;
      width: 120px;
      height: 35px;
      transform: rotate(-8deg);
    }

    .tape-2 {
      top: 140px;
      right: 90px;
      width: 100px;
      height: 35px;
      transform: rotate(12deg);
    }

    /* Digital stickers */
    .sticker {
      position: absolute;
      background: #fff;
      border: 3px solid #000;
      box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.2);
      z-index: 12;
      animation: subtle-float 4s ease-in-out infinite;
    }

    .sticker-star {
      top: 100px;
      left: 60px;
      width: 70px;
      height: 70px;
      clip-path: polygon(
        50% 0%,
        61% 35%,
        98% 35%,
        68% 57%,
        79% 91%,
        50% 70%,
        21% 91%,
        32% 57%,
        2% 35%,
        39% 35%
      );
      background: ${primary};
      animation-delay: 0s;
    }

    .sticker-circle {
      bottom: 140px;
      right: 70px;
      width: 85px;
      height: 85px;
      border-radius: 50%;
      background: ${accent};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: 900;
      color: #000;
      animation-delay: -2s;
    }

    /* Quote container on paper */
    .quote-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 450px;
      z-index: 10;
      text-align: center;
    }

    /* Handwritten style header */
    .header-scribble {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${primary};
      margin-bottom: 30px;
      position: relative;
    }

    .header-scribble::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 3px;
      background: ${primary};
    }

    /* Main quote */
    .quote {
      font-size: 52px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: #0a0a0a;
      margin-bottom: 35px;
      text-shadow: 3px 3px 0px rgba(240, 78, 35, 0.2);
    }

    /* Reference badge */
    .reference-badge {
      display: inline-block;
      background: #0a0a0a;
      color: ${primary};
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 12px 28px;
      border-radius: 6px;
      box-shadow: 4px 4px 0px rgba(240, 78, 35, 0.3);
      border: 3px solid ${primary};
    }

    /* Doodle elements */
    .doodle {
      position: absolute;
      z-index: 8;
    }

    .doodle-arrow {
      top: 250px;
      right: 120px;
      width: 80px;
      height: 60px;
      border-right: 4px solid ${primary};
      border-top: 4px solid ${primary};
      transform: rotate(45deg);
      opacity: 0.6;
    }

    .doodle-arrow::before {
      content: '';
      position: absolute;
      top: -8px;
      right: -8px;
      width: 16px;
      height: 16px;
      border-right: 4px solid ${primary};
      border-top: 4px solid ${primary};
      transform: rotate(45deg);
    }

    .doodle-underline {
      bottom: 320px;
      left: 280px;
      width: 180px;
      height: 3px;
      background: ${primary};
      transform: rotate(-1deg);
      opacity: 0.7;
    }

    /* Corner marks */
    .corner-mark {
      position: absolute;
      width: 25px;
      height: 25px;
      border: 3px solid #0a0a0a;
      z-index: 20;
    }

    .mark-tl {
      top: 30px;
      left: 30px;
      border-right: none;
      border-bottom: none;
    }

    .mark-br {
      bottom: 30px;
      right: 30px;
      border-left: none;
      border-top: none;
    }

    /* Logo sticker */
    .logo-sticker {
      position: absolute;
      bottom: 45px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      background: #fff;
      border: 3px solid #0a0a0a;
      box-shadow: 5px 5px 0px rgba(0, 0, 0, 0.15);
      z-index: 20;
      transform: translateX(-50%) rotate(-1deg);
    }

    .logo-sticker img {
      max-width: 130px;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="blob-sticker"></div>
  <div class="blob-secondary"></div>
  <div class="torn-paper paper-1"></div>

  <div class="tape tape-1"></div>
  <div class="tape tape-2"></div>

  <div class="sticker sticker-star"></div>
  <div class="sticker sticker-circle">✓</div>

  <div class="doodle doodle-arrow"></div>
  <div class="doodle doodle-underline"></div>

  <div class="corner-mark mark-tl"></div>
  <div class="corner-mark mark-br"></div>

  <div class="quote-container">
    <div class="header-scribble">Daily Reminder</div>
    <div class="quote">${safeContent}</div>
    ${safeReference ? `
      <div class="reference-badge">${safeReference}</div>
    ` : ''}
  </div>

  ${assets.logo ? `
    <div class="logo-sticker">
      <img src="${assets.logo.dataUri}" alt="Logo">
    </div>
  ` : ''}
</body>
</html>`.trim();
  }
};
