#!/usr/bin/env node

/**
 * Create Placeholder Logos for Testing
 *
 * Generates simple placeholder logo files for brand configurations
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

async function createPlaceholderLogo(outputPath, width, height, text, bgColor, textColor) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="${Math.min(width, height) / 8}"
        font-weight="bold"
        fill="${textColor}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${text}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  const stats = await fs.stat(outputPath);
  console.log(`✅ Created: ${path.basename(outputPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  const assetsDir = path.join(__dirname, '..', 'assets', 'brave-life', 'logos');

  // Ensure directory exists
  await fs.mkdir(assetsDir, { recursive: true });

  console.log('🎨 Creating placeholder logos for Brave Life...\n');

  // Primary logo (light background)
  await createPlaceholderLogo(
    path.join(assetsDir, 'logo-primary.png'),
    800,
    450,
    'BRAVE LIFE',
    '#2C5F8D',
    '#FFFFFF'
  );

  // Inverse logo (dark background)
  await createPlaceholderLogo(
    path.join(assetsDir, 'logo-inverse.png'),
    800,
    450,
    'BRAVE LIFE',
    '#FFFFFF',
    '#2C5F8D'
  );

  // Icon
  await createPlaceholderLogo(
    path.join(assetsDir, 'icon.png'),
    512,
    512,
    'BL',
    '#2C5F8D',
    '#FFFFFF'
  );

  console.log('\n✅ All placeholder logos created successfully!');
  console.log(`📁 Location: ${assetsDir}`);
}

main().catch(error => {
  console.error('❌ Error creating logos:', error.message);
  process.exit(1);
});
