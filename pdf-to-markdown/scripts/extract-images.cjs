#!/usr/bin/env node
/**
 * Extract images from a PDF
 * Usage: ./extract-images.cjs /path/to/file.pdf [--output-dir /path/to/images]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log('Usage: ./extract-images.cjs /path/to/file.pdf [--output-dir /path/to/images]');
        console.log('');
        console.log('Options:');
        console.log('  --output-dir PATH   Directory for extracted images');
        console.log('                      Default: {pdf-name}_images/ next to the PDF');
        console.log('');
        console.log('Creates PNG images named img-000.png, img-001.png, etc.');
        process.exit(0);
    }

    const pdfPath = args[0];

    // Parse options
    let outputDir = null;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--output-dir') {
            outputDir = args[++i];
        }
    }

    if (!fs.existsSync(pdfPath)) {
        console.error(`Error: File not found: ${pdfPath}`);
        process.exit(1);
    }

    // Default output directory
    if (!outputDir) {
        const pdfDir = path.dirname(pdfPath);
        const pdfName = path.basename(pdfPath, '.pdf');
        outputDir = path.join(pdfDir, `${pdfName}_images`);
    }

    try {
        // Create output directory
        fs.mkdirSync(outputDir, { recursive: true });

        // Extract images
        const cmd = `pdfimages -png "${pdfPath}" "${path.join(outputDir, 'img')}"`;
        execSync(cmd);

        // Count extracted images
        const images = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));

        const result = {
            success: true,
            outputDir,
            imageCount: images.length,
            images: images.map(f => path.join(outputDir, f))
        };

        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message
        }));
        process.exit(1);
    }
}

main();
