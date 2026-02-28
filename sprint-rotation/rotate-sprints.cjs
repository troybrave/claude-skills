#!/usr/bin/env node

/**
 * Sprint Rotation Script - PRODUCTION VERSION
 *
 * Rotates sprint statuses in Master Cycles Notion database every Tuesday:
 *   Last → Past | Current → Last | Next → Current | Future[0] → Next
 *
 * SAFEGUARDS:
 *   1. Tuesday-only (--force to override)
 *   2. Date validation - blocks if current sprint hasn't ended
 *   3. State validation - ensures exactly 1 of each status type
 *   4. Snapshot for rollback
 *   5. Retry on API failures (3 attempts)
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// === LOAD .env (only if env var not already set) ===
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length && !process.env[key.trim()]) {
      process.env[key.trim()] = val.join('=').trim();
    }
  });
}

// === CONFIG ===
const DATABASE_ID = '579faf3207a5484888acbb7bc7900c26';  // Master Cycles
const TASKS_DATABASE_ID = 'ecccd41265ff41bf99943bbfde001bf1';  // Master Tasks
const STATE_FILE = path.join(__dirname, '.rotation-state.json');
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// === INIT ===
const TOKEN = process.env.NOTION_API_TOKEN;
if (!TOKEN) {
  console.error('[FATAL] NOTION_API_TOKEN not set');
  process.exit(1);
}
const notion = new Client({ auth: TOKEN });

// === UTILITIES ===
const log = (msg, level = 'INFO') => console.log(`[${new Date().toISOString()}] [${level}] ${msg}`);
const isTuesday = () => new Date().getDay() === 2;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function retry(fn, label) {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === MAX_RETRIES) throw e;
      log(`${label} failed (${i}/${MAX_RETRIES}): ${e.message}. Retrying...`, 'WARN');
      await sleep(RETRY_DELAY * i);
    }
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    log(`Could not load state: ${e.message}`, 'WARN');
  }
  return {};
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log(`Could not save state: ${e.message}`, 'WARN');
  }
}

// === DATABASE OPS ===
async function fetchAllSprints() {
  const sprints = [];
  let cursor = undefined;

  do {
    const res = await retry(() => notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100
    }), 'Fetch sprints');

    for (const p of res.results) {
      const name = p.properties['Sprint Name']?.title?.[0]?.plain_text || '';
      // Support both status type and formula type for Sprint Status
      const statusProp = p.properties['Sprint Status'];
      const status = statusProp?.status?.name || statusProp?.formula?.string || '';
      const dates = p.properties['Dates']?.date;
      sprints.push({
        id: p.id,
        name,
        status,
        start: dates?.start || null,
        end: dates?.end || null
      });
    }
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  return sprints;
}

async function updateStatus(id, status, name) {
  await retry(() => notion.pages.update({
    page_id: id,
    properties: { 'Sprint Status': { status: { name: status } } }
  }), `Update ${name}`);
}

// === CORE LOGIC ===
function groupByStatus(sprints) {
  const g = { Past: [], Last: [], Current: [], Next: [], Future: [] };
  for (const s of sprints) {
    if (g[s.status]) g[s.status].push(s);
  }
  // Sort Future by end date, then by name (YYWW format)
  g.Future.sort((a, b) => {
    if (a.end && b.end) return new Date(a.end) - new Date(b.end);
    return (parseInt(a.name) || 0) - (parseInt(b.name) || 0);
  });
  return g;
}

function validate(groups) {
  const errors = [];
  if (groups.Current.length !== 1) errors.push(`Current: expected 1, found ${groups.Current.length}`);
  if (groups.Next.length !== 1) errors.push(`Next: expected 1, found ${groups.Next.length}`);
  if (groups.Last.length !== 1) errors.push(`Last: expected 1, found ${groups.Last.length}`);
  if (groups.Future.length === 0) errors.push('No Future sprints available');
  return errors;
}

function shouldRotate(current) {
  if (!current || !current.end) return { ok: true, reason: 'No end date to check' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(current.end);
  endDate.setHours(23, 59, 59, 999);

  if (today <= endDate) {
    return {
      ok: false,
      reason: `Sprint ${current.name} ends ${current.end}, today is ${today.toISOString().split('T')[0]}`
    };
  }
  return { ok: true, reason: `Sprint ${current.name} ended ${current.end}` };
}

// === COMMANDS ===
async function rotate(force = false) {
  log('═'.repeat(50));
  log('SPRINT ROTATION');
  log('═'.repeat(50));

  // Guard 1: Tuesday only
  if (!force && !isTuesday()) {
    log('Blocked: Not Tuesday. Use --force to override.', 'ERROR');
    process.exit(2);
  }

  // Fetch data
  log('Fetching sprints...');
  const sprints = await fetchAllSprints();
  const groups = groupByStatus(sprints);
  log(`Found ${sprints.length} sprints`);

  // Guard 2: Validate state
  const errors = validate(groups);
  if (errors.length && !force) {
    log('Invalid state:', 'ERROR');
    errors.forEach(e => log(`  - ${e}`, 'ERROR'));
    process.exit(4);
  }

  // Guard 3: Date check (PRIMARY SAFEGUARD)
  const current = groups.Current[0];
  const check = shouldRotate(current);
  if (!check.ok && !force) {
    log(`Blocked: ${check.reason}`, 'ERROR');
    log('Rotation only runs after current sprint ends.', 'ERROR');
    process.exit(5);
  }
  log(`Date check: ${check.reason}`);

  // Show state
  log('');
  log('Before:');
  log(`  Last: ${groups.Last[0]?.name || '-'}`);
  log(`  Current: ${groups.Current[0]?.name || '-'}`);
  log(`  Next: ${groups.Next[0]?.name || '-'}`);
  log(`  Future: ${groups.Future.length} (next: ${groups.Future[0]?.name || '-'})`);

  // Snapshot for rollback
  const snapshot = [
    ...groups.Last,
    ...groups.Current,
    ...groups.Next,
    groups.Future[0]
  ].filter(Boolean).map(s => ({ id: s.id, name: s.name, status: s.status }));

  const state = loadState();
  state.snapshot = { time: new Date().toISOString(), sprints: snapshot };
  saveState(state);

  // Build changes
  const changes = [];
  if (groups.Last[0]) changes.push({ s: groups.Last[0], to: 'Past' });
  if (groups.Current[0]) changes.push({ s: groups.Current[0], to: 'Last' });
  if (groups.Next[0]) changes.push({ s: groups.Next[0], to: 'Current' });
  if (groups.Future[0]) changes.push({ s: groups.Future[0], to: 'Next' });

  // Execute
  log('');
  log('Executing:');
  let success = 0, fail = 0;

  for (const c of changes) {
    try {
      await updateStatus(c.s.id, c.to, c.s.name);
      log(`  ✓ ${c.s.name} → ${c.to}`);
      success++;
    } catch (e) {
      log(`  ✗ ${c.s.name}: ${e.message}`, 'ERROR');
      fail++;
    }
  }

  // Record rotation
  state.lastRotation = { time: new Date().toISOString(), success, fail };
  saveState(state);

  // Result
  log('');
  log('═'.repeat(50));
  log(`DONE: ${success} succeeded, ${fail} failed`);

  if (fail > 0) {
    log('ERRORS OCCURRED - check Notion manually', 'ERROR');
    process.exit(1);
  }

  // Show new state
  log('');
  log('After:');
  const newCurrentSprint = changes.find(c => c.to === 'Current')?.s;
  const newNext = changes.find(c => c.to === 'Next')?.s.name;
  const newLastSprint = changes.find(c => c.to === 'Last')?.s;
  log(`  Last: ${newLastSprint?.name || '-'}`);
  log(`  Current: ${newCurrentSprint?.name || '-'}`);
  log(`  Next: ${newNext || '-'}`);

  // Auto-rollover incomplete tasks from Last to Current
  if (newLastSprint && newCurrentSprint) {
    const rollover = await rolloverIncompleteTasks(newLastSprint.id, newCurrentSprint.id);
    state.lastRotation.tasksRolledOver = rollover.moved;
    state.lastRotation.taskRolloverFailed = rollover.failed;
    saveState(state);
  }
}

async function rollback() {
  log('═'.repeat(50));
  log('ROLLBACK');
  log('═'.repeat(50));

  const state = loadState();
  if (!state.snapshot?.sprints?.length) {
    log('No snapshot available', 'ERROR');
    process.exit(1);
  }

  log(`Restoring from ${state.snapshot.time}`);
  let success = 0, fail = 0;

  for (const s of state.snapshot.sprints) {
    try {
      await updateStatus(s.id, s.status, s.name);
      log(`  ✓ ${s.name} → ${s.status}`);
      success++;
    } catch (e) {
      log(`  ✗ ${s.name}: ${e.message}`, 'ERROR');
      fail++;
    }
  }

  log(`Done: ${success} succeeded, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

// === ROLLOVER INCOMPLETE TASKS ===

/**
 * Move incomplete tasks from Last sprint to Current sprint
 * Called automatically after rotation completes
 */
async function rolloverIncompleteTasks(lastSprintId, currentSprintId, dryRun = false) {
  log('');
  log('─'.repeat(50));
  log(dryRun ? 'TASK ROLLOVER (DRY RUN)' : 'TASK ROLLOVER');
  log('─'.repeat(50));

  // Query tasks in Last sprint that are incomplete
  const incompleteTasks = [];
  let cursor = undefined;

  do {
    const res = await retry(() => notion.databases.query({
      database_id: TASKS_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
      filter: {
        and: [
          { property: 'Cycle', relation: { contains: lastSprintId } },
          { property: 'Status', status: { does_not_equal: 'Completed' } },
          { property: 'Status', status: { does_not_equal: 'Completed NFP' } },
          { property: 'Status', status: { does_not_equal: 'Archived' } }
        ]
      }
    }), 'Fetch incomplete tasks');

    for (const p of res.results) {
      const title = p.properties['Task']?.title?.[0]?.plain_text || 'Untitled';
      const status = p.properties['Status']?.status?.name || 'Unknown';
      incompleteTasks.push({ id: p.id, title, status });
    }
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  if (incompleteTasks.length === 0) {
    log('No incomplete tasks to roll over');
    return { moved: 0, failed: 0 };
  }

  log(`Found ${incompleteTasks.length} incomplete task(s)`);

  let moved = 0, failed = 0;

  for (const task of incompleteTasks) {
    if (dryRun) {
      log(`  → ${task.title} (${task.status})`);
      moved++;
    } else {
      try {
        await retry(() => notion.pages.update({
          page_id: task.id,
          properties: {
            'Cycle': { relation: [{ id: currentSprintId }] }
          }
        }), `Move task ${task.title}`);
        log(`  ✓ ${task.title} (${task.status})`);
        moved++;
      } catch (e) {
        log(`  ✗ ${task.title}: ${e.message}`, 'ERROR');
        failed++;
      }
    }
  }

  log('');
  if (dryRun) {
    log(`Would roll over: ${moved} task(s)`);
  } else {
    log(`Rolled over: ${moved} task(s), ${failed} failed`);
  }

  return { moved, failed };
}

// === MOVE TO NEXT WEEK ===

/**
 * Calculate next week in YYWW format, handling year boundaries
 * Uses database lookup to handle 52 vs 53 week years automatically
 */
function calcNextWeek(cycleNameYYWW, cycleMap) {
  const num = parseInt(cycleNameYYWW);
  if (isNaN(num) || num < 2300 || num > 9999) return null;

  const yy = Math.floor(num / 100);
  const ww = num % 100;

  // Validate week is in valid range (01-53)
  if (ww < 1 || ww > 53) return null;

  // Try next week in same year
  const nextSameYear = yy * 100 + ww + 1;
  if (cycleMap.has(String(nextSameYear))) return String(nextSameYear);

  // Year boundary: go to week 01 of next year
  const nextYear01 = (yy + 1) * 100 + 1;
  if (cycleMap.has(String(nextYear01))) return String(nextYear01);

  return null; // No valid next cycle found
}

async function fetchTasksToMove() {
  const tasks = [];
  let cursor = undefined;

  do {
    const res = await retry(() => notion.databases.query({
      database_id: TASKS_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
      filter: {
        property: 'Cycle Helper',
        select: { equals: 'Move To Next Week' }
      }
    }), 'Fetch tasks to move');

    for (const p of res.results) {
      const title = p.properties['Task']?.title?.[0]?.plain_text || 'Untitled';
      const cycleRel = p.properties['Cycle']?.relation || [];
      tasks.push({
        id: p.id,
        title,
        cycleIds: cycleRel.map(r => r.id)
      });
    }
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  return tasks;
}

async function buildCycleMap() {
  const sprints = await fetchAllSprints();
  const map = new Map();
  for (const s of sprints) {
    map.set(s.name, s.id);
  }
  return map;
}

async function getCycleName(cycleId) {
  const page = await retry(() => notion.pages.retrieve({ page_id: cycleId }), 'Get cycle');
  return page.properties['Sprint Name']?.title?.[0]?.plain_text || null;
}

async function updateTaskCycle(taskId, newCycleId, taskTitle) {
  await retry(() => notion.pages.update({
    page_id: taskId,
    properties: {
      'Cycle': { relation: [{ id: newCycleId }] },
      'Cycle Helper': { select: null }  // Clear the helper field
    }
  }), `Update task ${taskTitle}`);
}

async function moveToNextWeek(dryRun = false) {
  log('═'.repeat(50));
  log(dryRun ? 'MOVE TO NEXT WEEK (DRY RUN)' : 'MOVE TO NEXT WEEK');
  log('═'.repeat(50));

  // Build cycle lookup map (name → id)
  log('Building cycle map...');
  const cycleMap = await buildCycleMap();
  log(`Found ${cycleMap.size} cycles`);

  // Fetch tasks with "Move To Next Week" flag
  log('Fetching tasks to move...');
  const tasks = await fetchTasksToMove();

  if (tasks.length === 0) {
    log('No tasks found with "Move To Next Week" flag');
    return;
  }

  log(`Found ${tasks.length} task(s) to process`);
  log('');

  let success = 0, fail = 0, skipped = 0;

  for (const task of tasks) {
    // Get current cycle name
    if (task.cycleIds.length === 0) {
      log(`  ⚠ ${task.title}: No cycle assigned, skipping`, 'WARN');
      skipped++;
      continue;
    }

    const currentCycleId = task.cycleIds[0];
    const currentCycleName = await getCycleName(currentCycleId);

    if (!currentCycleName) {
      log(`  ⚠ ${task.title}: Could not read cycle name, skipping`, 'WARN');
      skipped++;
      continue;
    }

    // Calculate next week
    const nextCycleName = calcNextWeek(currentCycleName, cycleMap);

    if (!nextCycleName) {
      log(`  ⚠ ${task.title}: No next cycle found for ${currentCycleName}, skipping`, 'WARN');
      skipped++;
      continue;
    }

    const nextCycleId = cycleMap.get(nextCycleName);

    // Safety check (should never happen, but defensive coding)
    if (!nextCycleId) {
      log(`  ⚠ ${task.title}: Cycle ${nextCycleName} not found in map, skipping`, 'WARN');
      skipped++;
      continue;
    }

    if (dryRun) {
      log(`  → ${task.title}: ${currentCycleName} → ${nextCycleName}`);
      success++;
    } else {
      try {
        await updateTaskCycle(task.id, nextCycleId, task.title);
        log(`  ✓ ${task.title}: ${currentCycleName} → ${nextCycleName}`);
        success++;
      } catch (e) {
        log(`  ✗ ${task.title}: ${e.message}`, 'ERROR');
        fail++;
      }
    }
  }

  log('');
  log('═'.repeat(50));
  if (dryRun) {
    log(`DRY RUN: ${success} would move, ${skipped} skipped`);
  } else {
    log(`DONE: ${success} moved, ${fail} failed, ${skipped} skipped`);
  }

  if (fail > 0) process.exit(1);
}

async function dryRun() {
  log('═'.repeat(50));
  log('DRY RUN');
  log('═'.repeat(50));

  const sprints = await fetchAllSprints();
  const groups = groupByStatus(sprints);

  // Validate
  const errors = validate(groups);
  if (errors.length) {
    log('Validation issues:', 'WARN');
    errors.forEach(e => log(`  - ${e}`, 'WARN'));
  }

  // Date check
  const check = shouldRotate(groups.Current[0]);
  log(`Date check: ${check.ok ? 'PASS' : 'FAIL'} - ${check.reason}`);

  // Show state
  log('');
  log('Current state:');
  log(`  Last: ${groups.Last[0]?.name || '-'} (${groups.Last[0]?.start} → ${groups.Last[0]?.end})`);
  log(`  Current: ${groups.Current[0]?.name || '-'} (${groups.Current[0]?.start} → ${groups.Current[0]?.end})`);
  log(`  Next: ${groups.Next[0]?.name || '-'} (${groups.Next[0]?.start} → ${groups.Next[0]?.end})`);
  log(`  Future: ${groups.Future.length} sprints`);

  // Show planned changes
  log('');
  log('Would execute:');
  if (groups.Last[0]) log(`  ${groups.Last[0].name}: Last → Past`);
  if (groups.Current[0]) log(`  ${groups.Current[0].name}: Current → Last`);
  if (groups.Next[0]) log(`  ${groups.Next[0].name}: Next → Current`);
  if (groups.Future[0]) log(`  ${groups.Future[0].name}: Future → Next`);

  log('');
  log('(No changes made)');
}

async function status() {
  log('═'.repeat(50));
  log('STATUS');
  log('═'.repeat(50));

  const sprints = await fetchAllSprints();
  const groups = groupByStatus(sprints);

  const c = groups.Current[0];
  const n = groups.Next[0];
  const l = groups.Last[0];

  log('');
  if (c) log(`CURRENT: ${c.name} (${c.start} → ${c.end})`);
  if (n) log(`NEXT:    ${n.name} (${n.start} → ${n.end})`);
  if (l) log(`LAST:    ${l.name} (${l.start} → ${l.end})`);
  log(`PAST:    ${groups.Past.length} sprints`);
  log(`FUTURE:  ${groups.Future.length} sprints (next: ${groups.Future[0]?.name || '-'})`);

  // Rotation check
  const check = shouldRotate(c);
  log('');
  log(`Rotation ready: ${check.ok ? 'YES' : 'NO'} - ${check.reason}`);

  const state = loadState();
  if (state.lastRotation) {
    log(`Last rotation: ${state.lastRotation.time}`);
  }
}

// === CLI ===
const [cmd] = process.argv.slice(2);
const force = process.argv.includes('--force') || process.argv.includes('-f');
const dry = process.argv.includes('--dry-run') || process.argv.includes('-d');

switch (cmd) {
  case 'rotate':
    rotate(force).catch(e => { log(e.message, 'FATAL'); process.exit(1); });
    break;
  case 'dry-run':
    dryRun().catch(e => { log(e.message, 'FATAL'); process.exit(1); });
    break;
  case 'status':
    status().catch(e => { log(e.message, 'FATAL'); process.exit(1); });
    break;
  case 'rollback':
    rollback().catch(e => { log(e.message, 'FATAL'); process.exit(1); });
    break;
  case 'move-next':
  case 'move-to-next-week':
    moveToNextWeek(dry).catch(e => { log(e.message, 'FATAL'); process.exit(1); });
    break;
  case 'rollover':
    // Standalone rollover: move incomplete tasks from Last to Current
    (async () => {
      const sprints = await fetchAllSprints();
      const groups = groupByStatus(sprints);
      const last = groups.Last[0];
      const current = groups.Current[0];
      if (!last || !current) {
        log('Missing Last or Current sprint', 'ERROR');
        process.exit(1);
      }
      log(`Rolling over from ${last.name} to ${current.name}`);
      await rolloverIncompleteTasks(last.id, current.id, dry);
    })().catch(e => { log(e.message, 'FATAL'); process.exit(1); });
    break;
  case 'health':
    (async () => {
      try {
        const sprints = await fetchAllSprints();
        const groups = groupByStatus(sprints);
        const errors = validate(groups);
        const check = shouldRotate(groups.Current[0]);
        console.log(JSON.stringify({
          status: errors.length === 0 ? 'healthy' : 'unhealthy',
          current: groups.Current[0]?.name || null,
          next: groups.Next[0]?.name || null,
          rotationReady: check.ok,
          issues: errors,
          timestamp: new Date().toISOString()
        }, null, 2));
        process.exit(errors.length === 0 ? 0 : 1);
      } catch (e) {
        console.log(JSON.stringify({ status: 'error', error: e.message }));
        process.exit(1);
      }
    })();
    break;
  default:
    console.log(`
Sprint Rotation Tool

USAGE:
  node rotate-sprints.cjs <command> [options]

COMMANDS:
  rotate           Execute rotation (Tuesday only, unless --force)
                   Auto-rolls over incomplete tasks after rotation
  dry-run          Preview what would happen
  status           Show current sprint status
  rollback         Restore previous state from snapshot
  rollover         Move incomplete tasks from Last to Current sprint
  move-next        Move tasks flagged "Move To Next Week" to next cycle
  health           JSON health check for monitoring

OPTIONS:
  --force, -f      Bypass day/date checks
  --dry-run, -d    Preview changes without executing (for rollover, move-next)

EXIT CODES:
  0  Success
  1  Error
  2  Not Tuesday
  4  Invalid state
  5  Sprint hasn't ended yet
`);
}
