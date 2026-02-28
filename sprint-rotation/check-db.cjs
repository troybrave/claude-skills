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

async function check() {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      or: [
        { property: 'Sprint Name', title: { contains: '2550' } },
        { property: 'Sprint Name', title: { contains: '2551' } },
        { property: 'Sprint Name', title: { contains: '2552' } },
        { property: 'Sprint Name', title: { contains: '2553' } },
        { property: 'Sprint Name', title: { contains: '2554' } },
        { property: 'Sprint Name', title: { contains: '2601' } }
      ]
    },
    sorts: [{ property: 'Sprint Name', direction: 'ascending' }]
  });

  console.log('Cycles around 2552:');
  for (const p of res.results) {
    const name = p.properties['Sprint Name']?.title?.[0]?.plain_text || '';
    const status = p.properties['Sprint Status']?.status?.name || 'NO STATUS';
    const dates = p.properties['Dates']?.date;
    console.log('  ' + name + ': ' + status + ' (' + (dates?.start || 'no start') + ' -> ' + (dates?.end || 'no end') + ') ID: ' + p.id);
  }
}
check();
