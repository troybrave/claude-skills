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

// Set status for specific sprints
const statusMap = {
  '2550': 'Past',
  '2551': 'Last',
  '2552': 'Current',
  '2601': 'Next'
};

async function setStatuses() {
  console.log('Setting sprint statuses...\n');

  for (const [sprintName, status] of Object.entries(statusMap)) {
    const res = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: { property: 'Sprint Name', title: { equals: sprintName } }
    });

    if (res.results.length === 0) {
      console.log('  NOT FOUND: ' + sprintName);
      continue;
    }

    const sprint = res.results[0];
    await notion.pages.update({
      page_id: sprint.id,
      properties: { 'Sprint Status': { status: { name: status } } }
    });
    console.log('  ✓ ' + sprintName + ' -> ' + status);
  }

  // Set Future status for sprints after 2601
  console.log('\nSetting Future sprints...');
  const futureRes = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      or: [
        { property: 'Sprint Name', title: { equals: '2602' } },
        { property: 'Sprint Name', title: { equals: '2603' } },
        { property: 'Sprint Name', title: { equals: '2604' } },
        { property: 'Sprint Name', title: { equals: '2605' } }
      ]
    }
  });

  for (const p of futureRes.results) {
    const name = p.properties['Sprint Name']?.title?.[0]?.plain_text || '';
    await notion.pages.update({
      page_id: p.id,
      properties: { 'Sprint Status': { status: { name: 'Future' } } }
    });
    console.log('  ✓ ' + name + ' -> Future');
  }

  console.log('\nDone!');
}

setStatuses();
