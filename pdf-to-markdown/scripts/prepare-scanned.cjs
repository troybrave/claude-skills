#!/usr/bin/env node
/**
 * Convert PDF pages to images for vision-based OCR processing
 * Usage: ./prepare-scanned.cjs /path/to/file.pdf --start 1 --end 20
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log('Usage: ./prepare-scanned.cjs /path/to/file.pdf --start 1 --end 20');
        console.log('');
        console.log('Converts specified PDF pages to PNG images for vision-based text extraction.');
        console.log('');
        console.log('Options:');
        console.log('  --start N       First page (default: 1)');
        console.log('  --end N         Last page (default: 20)');
        console.log('  --output-dir    Output directory (default: /tmp/pdf_ocr_{filename}/)');
        console.log('  --dpi N         Image resolution (default: 150)');
        process.exit(0);
    }

    const pdfPath = args[0];

    // Parse options
    let start = 1;
    let end = 20;
    let outputDir = null;
    let dpi = 150;

    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--start':
                start = parseInt(args[++i]);
                break;
            case '--end':
                end = parseInt(args[++i]);
                break;
            case '--output-dir':
                outputDir = args[++i];
                break;
            case '--dpi':
                dpi = parseInt(args[++i]);
                break;
        }
    }

    if (!fs.existsSync(pdfPath)) {
        console.error(`Error: File not found: ${pdfPath}`);
        process.exit(1);
    }

    // Default output directory
    if (!outputDir) {
        const pdfName = path.basename(pdfPath, '.pdf').replace(/[^a-zA-Z0-9]/g, '_');
        outputDir = `/tmp/pdf_ocr_${pdfName}`;
    }

    try {
        // Create output directory
        fs.mkdirSync(outputDir, { recursive: true });

        // Convert pages to images using pdftoppm
        const prefix = path.join(outputDir, 'page');
        const cmd = `pdftoppm -png -r ${dpi} -f ${start} -l ${end} "${pdfPath}" "${prefix}"`;

        console.error(`Converting pages ${start}-${end} to images...`);
        execSync(cmd);

        // List generated images
        const images = fs.readdirSync(outputDir)
            .filter(f => f.startsWith('page') && f.endsWith('.png'))
            .sort()
            .map(f => path.join(outputDir, f));

        const result = {
            success: true,
            outputDir,
            pageRange: { start, end },
            imageCount: images.length,
            images,
            readInstructions: `Use the Read tool to read these images and extract text with Markdown formatting.`
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
