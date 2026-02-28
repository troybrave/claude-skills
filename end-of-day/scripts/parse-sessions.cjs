#!/usr/bin/env node
/**
 * Parse Session Files for End-of-Day Review
 *
 * Reads all session files for a given date and extracts:
 * - Completed tasks (from "What Got Done" sections)
 * - Pending tasks (from "What's Next" sections)
 * - Decisions made
 * - Files created/modified
 * - Project/company associations
 *
 * Usage: ./parse-sessions.cjs [YYYY/MM/DD]
 *        ./parse-sessions.cjs              # Uses today's date
 *        ./parse-sessions.cjs --json       # Output as JSON
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SESSION_FILES_ROOT = '/Users/troybrave/Documents/Projects/Full Vault/Session Files';

// Company detection patterns
const COMPANY_PATTERNS = {
  'Claude Code|skill|\\.claude': { id: '099c618e-d42b-4074-b710-8bc140f41ce5', name: 'Troy/Personal' },
  'Endless Winning|EWA|agency': { id: '3bf11a9a-178e-4c88-8906-1604c1fcf0db', name: 'Endless Winning' },
  'Brave Life|BLN': { id: '318f827a-dd8a-4a29-b11b-9570f6d26e6c', name: 'Brave Life' },
  'Taskaroo': { id: '099c618e-d42b-4074-b710-8bc140f41ce5', name: 'Troy/Personal' },
  'Powerbooks|Clear Piggy': { id: '23950f64-6387-801a-b11d-f21ede7797b0', name: 'Powerbooks' },
  'New Life Moving': { id: '11b50f64-6387-8017-93c5-eb6ff3d45a16', name: 'New Life Moving' },
  'Upper Room': { id: '15c50f64-6387-80dc-a6dc-fb2b72432fd1', name: 'Upper Room' },
  'TREM': { id: '7bc3cf2f-69bf-443b-b2cf-e7205815cf61', name: 'TREM' }
};

// Weight estimation patterns
const WEIGHT_PATTERNS = {
  'created skill|new feature|implemented': 4,
  'built|developed|migrated': 4,
  'configured|setup|integrated': 3,
  'fixed|updated|modified': 2,
  'reviewed|researched|explored': 1
};

// Priority detection patterns
const PRIORITY_PATTERNS = {
  'urgent|asap|critical|today': '🔥 Urgent',
  'important|soon|this week': '🥑 High',
  'next week': '🥩 Medium',
  'when possible|eventually': '🧊 Low'
};

function getDatePath(dateStr) {
  if (dateStr) {
    return dateStr;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;

  for (const line of lines) {
    if (line.startsWith('  - ')) {
      // Array item
      if (currentKey && Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey].push(line.replace('  - ', '').trim());
      }
    } else if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (value === '' || value === '|') {
        frontmatter[key] = [];
        currentKey = key;
      } else {
        frontmatter[key] = value;
        currentKey = key;
      }
    }
  }

  return frontmatter;
}

function extractSection(content, sectionName) {
  // Look for ## Section Name or ### Section Name
  const regex = new RegExp(`##+ ${sectionName}\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function extractListItems(sectionContent) {
  const items = [];
  const lines = sectionContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Match checked items [x]
    if (trimmed.match(/^-\s*\[x\]/i)) {
      items.push({
        text: trimmed.replace(/^-\s*\[x\]\s*/i, ''),
        completed: true
      });
    }
    // Match unchecked items [ ]
    else if (trimmed.match(/^-\s*\[\s*\]/)) {
      items.push({
        text: trimmed.replace(/^-\s*\[\s*\]\s*/, ''),
        completed: false
      });
    }
    // Match regular list items
    else if (trimmed.match(/^-\s+/)) {
      items.push({
        text: trimmed.replace(/^-\s+/, ''),
        completed: false
      });
    }
    // Match numbered items
    else if (trimmed.match(/^\d+\.\s+/)) {
      items.push({
        text: trimmed.replace(/^\d+\.\s+/, ''),
        completed: false
      });
    }
  }

  return items;
}

function detectCompany(content, project, filename) {
  const searchText = `${content} ${project} ${filename}`.toLowerCase();

  for (const [pattern, company] of Object.entries(COMPANY_PATTERNS)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(searchText)) {
      return company;
    }
  }

  // Default to Troy/Personal
  return { id: '099c618e-d42b-4074-b710-8bc140f41ce5', name: 'Troy/Personal' };
}

function estimateWeight(taskText) {
  const lowerText = taskText.toLowerCase();

  for (const [pattern, weight] of Object.entries(WEIGHT_PATTERNS)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lowerText)) {
      return weight;
    }
  }

  return 2; // Default weight
}

function detectPriority(taskText) {
  const lowerText = taskText.toLowerCase();

  for (const [pattern, priority] of Object.entries(PRIORITY_PATTERNS)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lowerText)) {
      return priority;
    }
  }

  return '🥩 Medium'; // Default priority
}

function parseSessionFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath, '.md');

  // Parse frontmatter
  const frontmatter = parseFrontmatter(content);
  const project = frontmatter.project || filename.split('-').map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
  const status = frontmatter.status || 'unknown';

  // Detect company
  const company = detectCompany(content, project, filename);

  // Extract sections
  const whatGotDone = extractSection(content, 'What Got Done');
  const whatsNext = extractSection(content, "What's Next");
  const decisionsMade = extractSection(content, 'Decisions Made');
  const filesCreated = extractSection(content, 'Files Created');
  const filesModified = extractSection(content, 'Files Modified');
  const summary = extractSection(content, 'Summary');

  // Parse completed tasks
  const completedItems = extractListItems(whatGotDone);
  const completedTasks = completedItems.map(item => ({
    title: `[EOD] ${item.text}`,
    weight: estimateWeight(item.text),
    status: 'Completed',
    priority: '🧊 Low',
    company: company,
    source: filename
  }));

  // Parse pending tasks
  const pendingItems = extractListItems(whatsNext);
  const pendingTasks = pendingItems.map(item => ({
    title: item.text,
    weight: estimateWeight(item.text),
    status: 'Not Started',
    priority: detectPriority(item.text),
    company: company,
    source: filename
  }));

  // Extract decisions
  const decisions = [];
  if (decisionsMade) {
    const tableRows = decisionsMade.match(/\|[^|]+\|[^|]+\|[^|]+\|/g) || [];
    for (const row of tableRows) {
      if (!row.includes('---') && !row.toLowerCase().includes('decision')) {
        const cells = row.split('|').filter(c => c.trim());
        if (cells.length >= 2) {
          decisions.push({
            decision: cells[0].trim(),
            choice: cells[1].trim(),
            rationale: cells[2] ? cells[2].trim() : ''
          });
        }
      }
    }
  }

  // Extract files created/modified
  const files = {
    created: extractListItems(filesCreated || extractSection(content, 'Files Created This Session')).map(i => i.text),
    modified: extractListItems(filesModified).map(i => i.text)
  };

  return {
    filename,
    project,
    status,
    company,
    summary: summary || frontmatter.resume_command || '',
    completedTasks,
    pendingTasks,
    decisions,
    files
  };
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const dateArg = args.find(a => !a.startsWith('--'));

  const datePath = getDatePath(dateArg);
  const sessionDir = path.join(SESSION_FILES_ROOT, datePath);

  if (!fs.existsSync(sessionDir)) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: 'No session files found', date: datePath, sessions: [] }));
    } else {
      console.log(`No session files found for ${datePath}`);
    }
    process.exit(0);
  }

  const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: 'No session files found', date: datePath, sessions: [] }));
    } else {
      console.log(`No session files found for ${datePath}`);
    }
    process.exit(0);
  }

  const sessions = [];
  let totalCompleted = 0;
  let totalPending = 0;

  for (const file of files) {
    const filePath = path.join(sessionDir, file);
    const session = parseSessionFile(filePath);
    sessions.push(session);
    totalCompleted += session.completedTasks.length;
    totalPending += session.pendingTasks.length;
  }

  const result = {
    date: datePath,
    sessionCount: sessions.length,
    totalCompleted,
    totalPending,
    sessions
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n📅 Session Files for ${datePath}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📁 Sessions: ${sessions.length}`);
    console.log(`✅ Completed Tasks: ${totalCompleted}`);
    console.log(`📋 Pending Tasks: ${totalPending}`);
    console.log();

    for (const session of sessions) {
      console.log(`\n📄 ${session.filename}`);
      console.log(`   Project: ${session.project}`);
      console.log(`   Company: ${session.company.name}`);
      console.log(`   Status: ${session.status}`);

      if (session.completedTasks.length > 0) {
        console.log(`   ✅ Completed (${session.completedTasks.length}):`);
        for (const task of session.completedTasks) {
          console.log(`      - ${task.title} (weight: ${task.weight})`);
        }
      }

      if (session.pendingTasks.length > 0) {
        console.log(`   📋 Pending (${session.pendingTasks.length}):`);
        for (const task of session.pendingTasks) {
          console.log(`      - ${task.title} (${task.priority}, weight: ${task.weight})`);
        }
      }

      if (session.decisions.length > 0) {
        console.log(`   🎯 Decisions (${session.decisions.length}):`);
        for (const d of session.decisions) {
          console.log(`      - ${d.decision}: ${d.choice}`);
        }
      }
    }
  }
}

main();
