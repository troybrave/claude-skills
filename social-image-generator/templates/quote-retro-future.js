/**
 * Template: Retro Future
 *
 * Y2K meets 2025 - chrome effects, dynamic gradients, bold typography,
 * and Space Age aesthetics merged with modern design.
 */

const security = require('../lib/security');

module.exports = {
  id: 'quote-retro-future',
  name: 'Quote Retro Future',
  description: 'Y2K aesthetic meets 2025 with chrome effects and dynamic gradients',
  category: 'quote',
  platforms: ['instagram-feed', 'instagram-story', 'facebook-post', 'twitter-post'],
  requiredAssets: ['logo'],

  render: async (context) => {
    const { brand, content, assets, platform, overrides = {} } = context;

    const safeContent = security.escapeHTML(content.main);
    const safeReference = content.reference ? security.escapeHTML(content.reference) : '';

    const { width, height } = platform.dimensions;

    const primary = brand.colors.primary.main;
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

    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }

    body {
      width: ${width}px;
      height: ${height}px;
      background: linear-gradient(135deg,
        #0a0a0a 0%,
        #1a0a1e 25%,
        #0a0a0a 50%,
        #1e0a14 75%,
        #0a0a0a 100%
      );
      font-family: ${fontFamily};
      position: relative;
      overflow: hidden;
    }

    /* Dynamic gradient orbs */
    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      animation: gradient-shift 8s ease infinite;
    }

    .orb-1 {
      top: -10%;
      left: -10%;
      width: 600px;
      height: 600px;
      background: linear-gradient(135deg, ${primary}, #ff6b40, #ff1493);
      background-size: 200% 200%;
    }

    .orb-2 {
      bottom: -15%;
      right: -10%;
      width: 700px;
      height: 700px;
      background: linear-gradient(225deg, #00d4ff, #0099ff, ${primary});
      background-size: 200% 200%;
      animation-delay: -4s;
    }

    .orb-3 {
      top: 40%;
      left: 40%;
      width: 400px;
      height: 400px;
      background: linear-gradient(45deg, #ff1493, #9b00ff, #00d4ff);
      background-size: 200% 200%;
      animation-delay: -2s;
    }

    /* Chrome/metallic grid background */
    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        repeating-linear-gradient(0deg,
          transparent,
          transparent 49px,
          rgba(255,255,255,0.03) 49px,
          rgba(255,255,255,0.03) 50px),
        repeating-linear-gradient(90deg,
          transparent,
          transparent 49px,
          rgba(255,255,255,0.03) 49px,
          rgba(255,255,255,0.03) 50px);
      pointer-events: none;
      z-index: 1;
    }

    /* Retro scan lines */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
      );
      pointer-events: none;
      z-index: 100;
      opacity: 0.3;
    }

    /* Film grain */
    body::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
      opacity: 1;
      pointer-events: none;
      z-index: 99;
      mix-blend-mode: overlay;
    }

    /* Floating chrome rings */
    .chrome-ring {
      position: absolute;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.15);
      animation: float-slow 6s ease-in-out infinite;
      z-index: 2;
    }

    .ring-1 {
      top: 15%;
      right: 12%;
      width: 180px;
      height: 180px;
      animation-delay: 0s;
    }

    .ring-2 {
      bottom: 18%;
      left: 10%;
      width: 140px;
      height: 140px;
      animation-delay: -3s;
    }

    /* Container */
    .container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 900px;
      z-index: 10;
    }

    /* Y2K style label */
    .y2k-label {
      display: inline-block;
      background: linear-gradient(135deg, ${primary}, #ff6b40);
      color: #000;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 8px 20px;
      border-radius: 20px;
      margin-bottom: 40px;
      box-shadow: 0 4px 20px rgba(240, 78, 35, 0.4);
    }

    /* Bold brutalist quote */
    .quote {
      font-size: 72px;
      font-weight: 900;
      line-height: 0.95;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      color: ${textColor};
      margin-bottom: 50px;
      text-shadow:
        0 0 40px rgba(255, 107, 64, 0.5),
        0 0 80px rgba(0, 212, 255, 0.3),
        0 4px 30px rgba(0, 0, 0, 0.8);
    }

    /* Chrome text effect on key word */
    .chrome-text {
      background: linear-gradient(180deg,
        #ffffff 0%,
        #e0e0e0 20%,
        #a0a0a0 40%,
        #ffffff 50%,
        #e0e0e0 60%,
        #909090 80%,
        #ffffff 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 20px rgba(255,255,255,0.5));
    }

    /* Reference with retro pill shape */
    .reference-pill {
      display: inline-flex;
      align-items: center;
      gap: 15px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(255, 255, 255, 0.15);
      padding: 18px 35px;
      border-radius: 50px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .ref-dot {
      width: 8px;
      height: 8px;
      background: ${primary};
      border-radius: 50%;
      box-shadow: 0 0 15px ${primary};
    }

    .reference {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${textColor};
    }

    /* Logo with glow */
    .logo {
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 150px;
      z-index: 20;
    }

    .logo img {
      width: 100%;
      height: auto;
      display: block;
      filter:
        drop-shadow(0 0 25px rgba(255, 107, 64, 0.6))
        drop-shadow(0 0 50px rgba(0, 212, 255, 0.3));
    }

    /* Year marker */
    .year-marker {
      position: absolute;
      top: 50px;
      right: 50px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3em;
      color: rgba(255,255,255,0.3);
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="gradient-orb orb-1"></div>
  <div class="gradient-orb orb-2"></div>
  <div class="gradient-orb orb-3"></div>
  <div class="grid-overlay"></div>
  <div class="chrome-ring ring-1"></div>
  <div class="chrome-ring ring-2"></div>

  <div class="year-marker">2025</div>

  <div class="container">
    <div class="y2k-label">◉ Faith Series</div>

    <div class="quote">${safeContent}</div>

    ${safeReference ? `
      <div class="reference-pill">
        <div class="ref-dot"></div>
        <div class="reference">${safeReference}</div>
        <div class="ref-dot"></div>
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
