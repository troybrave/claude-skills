/**
 * Template: Liquid Glow
 *
 * Dark moody aesthetic with organic liquid shapes, neon glow effects,
 * and flowing typography. Modern, eye-catching, Instagram-worthy.
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-liquid-glow',
  name: 'Quote Liquid Glow',
  description: 'Dark aesthetic with liquid shapes, neon glow, and flowing typography',
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
    const secondary = brand.colors.secondary?.main || accent;
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

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(5deg); }
      66% { transform: translate(-20px, 20px) rotate(-5deg); }
    }

    @keyframes glow {
      0%, 100% { filter: brightness(1) blur(40px); }
      50% { filter: brightness(1.4) blur(50px); }
    }

    @keyframes shimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    body {
      width: ${width}px;
      height: ${height}px;
      background: #0a0a0f;
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Glowing liquid blobs */
    .liquid-blob {
      position: absolute;
      border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
      filter: blur(40px);
      opacity: 0.6;
      animation: float 20s ease-in-out infinite;
    }

    .blob-1 {
      top: -15%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, ${primary}, ${accent});
      animation-delay: 0s;
    }

    .blob-2 {
      bottom: -20%;
      right: -15%;
      width: 600px;
      height: 600px;
      background: linear-gradient(225deg, ${accent}, ${secondary});
      animation-delay: -7s;
    }

    .blob-3 {
      top: 30%;
      right: 10%;
      width: 350px;
      height: 350px;
      background: linear-gradient(45deg, ${secondary}, ${primary});
      animation-delay: -14s;
    }

    /* Neon glow orb */
    .glow-orb {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, ${accent} 0%, transparent 70%);
      filter: blur(80px);
      opacity: 0.4;
      animation: glow 4s ease-in-out infinite;
    }

    /* Content container */
    .container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 85%;
      max-width: 880px;
      z-index: 10;
      text-align: center;
    }

    /* Readable text with subtle glow */
    .quote {
      font-size: 56px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: ${textColor};
      text-shadow:
        0 0 20px ${accent},
        0 0 40px rgba(255,255,255,0.3),
        0 4px 30px rgba(0,0,0,0.8);
      margin-bottom: 60px;
    }

    /* Neon line divider */
    .neon-line {
      width: 100px;
      height: 3px;
      background: linear-gradient(90deg, transparent, ${accent}, transparent);
      margin: 0 auto 50px;
      box-shadow:
        0 0 10px ${accent},
        0 0 20px ${accent},
        0 0 30px ${accent};
      border-radius: 2px;
    }

    /* Glass morphism reference container */
    .reference-box {
      display: inline-block;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 40px;
      border-radius: 100px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .reference {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${textColor};
      text-shadow: 0 2px 20px rgba(0,0,0,0.5);
    }

    /* Floating particles */
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: ${accent};
      border-radius: 50%;
      box-shadow: 0 0 10px ${accent};
      opacity: 0.6;
      animation: float 15s ease-in-out infinite;
    }

    .particle-1 { top: 20%; left: 15%; animation-delay: -3s; }
    .particle-2 { top: 70%; left: 25%; animation-delay: -7s; width: 6px; height: 6px; }
    .particle-3 { top: 40%; right: 20%; animation-delay: -11s; }
    .particle-4 { bottom: 30%; right: 30%; animation-delay: -5s; width: 5px; height: 5px; }
    .particle-5 { top: 60%; left: 70%; animation-delay: -9s; }

    /* Glowing logo */
    .logo {
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 180px;
      z-index: 20;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter:
        drop-shadow(0 0 20px rgba(255,255,255,0.3))
        drop-shadow(0 4px 30px rgba(0,0,0,0.5));
    }
  </style>
</head>
<body>
  <div class="liquid-blob blob-1"></div>
  <div class="liquid-blob blob-2"></div>
  <div class="liquid-blob blob-3"></div>
  <div class="glow-orb"></div>

  <div class="particle particle-1"></div>
  <div class="particle particle-2"></div>
  <div class="particle particle-3"></div>
  <div class="particle particle-4"></div>
  <div class="particle particle-5"></div>

  <div class="container">
    <div class="quote">${safeContent}</div>
    ${safeReference ? `
      <div class="neon-line"></div>
      <div class="reference-box">
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
