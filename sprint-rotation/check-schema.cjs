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

async function checkSchema() {
  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  console.log('Database: ' + db.title[0]?.plain_text);
  console.log('\nProperties:');

  for (const [name, prop] of Object.entries(db.properties)) {
    console.log('  ' + name + ': ' + prop.type);
    if (prop.type === 'status') {
      console.log('    Options: ' + JSON.stringify(prop.status?.options?.map(o => o.name)));
      console.log('    Groups: ' + JSON.stringify(prop.status?.groups?.map(g => ({ name: g.name, options: g.option_ids }))));
    }
  }
}

checkSchema();
