#!/usr/bin/env node
/**
 * Get PDF information and determine processing strategy
 * Usage: ./pdf-info.cjs /path/to/file.pdf
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log('Usage: ./pdf-info.cjs /path/to/file.pdf');
        console.log('');
        console.log('Returns JSON with:');
        console.log('  - pages: total page count');
        console.log('  - title: PDF title (if available)');
        console.log('  - isScanned: true if PDF appears to be scanned/image-based');
        console.log('  - fileSize: file size in bytes');
        console.log('  - recommendedBatchSize: suggested batch size for processing');
        process.exit(0);
    }

    const pdfPath = args[0];

    if (!fs.existsSync(pdfPath)) {
        console.error(JSON.stringify({ error: `File not found: ${pdfPath}` }));
        process.exit(1);
    }

    try {
        // Get PDF info
        const pdfInfo = execSync(`pdfinfo "${pdfPath}" 2>/dev/null`, { encoding: 'utf8' });

        // Parse info
        const pages = parseInt(pdfInfo.match(/Pages:\s+(\d+)/)?.[1] || '0');
        const title = pdfInfo.match(/Title:\s+(.+)/)?.[1]?.trim() || null;
        const fileSize = fs.statSync(pdfPath).size;

        // Test if scanned by checking first 3 pages for text
        let textSample = '';
        try {
            textSample = execSync(`pdftotext -f 1 -l 3 "${pdfPath}" - 2>/dev/null`, { encoding: 'utf8' });
        } catch (e) {
            textSample = '';
        }

        // If very little text extracted, likely scanned
        const cleanText = textSample.replace(/\s+/g, '').trim();
        const isScanned = cleanText.length < 100; // Less than 100 chars from 3 pages = likely scanned

        // Recommend batch size based on type
        let recommendedBatchSize;
        if (isScanned) {
            recommendedBatchSize = 15; // Smaller batches for vision processing
        } else if (pages > 200) {
            recommendedBatchSize = 50; // Larger batches for text extraction
        } else {
            recommendedBatchSize = 30;
        }

        const result = {
            path: pdfPath,
            filename: path.basename(pdfPath),
            directory: path.dirname(pdfPath),
            pages,
            title,
            isScanned,
            fileSize,
            fileSizeHuman: formatBytes(fileSize),
            recommendedBatchSize,
            estimatedBatches: Math.ceil(pages / recommendedBatchSize),
            processingStrategy: isScanned ? 'vision' : 'pdftotext'
        };

        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

main();
