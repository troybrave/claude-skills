#!/usr/bin/env node
/**
 * Validate a Claude Code skill before delivery
 *
 * Usage: ./validate-skill.cjs <skill-name>
 *
 * Checks:
 *   - Required files exist (skill.md, skill-log.md)
 *   - Frontmatter is valid YAML with required fields
 *   - Description quality (length, triggers, action verb)
 *   - Body structure (imperative voice, no duplicates)
 *   - Scripts are executable (if present)
 *   - References are linked in skill.md (if present)
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/Users/troybrave/.claude/skills';

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
Validate a Claude Code skill before delivery

Usage: ./validate-skill.cjs <skill-name>

Checks:
  - Required files exist
  - Frontmatter is valid with required fields
  - Description quality
  - Body structure
  - Scripts are executable
  - References are linked

Example:
  ./validate-skill.cjs pdf-processor
`);
        process.exit(0);
    }

    const skillName = args[0];
    const skillDir = path.join(SKILLS_DIR, skillName);

    // Check skill exists
    if (!fs.existsSync(skillDir)) {
        console.error(`${RED}Error: Skill "${skillName}" not found at ${skillDir}${RESET}`);
        process.exit(1);
    }

    console.log(`\nValidating skill: ${skillName}`);
    console.log('='.repeat(50));

    const results = {
        passed: 0,
        warnings: 0,
        failed: 0
    };

    // Check 1: Required files
    console.log('\n📁 Checking required files...');

    const skillMdPath = path.join(skillDir, 'skill.md');
    const skillLogPath = path.join(skillDir, 'skill-log.md');

    if (fs.existsSync(skillMdPath)) {
        pass('skill.md exists');
        results.passed++;
    } else {
        fail('skill.md is missing');
        results.failed++;
        console.error(`${RED}Cannot continue without skill.md${RESET}`);
        process.exit(1);
    }

    if (fs.existsSync(skillLogPath)) {
        pass('skill-log.md exists');
        results.passed++;
    } else {
        fail('skill-log.md is missing');
        results.failed++;
    }

    // Read skill.md
    const skillContent = fs.readFileSync(skillMdPath, 'utf8');

    // Check 2: Frontmatter
    console.log('\n📋 Checking frontmatter...');

    const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
        fail('No YAML frontmatter found');
        results.failed++;
    } else {
        pass('Frontmatter exists');
        results.passed++;

        const frontmatter = frontmatterMatch[1];

        // Check required fields
        if (/^name:\s*.+/m.test(frontmatter)) {
            pass('name field present');
            results.passed++;
        } else {
            fail('name field missing');
            results.failed++;
        }

        if (/^description:\s*.+/m.test(frontmatter)) {
            pass('description field present');
            results.passed++;

            // Extract description
            const descMatch = frontmatter.match(/^description:\s*(.+)/m);
            if (descMatch) {
                const desc = descMatch[1];

                // Check description quality
                const wordCount = desc.split(/\s+/).length;
                if (wordCount <= 50) {
                    pass(`Description is ${wordCount} words (target: ≤50)`);
                    results.passed++;
                } else {
                    warn(`Description is ${wordCount} words (target: ≤50)`);
                    results.warnings++;
                }

                // Check for action verb
                const actionVerbs = ['Create', 'Build', 'Generate', 'Process', 'Transform', 'Convert', 'Analyze', 'Download', 'Upload', 'Sync', 'Extract', 'Optimize', 'Manage', 'Handle', 'Execute', 'Run', 'Deploy', 'Monitor', 'Track', 'Send', 'Receive', 'Parse', 'Format', 'Validate', 'Check', 'Test', 'Debug', 'Fix', 'Update', 'Delete', 'Remove', 'Add', 'Insert', 'Move', 'Copy', 'Rename', 'Search', 'Find', 'Filter', 'Sort', 'Group', 'Merge', 'Split', 'Combine', 'Export', 'Import', 'Backup', 'Restore', 'Clean', 'Clear', 'Reset', 'Initialize', 'Setup', 'Configure', 'Install', 'Uninstall'];
                const startsWithAction = actionVerbs.some(v => desc.startsWith(v));
                if (startsWithAction) {
                    pass('Description starts with action verb');
                    results.passed++;
                } else {
                    warn('Description should start with action verb');
                    results.warnings++;
                }

                // Check for triggers
                if (/Use when|user says|triggers? on/i.test(desc)) {
                    pass('Description includes trigger information');
                    results.passed++;
                } else {
                    fail('Description missing trigger phrases (add "Use when..." or "user says...")');
                    results.failed++;
                }

                // Check for placeholders
                if (/\{.+\}/.test(desc)) {
                    fail('Description contains unfilled placeholders');
                    results.failed++;
                } else {
                    pass('No unfilled placeholders in description');
                    results.passed++;
                }
            }
        } else {
            fail('description field missing');
            results.failed++;
        }

        if (/^allowed-tools:\s*.+/m.test(frontmatter)) {
            pass('allowed-tools field present');
            results.passed++;
        } else {
            warn('allowed-tools field missing (optional but recommended)');
            results.warnings++;
        }
    }

    // Check 3: Body structure
    console.log('\n📝 Checking body structure...');

    const body = skillContent.replace(/^---\n[\s\S]*?\n---\n?/, '');

    // Check for workflow section
    if (/## Workflow|## Step|### Step/i.test(body)) {
        pass('Workflow/Steps section found');
        results.passed++;
    } else {
        warn('No Workflow section found');
        results.warnings++;
    }

    // Check for quality checklist
    if (/## Quality|## Checklist|- \[ \]/i.test(body)) {
        pass('Quality checklist found');
        results.passed++;
    } else {
        warn('No quality checklist found');
        results.warnings++;
    }

    // Check for error handling
    if (/## Error|Error.*Response|\| Error \|/i.test(body)) {
        pass('Error handling section found');
        results.passed++;
    } else {
        warn('No error handling section found');
        results.warnings++;
    }

    // Check for placeholders in body (excluding code blocks)
    // Remove code blocks before checking for placeholders
    const bodyWithoutCodeBlocks = body.replace(/```[\s\S]*?```/g, '');
    const bodyPlaceholders = bodyWithoutCodeBlocks.match(/\{[^}]+\}/g) || [];
    const templatePlaceholders = bodyPlaceholders.filter(p =>
        /\{(ACTION|trigger|step|name|what|criterion|error)/i.test(p)
    );
    if (templatePlaceholders.length > 0) {
        fail(`Body contains ${templatePlaceholders.length} unfilled template placeholder(s): ${templatePlaceholders.slice(0, 3).join(', ')}${templatePlaceholders.length > 3 ? '...' : ''}`);
        results.failed++;
    } else {
        pass('No unfilled template placeholders in body');
        results.passed++;
    }

    // Check for absolute paths
    const relativePaths = body.match(/`\.\/[^`]+`|`\.\.\//g) || [];
    if (relativePaths.length > 0) {
        warn(`Found ${relativePaths.length} relative path(s) - prefer absolute paths`);
        results.warnings++;
    } else {
        pass('No relative paths found (good!)');
        results.passed++;
    }

    // Check 4: Scripts (if present)
    const scriptsDir = path.join(skillDir, 'scripts');
    if (fs.existsSync(scriptsDir)) {
        console.log('\n⚙️ Checking scripts...');

        const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.cjs') || f.endsWith('.js'));

        if (scripts.length === 0) {
            warn('scripts/ directory exists but is empty');
            results.warnings++;
        } else {
            for (const script of scripts) {
                const scriptPath = path.join(scriptsDir, script);
                const stats = fs.statSync(scriptPath);

                // Check executable
                const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
                if (isExecutable) {
                    pass(`${script} is executable`);
                    results.passed++;
                } else {
                    fail(`${script} is not executable (run: chmod +x ${scriptPath})`);
                    results.failed++;
                }

                // Check for shebang
                const scriptContent = fs.readFileSync(scriptPath, 'utf8');
                if (scriptContent.startsWith('#!/usr/bin/env node')) {
                    pass(`${script} has proper shebang`);
                    results.passed++;
                } else {
                    warn(`${script} missing shebang (add #!/usr/bin/env node)`);
                    results.warnings++;
                }
            }
        }
    }

    // Check 5: References (if present)
    const refsDir = path.join(skillDir, 'references');
    if (fs.existsSync(refsDir)) {
        console.log('\n📚 Checking references...');

        const refs = fs.readdirSync(refsDir).filter(f => f.endsWith('.md'));

        if (refs.length === 0) {
            warn('references/ directory exists but is empty');
            results.warnings++;
        } else {
            for (const ref of refs) {
                // Check if referenced in skill.md
                if (body.includes(ref) || body.includes(`references/${ref}`)) {
                    pass(`${ref} is referenced in skill.md`);
                    results.passed++;
                } else {
                    warn(`${ref} exists but is not referenced in skill.md`);
                    results.warnings++;
                }
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`${GREEN}✓ Passed:${RESET}   ${results.passed}`);
    console.log(`${YELLOW}⚠ Warnings:${RESET} ${results.warnings}`);
    console.log(`${RED}✗ Failed:${RESET}   ${results.failed}`);

    const score = Math.round((results.passed / (results.passed + results.failed)) * 100);
    console.log(`\nScore: ${score}%`);

    if (results.failed === 0 && results.warnings === 0) {
        console.log(`\n${GREEN}✅ Skill is ready for delivery!${RESET}`);
        process.exit(0);
    } else if (results.failed === 0) {
        console.log(`\n${YELLOW}⚠️ Skill is acceptable but has warnings to review${RESET}`);
        process.exit(0);
    } else {
        console.log(`\n${RED}❌ Skill has ${results.failed} failure(s) that must be fixed${RESET}`);
        process.exit(1);
    }
}

function pass(msg) {
    console.log(`  ${GREEN}✓${RESET} ${msg}`);
}

function warn(msg) {
    console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
}

function fail(msg) {
    console.log(`  ${RED}✗${RESET} ${msg}`);
}

main();
