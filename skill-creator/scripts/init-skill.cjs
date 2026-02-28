#!/usr/bin/env node
/**
 * Initialize a new Claude Code skill with proper structure
 *
 * Usage: ./init-skill.cjs <skill-name> [--with-scripts] [--with-references]
 *
 * Creates:
 *   /Users/troybrave/.claude/skills/<skill-name>/
 *   ├── skill.md           (template)
 *   ├── skill-log.md       (from template)
 *   ├── scripts/           (if --with-scripts)
 *   └── references/        (if --with-references)
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/Users/troybrave/.claude/skills';
const SKILL_CREATOR_DIR = '/Users/troybrave/.claude/skills/skill-creator';

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
Initialize a new Claude Code skill

Usage: ./init-skill.cjs <skill-name> [options]

Options:
  --with-scripts     Create scripts/ directory
  --with-references  Create references/ directory
  --full             Create all optional directories

Examples:
  ./init-skill.cjs pdf-processor
  ./init-skill.cjs api-client --with-scripts
  ./init-skill.cjs complex-workflow --full

Creates skill at: /Users/troybrave/.claude/skills/<skill-name>/
`);
        process.exit(0);
    }

    const skillName = args[0];
    const withScripts = args.includes('--with-scripts') || args.includes('--full');
    const withReferences = args.includes('--with-references') || args.includes('--full');

    // Validate skill name
    if (!/^[a-z][a-z0-9-]*$/.test(skillName)) {
        console.error('Error: Skill name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
        console.error('Example: my-skill, pdf-processor, api-client');
        process.exit(1);
    }

    const skillDir = path.join(SKILLS_DIR, skillName);

    // Check if already exists
    if (fs.existsSync(skillDir)) {
        console.error(`Error: Skill "${skillName}" already exists at ${skillDir}`);
        process.exit(1);
    }

    // Create main directory
    fs.mkdirSync(skillDir, { recursive: true });
    console.log(`✓ Created: ${skillDir}/`);

    // Create optional directories
    if (withScripts) {
        fs.mkdirSync(path.join(skillDir, 'scripts'));
        console.log(`✓ Created: ${skillDir}/scripts/`);
    }

    if (withReferences) {
        fs.mkdirSync(path.join(skillDir, 'references'));
        console.log(`✓ Created: ${skillDir}/references/`);
    }

    // Create skill.md template
    const titleCase = skillName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const today = new Date().toISOString().split('T')[0];

    const skillTemplate = `---
name: ${skillName}
description: {ACTION VERB} {what}. Use when user says "{trigger 1}", "{trigger 2}", "{trigger 3}". NOT for {non-trigger if ambiguous}.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# ${titleCase}

{One sentence purpose - what does this skill do?}

---

## Workflow

### Step 1: {Name}

{Instructions - use imperative voice}

### Step 2: {Name}

{Instructions}

### Step 3: {Name}

{Instructions}

---

## Quality Checklist

- [ ] {Success criterion 1}
- [ ] {Success criterion 2}
- [ ] {Success criterion 3}

---

## Error Handling

| Error | Response |
|-------|----------|
| {Error type 1} | {What to do} |
| {Error type 2} | {What to do} |
`;

    fs.writeFileSync(path.join(skillDir, 'skill.md'), skillTemplate);
    console.log(`✓ Created: ${skillDir}/skill.md`);

    // Copy skill-log template
    const logTemplatePath = path.join(SKILL_CREATOR_DIR, 'skill-log-template.md');
    if (fs.existsSync(logTemplatePath)) {
        let logTemplate = fs.readFileSync(logTemplatePath, 'utf8');
        // Replace placeholders
        logTemplate = logTemplate.replace(/\{skill-name\}/g, skillName);
        logTemplate = logTemplate.replace(/\{YYYY-MM-DD\}/g, today);
        logTemplate = logTemplate.replace(/\{Creation Date\}/g, today);
        fs.writeFileSync(path.join(skillDir, 'skill-log.md'), logTemplate);
        console.log(`✓ Created: ${skillDir}/skill-log.md`);
    } else {
        // Create minimal log if template doesn't exist
        const minimalLog = `# Skill Log: ${skillName}

## Status

| Metric | Value |
|--------|-------|
| **Created** | ${today} |
| **Last Updated** | ${today} |
| **Clean Runs** | 0 |
| **Stability** | Learning |

## Known Issues & Fixes

(None yet)

## Run History

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|

## Version Notes

### v1.0 - ${today}
- Initial skill creation
`;
        fs.writeFileSync(path.join(skillDir, 'skill-log.md'), minimalLog);
        console.log(`✓ Created: ${skillDir}/skill-log.md`);
    }

    // Summary
    console.log(`
✅ Skill "${skillName}" initialized!

📁 Location: ${skillDir}/

📄 Files created:
   - skill.md (edit this with your skill definition)
   - skill-log.md (learning log - auto-managed)${withScripts ? '\n   - scripts/ (add .cjs scripts here)' : ''}${withReferences ? '\n   - references/ (add detailed docs here)' : ''}

📝 Next steps:
   1. Edit skill.md:
      - Write a specific description with trigger phrases
      - Define the workflow steps
      - Add quality checklist
      - Add error handling

   2. Test the skill by invoking it

   3. Gather feedback and update skill-log.md
`);
}

main();
