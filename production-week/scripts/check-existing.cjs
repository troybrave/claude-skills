#!/usr/bin/env node
/**
 * Check Existing Production Weeks
 *
 * Queries Airtable to find existing production week records.
 * Use before generating to avoid duplicates.
 *
 * Usage: ./check-existing.cjs --base <base_id> --table <table_id>
 *
 * Options:
 *   --base     Airtable base ID
 *   --table    Airtable table ID
 *   --year     Filter by year (optional)
 *   --json     Output as JSON
 *   --help     Show this help
 *
 * Output: List of existing Week# values
 */

const https = require('https');

function parseArgs(args) {
  const result = {
    base: null,
    table: null,
    year: null,
    json: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--json') {
      result.json = true;
    } else if (arg === '--base' && args[i + 1]) {
      result.base = args[++i];
    } else if (arg === '--table' && args[i + 1]) {
      result.table = args[++i];
    } else if (arg === '--year' && args[i + 1]) {
      result.year = parseInt(args[++i], 10);
    }
  }

  return result;
}

async function fetchRecords(baseId, tableId, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${baseId}/${tableId}?fields%5B%5D=Week%23&pageSize=100`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const allRecords = [];

    function fetchPage(offset = null) {
      let pagePath = options.path;
      if (offset) {
        pagePath += `&offset=${offset}`;
      }

      const req = https.request({ ...options, path: pagePath }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message || 'Airtable API error'));
              return;
            }

            if (json.records) {
              allRecords.push(...json.records);
            }

            if (json.offset) {
              fetchPage(json.offset);
            } else {
              resolve(allRecords);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    }

    fetchPage();
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Check Existing Production Weeks

Queries Airtable to find existing production week records before generating new ones.

Usage:
  ./check-existing.cjs --base <base_id> --table <table_id>

Options:
  --base     Airtable base ID (required)
  --table    Airtable table ID (required)
  --year     Filter by year (optional, e.g., 2024)
  --json     Output as JSON
  --help     Show this help

Environment:
  AIRTABLE_PAT  Airtable Personal Access Token (required)

Examples:
  ./check-existing.cjs --base app2lotuCcMzY8lt1 --table tblVsFIOkwXMwEnHq
  ./check-existing.cjs --base app2lotuCcMzY8lt1 --table tblVsFIOkwXMwEnHq --year 2024
`);
    process.exit(0);
  }

  // Validate required args
  if (!args.base) {
    console.error('Error: --base is required');
    process.exit(1);
  }
  if (!args.table) {
    console.error('Error: --table is required');
    process.exit(1);
  }

  const apiKey = process.env.AIRTABLE_PAT;
  if (!apiKey) {
    console.error('Error: AIRTABLE_PAT environment variable is required');
    console.error('Set it with: export AIRTABLE_PAT="your_token"');
    process.exit(1);
  }

  try {
    console.error('Fetching existing production weeks...\n');
    const records = await fetchRecords(args.base, args.table, apiKey);

    // Extract Week# values
    let weekIds = records
      .map(r => r.fields['Week#'])
      .filter(Boolean)
      .sort();

    // Filter by year if specified
    if (args.year) {
      const yearPrefix = String(args.year % 100).padStart(2, '0');
      weekIds = weekIds.filter(id => id.startsWith(yearPrefix));
    }

    if (args.json) {
      console.log(JSON.stringify({
        total: weekIds.length,
        weekIds,
        years: [...new Set(weekIds.map(id => 2000 + parseInt(id.slice(0, 2), 10)))]
      }, null, 2));
    } else {
      console.log(`Found ${weekIds.length} existing production weeks:\n`);

      // Group by year
      const byYear = {};
      for (const id of weekIds) {
        const year = 2000 + parseInt(id.slice(0, 2), 10);
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push(id);
      }

      for (const [year, ids] of Object.entries(byYear).sort()) {
        console.log(`${year}: ${ids.length} weeks (${ids[0]} - ${ids[ids.length - 1]})`);
      }

      if (weekIds.length > 0) {
        console.log(`\nAll Week IDs: ${weekIds.join(', ')}`);
      }
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
