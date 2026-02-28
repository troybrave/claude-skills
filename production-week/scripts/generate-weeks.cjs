#!/usr/bin/env node
/**
 * Production Week Generator
 *
 * Generates production week data for Airtable.
 * Critical Rule: Final Date (not Start Date) determines the year.
 *
 * Usage: ./generate-weeks.cjs --window "Tues-Mon" --start-year 2023 --end-year 2025
 *
 * Options:
 *   --window      Week window pattern (e.g., "Tues-Mon", "Wed-Tues")
 *   --start-year  First year to generate
 *   --end-year    Last year to generate
 *   --json        Output as JSON (default: table format)
 *   --help        Show this help
 */

const DAY_MAP = {
  'sun': 0, 'sunday': 0,
  'mon': 1, 'monday': 1,
  'tue': 2, 'tues': 2, 'tuesday': 2,
  'wed': 3, 'wednesday': 3,
  'thu': 4, 'thur': 4, 'thurs': 4, 'thursday': 4,
  'fri': 5, 'friday': 5,
  'sat': 6, 'saturday': 6
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseArgs(args) {
  const result = {
    window: null,
    startYear: null,
    endYear: null,
    json: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--json') {
      result.json = true;
    } else if (arg === '--window' && args[i + 1]) {
      result.window = args[++i];
    } else if (arg === '--start-year' && args[i + 1]) {
      result.startYear = parseInt(args[++i], 10);
    } else if (arg === '--end-year' && args[i + 1]) {
      result.endYear = parseInt(args[++i], 10);
    }
  }

  return result;
}

function parseWeekWindow(window) {
  // Parse "Tues-Mon" or "Tuesday-Monday" format
  const parts = window.toLowerCase().replace(/\s/g, '').split('-');
  if (parts.length !== 2) {
    throw new Error(`Invalid week window format: "${window}". Expected "StartDay-EndDay" (e.g., "Tues-Mon")`);
  }

  const startDay = DAY_MAP[parts[0]];
  const endDay = DAY_MAP[parts[1]];

  if (startDay === undefined) {
    throw new Error(`Unknown start day: "${parts[0]}"`);
  }
  if (endDay === undefined) {
    throw new Error(`Unknown end day: "${parts[1]}"`);
  }

  // Verify it's a 7-day cycle (end day should be start day - 1, wrapping)
  const expectedEnd = (startDay + 6) % 7;
  if (endDay !== expectedEnd) {
    console.warn(`Warning: ${window} is not a standard 7-day cycle. Expected end day: ${DAY_NAMES[expectedEnd]}`);
  }

  return { startDay, endDay };
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateWeeks(startYear, endYear, endDayNum, weekWindow) {
  const weeks = [];

  // Find first Final Date of startYear
  // Start from Jan 1 and find first occurrence of end day
  let finalDate = new Date(`${startYear}-01-01T12:00:00`);
  while (finalDate.getDay() !== endDayNum) {
    finalDate.setDate(finalDate.getDate() + 1);
  }

  // Calculate corresponding start date (6 days before final)
  let startDate = new Date(finalDate);
  startDate.setDate(startDate.getDate() - 6);

  let currentYear = startYear;
  let weekNum = 1;

  while (true) {
    const finalYear = finalDate.getFullYear();

    // Stop if we've passed end year
    if (finalYear > endYear) break;

    // Reset week counter on year change (based on Final Date year)
    if (finalYear > currentYear) {
      currentYear = finalYear;
      weekNum = 1;
    }

    // Format: YYWW (e.g., 2301 for Year 23, Week 01)
    const weekId = String(currentYear % 100).padStart(2, '0') +
                   String(weekNum).padStart(2, '0');

    weeks.push({
      weekId,
      startDate: formatDate(startDate),
      finalDate: formatDate(finalDate),
      year: currentYear,
      weekNum,
      weekFrame: weekWindow
    });

    // Move to next week
    startDate.setDate(startDate.getDate() + 7);
    finalDate.setDate(finalDate.getDate() + 7);
    weekNum++;
  }

  return weeks;
}

function printTable(weeks) {
  console.log('Week#\tStart Date\tFinal Date\tYear\tWeek');
  console.log('-----\t----------\t----------\t----\t----');
  for (const week of weeks) {
    console.log(`${week.weekId}\t${week.startDate}\t${week.finalDate}\t${week.year}\t${week.weekNum}`);
  }
  console.log(`\nTotal: ${weeks.length} weeks generated`);
}

function printBoundaryVerification(weeks, startYear, endYear) {
  console.log('\n=== Boundary Verification ===\n');

  for (let year = startYear; year <= endYear; year++) {
    const yearWeeks = weeks.filter(w => w.year === year);
    if (yearWeeks.length === 0) continue;

    const firstWeek = yearWeeks[0];
    const lastWeek = yearWeeks[yearWeeks.length - 1];

    console.log(`Year ${year}:`);
    console.log(`  First: ${firstWeek.weekId} (Start: ${firstWeek.startDate}, Final: ${firstWeek.finalDate})`);
    console.log(`  Last:  ${lastWeek.weekId} (Start: ${lastWeek.startDate}, Final: ${lastWeek.finalDate})`);
    console.log(`  Total: ${yearWeeks.length} weeks\n`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Production Week Generator

Generates production week records with the CRITICAL RULE:
The Final Date (not Start Date) determines which year a week belongs to.

Usage:
  ./generate-weeks.cjs --window "Tues-Mon" --start-year 2023 --end-year 2025

Options:
  --window      Week window pattern (e.g., "Tues-Mon", "Wed-Tues", "Mon-Sun")
  --start-year  First year to generate
  --end-year    Last year to generate
  --json        Output as JSON instead of table
  --help        Show this help

Examples:
  ./generate-weeks.cjs --window "Tues-Mon" --start-year 2023 --end-year 2025
  ./generate-weeks.cjs --window "Wed-Tues" --start-year 2024 --end-year 2026 --json
`);
    process.exit(0);
  }

  // Validate required args
  if (!args.window) {
    console.error('Error: --window is required (e.g., "Tues-Mon")');
    process.exit(1);
  }
  if (!args.startYear) {
    console.error('Error: --start-year is required');
    process.exit(1);
  }
  if (!args.endYear) {
    console.error('Error: --end-year is required');
    process.exit(1);
  }
  if (args.startYear > args.endYear) {
    console.error('Error: --start-year must be <= --end-year');
    process.exit(1);
  }

  try {
    const { startDay, endDay } = parseWeekWindow(args.window);
    console.log(`Generating weeks for ${args.window} (${DAY_NAMES[startDay]}-${DAY_NAMES[endDay]}) from ${args.startYear} to ${args.endYear}\n`);

    const weeks = generateWeeks(args.startYear, args.endYear, endDay, args.window);

    if (args.json) {
      console.log(JSON.stringify(weeks, null, 2));
    } else {
      printTable(weeks);
      printBoundaryVerification(weeks, args.startYear, args.endYear);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
