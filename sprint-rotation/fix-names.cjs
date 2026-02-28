#!/usr/bin/env node

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

const DATABASE_ID = '579faf3207a5484888acbb7bc7900c26';

// Get ISO week number from date
function getWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Generate correct YYWW from end date
function getCorrectName(endDate) {
  const d = new Date(endDate);
  const year = d.getFullYear().toString().slice(-2);
  const week = getWeek(d).toString().padStart(2, '0');
  return year + week;
}

async function findBadNames() {
  let cursor = undefined;
  const badSprints = [];

  do {
    const res = await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100
    });

    for (const p of res.results) {
      const name = p.properties['Sprint Name']?.title?.[0]?.plain_text || '';
      const dates = p.properties['Dates']?.date;

      // Check if name is NOT 4 digits
      if (name.length !== 4 && dates?.end) {
        const correctName = getCorrectName(dates.end);
        badSprints.push({
          id: p.id,
          currentName: name,
          correctName: correctName,
          endDate: dates.end
        });
      }
    }
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  return badSprints;
}

async function fixNames(dryRun = true) {
  console.log(dryRun ? '=== DRY RUN ===' : '=== FIXING NAMES ===');
  console.log('');

  const badSprints = await findBadNames();
  console.log(`Found ${badSprints.length} sprints with incorrect names`);
  console.log('');

  if (badSprints.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  // Group by correct name to find duplicates
  const byCorrectName = {};
  for (const s of badSprints) {
    if (!byCorrectName[s.correctName]) byCorrectName[s.correctName] = [];
    byCorrectName[s.correctName].push(s);
  }

  // Show what will be renamed
  for (const s of badSprints.slice(0, 30)) {
    const dupeCount = byCorrectName[s.correctName].length;
    const dupeNote = dupeCount > 1 ? ` [${dupeCount} dupes]` : '';
    console.log(`  ${s.currentName} -> ${s.correctName}${dupeNote} (ends ${s.endDate})`);
  }

  if (badSprints.length > 30) {
    console.log(`  ... and ${badSprints.length - 30} more`);
  }

  if (dryRun) {
    console.log('');
    console.log('Run with --fix to apply changes');
    return;
  }

  // Actually fix them
  console.log('');
  console.log('Applying fixes...');

  let success = 0, fail = 0;
  for (const s of badSprints) {
    try {
      await notion.pages.update({
        page_id: s.id,
        properties: {
          'Sprint Name': { title: [{ text: { content: s.correctName } }] }
        }
      });
      console.log(`  ✓ ${s.currentName} -> ${s.correctName}`);
      success++;
    } catch (e) {
      console.log(`  ✗ ${s.currentName}: ${e.message}`);
      fail++;
    }
  }

  console.log('');
  console.log(`Done: ${success} fixed, ${fail} failed`);
}

const shouldFix = process.argv.includes('--fix');
fixNames(!shouldFix);
