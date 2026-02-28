/**
 * Template: Brutalist
 *
 * Bold, raw, brutalist design with overlapping elements,
 * dramatic typography, and rebellious composition.
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-brutalist',
  name: 'Quote Brutalist',
  description: 'Bold brutalist design with overlapping elements and raw typography',
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
      background: ${textColor};
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Noise texture overlay */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
      opacity: 1;
      mix-blend-mode: multiply;
      pointer-events: none;
    }

    /* Large orange block element */
    .block-element {
      position: absolute;
      top: -100px;
      right: -80px;
      width: 500px;
      height: 500px;
      background: ${primary};
      transform: rotate(25deg);
      opacity: 1;
      z-index: 1;
    }

    /* Secondary block */
    .block-secondary {
      position: absolute;
      bottom: -120px;
      left: -60px;
      width: 350px;
      height: 350px;
      background: ${accent};
      transform: rotate(-15deg);
      opacity: 0.9;
      z-index: 1;
    }

    /* Black bar overlay */
    .bar-overlay {
      position: absolute;
      top: 35%;
      left: 0;
      right: 0;
      height: 180px;
      background: #000;
      z-index: 5;
      opacity: 0.95;
    }

    /* Main quote */
    .quote-container {
      position: absolute;
      top: 50%;
      left: 60px;
      right: 60px;
      transform: translateY(-50%);
      z-index: 10;
    }

    .quote {
      font-size: 76px;
      font-weight: 900;
      line-height: 0.9;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      color: ${textColor};
      text-shadow: 4px 4px 0px rgba(0,0,0,0.2);
      margin-bottom: 0;
      position: relative;
    }

    /* Glitch effect on part of text */
    .glitch {
      position: relative;
      color: ${textColor};
    }

    .glitch::before {
      content: attr(data-text);
      position: absolute;
      left: 2px;
      top: 0;
      color: ${primary};
      opacity: 0.8;
      clip: rect(0, 900px, 0, 0);
      animation: glitch-1 2s infinite linear alternate-reverse;
    }

    @keyframes glitch-1 {
      0% { clip: rect(42px, 9999px, 44px, 0); }
      5% { clip: rect(12px, 9999px, 59px, 0); }
      10% { clip: rect(48px, 9999px, 29px, 0); }
      15% { clip: rect(42px, 9999px, 73px, 0); }
      20% { clip: rect(63px, 9999px, 27px, 0); }
      25% { clip: rect(34px, 9999px, 55px, 0); }
      30% { clip: rect(86px, 9999px, 73px, 0); }
      35% { clip: rect(20px, 9999px, 20px, 0); }
      40% { clip: rect(26px, 9999px, 60px, 0); }
      45% { clip: rect(25px, 9999px, 66px, 0); }
      50% { clip: rect(57px, 9999px, 98px, 0); }
      55% { clip: rect(5px, 9999px, 46px, 0); }
      60% { clip: rect(82px, 9999px, 31px, 0); }
      65% { clip: rect(54px, 9999px, 27px, 0); }
      70% { clip: rect(28px, 9999px, 99px, 0); }
      75% { clip: rect(45px, 9999px, 69px, 0); }
      80% { clip: rect(23px, 9999px, 85px, 0); }
      85% { clip: rect(54px, 9999px, 84px, 0); }
      90% { clip: rect(45px, 9999px, 47px, 0); }
      95% { clip: rect(37px, 9999px, 20px, 0); }
      100% { clip: rect(4px, 9999px, 91px, 0); }
    }

    /* Reference in stark box */
    .reference-box {
      position: absolute;
      bottom: 80px;
      left: 60px;
      background: ${primary};
      color: #000;
      padding: 18px 32px;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      z-index: 15;
      box-shadow: 6px 6px 0px rgba(0,0,0,0.3);
    }

    /* Decorative elements */
    .stripe {
      position: absolute;
      height: 4px;
      background: #000;
      z-index: 2;
    }

    .stripe-1 {
      top: 20%;
      left: 0;
      right: 40%;
      opacity: 0.3;
    }

    .stripe-2 {
      bottom: 30%;
      left: 50%;
      right: 0;
      opacity: 0.25;
    }

    /* Logo with border */
    .logo-container {
      position: absolute;
      top: 60px;
      left: 60px;
      padding: 12px 20px;
      background: #000;
      border: 3px solid ${primary};
      z-index: 20;
    }

    .logo-container img {
      max-width: 120px;
      height: auto;
      display: block;
    }

    /* Brutalist corner marker */
    .corner-marker {
      position: absolute;
      bottom: 60px;
      right: 60px;
      width: 60px;
      height: 60px;
      border: 4px solid #000;
      background: ${primary};
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 900;
      color: #000;
    }
  </style>
</head>
<body>
  <div class="block-element"></div>
  <div class="block-secondary"></div>
  <div class="bar-overlay"></div>
  <div class="stripe stripe-1"></div>
  <div class="stripe stripe-2"></div>

  ${assets.logo ? `
    <div class="logo-container">
      <img src="${assets.logo.dataUri}" alt="Logo">
    </div>
  ` : ''}

  <div class="quote-container">
    <div class="quote">${safeContent}</div>
  </div>

  ${safeReference ? `
    <div class="reference-box">${safeReference}</div>
  ` : ''}

  <div class="corner-marker">↗</div>
</body>
</html>`.trim();
  }
};
