/**
 * Template: Glassmorphism
 *
 * Modern glassmorphism design with frosted glass effect, layered depth,
 * backdrop blur aesthetics, and sophisticated color overlays
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-glass',
  name: 'Quote Glassmorphism',
  description: 'Modern frosted glass effect with layered depth and sophisticated aesthetics',
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
      background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%);
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Layered background orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.5;
    }

    .orb-1 {
      top: -10%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    }

    .orb-2 {
      bottom: -15%;
      right: -15%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, ${accent} 0%, transparent 70%);
    }

    .orb-3 {
      top: 30%;
      right: 20%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
    }

    /* Glass card container */
    .glass-card {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 85%;
      max-width: 850px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 80px 70px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
      z-index: 10;
    }

    /* Floating accent elements */
    .float-shape {
      position: absolute;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .float-1 {
      top: -30px;
      right: 60px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
    }

    .float-2 {
      bottom: 40px;
      left: -40px;
      width: 100px;
      height: 100px;
      border-radius: 20px;
      transform: rotate(25deg);
    }

    .float-3 {
      top: 50%;
      right: -50px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
    }

    .quote {
      font-size: 48px;
      font-weight: 600;
      line-height: 1.35;
      letter-spacing: -0.015em;
      color: ${textColor};
      text-shadow: 0 2px 20px rgba(0,0,0,0.15);
      margin-bottom: 40px;
      position: relative;
    }

    /* Gradient underline */
    .quote::after {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 0;
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, ${textColor} 0%, transparent 100%);
      border-radius: 2px;
      opacity: 0.6;
    }

    .reference {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${textColor};
      opacity: 0.9;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    /* Glass pill for reference */
    .ref-pill {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 12px 28px;
      border-radius: 100px;
      margin-top: 10px;
    }

    .logo {
      position: absolute;
      bottom: 45px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 180px;
      z-index: 20;
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
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>

  <div class="glass-card">
    <div class="float-shape float-1"></div>
    <div class="float-shape float-2"></div>
    <div class="float-shape float-3"></div>

    <div class="quote">${safeContent}</div>
    ${safeReference ? `
      <div class="ref-pill">
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
