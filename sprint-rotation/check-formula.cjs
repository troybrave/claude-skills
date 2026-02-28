const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length && !process.env[key.trim()]) {
      process.env[key.trim()] = val.join('=').trim();
    }
  });
}

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const DATABASE_ID = '579faf3207a5484888acbb7bc7900c26';

async function checkFormula() {
  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });

  const statusProp = db.properties['Sprint Status'];
  console.log('Sprint Status property type: ' + statusProp.type);
  console.log('Formula expression: ' + (statusProp.formula?.expression || 'N/A'));

  // Also check what the computed values look like
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      or: [
        { property: 'Sprint Name', title: { equals: '2550' } },
        { property: 'Sprint Name', title: { equals: '2551' } },
        { property: 'Sprint Name', title: { equals: '2552' } },
        { property: 'Sprint Name', title: { equals: '2601' } }
      ]
    },
    sorts: [{ property: 'Sprint Name', direction: 'ascending' }]
  });

  console.log('\nComputed values:');
  for (const p of res.results) {
    const name = p.properties['Sprint Name']?.title?.[0]?.plain_text || '';
    const statusPropVal = p.properties['Sprint Status'];
    console.log('  ' + name + ': ' + JSON.stringify(statusPropVal));
  }
}

checkFormula();
