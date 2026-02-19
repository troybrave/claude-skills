#!/usr/bin/env node
/**
 * Extract text from a batch of PDF pages
 * Usage: ./extract-batch.cjs /path/to/file.pdf --start 1 --end 20 [--output /tmp/batch.txt]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log('Usage: ./extract-batch.cjs /path/to/file.pdf --start 1 --end 20 [--output /tmp/batch.txt]');
        console.log('');
        console.log('Options:');
        console.log('  --start N     First page to extract (default: 1)');
        console.log('  --end N       Last page to extract (default: 20)');
        console.log('  --output PATH Output file path (default: stdout)');
        console.log('  --layout      Use layout preservation mode (default)');
        console.log('  --raw         Use raw mode (better for columns)');
        process.exit(0);
    }

    const pdfPath = args[0];

    // Parse options
    let start = 1;
    let end = 20;
    let output = null;
    let mode = '-layout';

    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--start':
                start = parseInt(args[++i]);
                break;
            case '--end':
                end = parseInt(args[++i]);
                break;
            case '--output':
                output = args[++i];
                break;
            case '--raw':
                mode = '-raw';
                break;
            case '--layout':
                mode = '-layout';
                break;
        }
    }

    if (!fs.existsSync(pdfPath)) {
        console.error(`Error: File not found: ${pdfPath}`);
        process.exit(1);
    }

    try {
        const cmd = `pdftotext -f ${start} -l ${end} ${mode} "${pdfPath}" -`;
        const text = execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });

        if (output) {
            fs.writeFileSync(output, text);
            console.log(`Extracted pages ${start}-${end} to ${output}`);
        } else {
            console.log(text);
        }

    } catch (error) {
        console.error(`Error extracting pages ${start}-${end}: ${error.message}`);
        process.exit(1);
    }
}

main();
