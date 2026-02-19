# Bulletproof Daily Sync

**Zero Data Loss Guarantee** - Bi-directional sync for venture files between local Obsidian vault and Google Drive.

## Overview

This skill implements a 6-layer defense system that makes it **impossible** to accidentally delete files during sync operations. Every file operation is logged, backed up, and can be rolled back for 30 days.

## Quick Start

```bash
# Show what would change (safe - no modifications)
/Users/troybrave/.claude/skills/daily-sync/sync-ventures.sh --dry-run

# Perform actual sync (all ventures)
/Users/troybrave/.claude/skills/daily-sync/sync-ventures.sh

# Sync specific venture
/Users/troybrave/.claude/skills/daily-sync/sync-ventures.sh --venture Taskaroo

# View sync history
/Users/troybrave/.claude/skills/daily-sync/sync-ventures.sh --history

# Rollback if needed
/Users/troybrave/.claude/skills/daily-sync/sync-ventures.sh --rollback 20251114-172211
```

## Architecture: 6-Layer Defense System

### Layer 1: Pre-flight Checks
- Verify directories exist and are accessible
- Check disk space (requires 20% free minimum)
- Verify Google Drive Desktop sync is idle
- Validate folder structures

**Aborts if:** Paths invalid, insufficient disk space, GDrive syncing, system unstable

### Layer 2: Analysis & Planning
- Generate complete file manifests (path, size, modified date, MD5 hash)
- Compare local vs Google Drive states
- Create detailed sync plan
- Identify new files, modified files, and conflicts

**Never auto-resolves conflicts** - Always keeps both versions

### Layer 3: Incremental Backup
- Create timestamped archive directory
- Backup EVERY file that will be modified
- Save all manifests and sync plans
- Verify backups before proceeding

**Guarantee:** Every file has a backup before any modification

### Layer 4: Copy-Only Execution
- Atomic copy operations (temp → final)
- MD5 verification for every copy
- Size verification for every copy
- No delete commands exist in code

**Forbidden operations:** `rm`, `rsync --delete`, `find -delete`

### Layer 5: Post-Sync Verification
- Generate new manifests after sync
- Verify file counts (must increase or stay same, NEVER decrease)
- Confirm all planned operations completed
- Generate detailed sync report

**Aborts if:** File count decreased, operations incomplete, verification failed

### Layer 6: Rollback Capability
- 30-day archive retention
- Instant restore from any archive
- Preview rollback before executing
- Complete audit trail

**Guarantee:** Any sync can be undone within seconds

## Safety Guarantees

This system CANNOT delete files because:

1. ✅ **No delete commands** - Forbidden: `rm`, `rsync --delete`, `find -delete`
2. ✅ **Backup before overwrite** - Original always preserved in archive
3. ✅ **File count assertion** - Post-sync ≥ pre-sync or ABORT
4. ✅ **Conflicts preserved** - Both versions kept with clear naming
5. ✅ **30-day rollback** - Any mistake can be undone
6. ✅ **Pre-flight checks** - Won't run if system unstable

## Configuration

### Ventures Configuration
**File:** `config/ventures.json`

```json
{
  "ventures": [
    {
      "name": "Taskaroo",
      "local": "/path/to/local/Taskaroo",
      "gdrive": "/path/to/gdrive/Taskaroo",
      "priority": 1
    }
  ],
  "archive_path": "/Users/troybrave/.claude/.sync-archive",
  "archive_retention_days": 30,
  "min_free_space_percent": 20
}
```

### Sync Rules
**File:** `config/sync-rules.json`

```json
{
  "rules": {
    "never_delete": true,
    "always_backup_before_overwrite": true,
    "preserve_conflicts": true,
    "verify_every_copy": true,
    "atomic_operations": true
  },
  "exclusions": {
    "patterns": [
      ".DS_Store",
      "*.tmp",
      ".git",
      "node_modules"
    ]
  }
}
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without making modifications |
| `--venture NAME` | Sync only specified venture |
| `--rollback TIME` | Restore from archive (format: YYYYMMDD-HHMMSS) |
| `--history` | Show sync history and available archives |
| `--verify-only` | Verify current state without syncing |
| `--verbose` | Show detailed output |
| `--auto` | Automatic mode for cron jobs |
| `--help` | Show help message |

## Conflict Resolution

When a file is modified in BOTH locations since last sync:

1. **Both versions are preserved** with clear naming:
   - `filename_CONFLICT_local.ext` (local version)
   - `filename_CONFLICT_gdrive.ext` (GDrive version)

2. **User decides** which version to keep (or merge manually)

3. **Sync report** shows all conflicts detected

**Never auto-resolves** - Your data, your decision

## Archive Structure

```
/Users/troybrave/.claude/.sync-archive/
└── 20251114-172211/
    ├── metadata.json           # Sync session metadata
    ├── sync-plan.json          # What was planned
    ├── manifest-comparison.json
    ├── pre-sync-manifests/
    │   ├── local_manifest.json
    │   └── gdrive_manifest.json
    ├── post-sync-manifests/
    │   ├── local_manifest.json
    │   └── gdrive_manifest.json
    ├── local-backups/          # Files replaced in local
    ├── gdrive-backups/         # Files replaced in GDrive
    ├── verification-report.json
    └── sync-report.txt
```

## Logs

All operations logged to: `logs/sync-YYYYMMDD-HHMMSS.log`

## Cron Job Setup

For daily automatic sync at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line:
0 2 * * * /Users/troybrave/.claude/skills/daily-sync/sync-ventures.sh --auto
```

## Troubleshooting

### Sync Failed - Pre-flight Checks

**Problem:** Pre-flight checks failing

**Solutions:**
- Verify both paths exist and are accessible
- Check disk space (need 20% free)
- Wait for Google Drive Desktop to finish syncing
- Check system permissions

### Conflicts Detected

**Problem:** Files modified in both locations

**Action Required:**
1. Review both conflict files
2. Merge changes manually if needed
3. Keep the merged version
4. Delete the conflict marker files

### Need to Rollback

**Problem:** Need to undo a sync

**Solution:**
```bash
# 1. View available archives
./sync-ventures.sh --history

# 2. Preview rollback
./sync-ventures.sh --rollback 20251114-172211

# 3. Confirm and execute
# (script will prompt for confirmation)
```

## File Permissions

All files should have appropriate permissions:

```bash
# Library files (read-only)
chmod 644 lib/*.sh

# Main script (executable)
chmod 755 sync-ventures.sh
```

## Testing

Always test with `--dry-run` first:

```bash
# Preview what would happen
./sync-ventures.sh --dry-run

# If output looks good, run actual sync
./sync-ventures.sh
```

## Technical Details

### Manifest Structure

```json
{
  "generated_at": "2025-11-14T23:00:00Z",
  "base_path": "/path/to/venture",
  "files": [
    {
      "path": "Strategy/plan.md",
      "size": 1024,
      "modified": "2025-11-14T22:00:00",
      "md5": "abc123..."
    }
  ],
  "stats": {
    "total_files": 100,
    "total_size": 1048576
  }
}
```

### Sync Plan Structure

```json
{
  "created_at": "2025-11-14T23:00:00Z",
  "operations": [
    {
      "type": "copy_to_local",
      "source": "/gdrive/path/file.md",
      "destination": "/local/path/file.md",
      "reason": "newer_in_gdrive",
      "backup_required": true
    }
  ],
  "summary": {
    "total_operations": 10,
    "copy_to_local": 5,
    "copy_to_gdrive": 4,
    "conflicts": 1,
    "would_delete": 0
  }
}
```

## Why This is Bulletproof

1. **Copy-only operations** - Never uses delete commands
2. **File count assertion** - Can only increase or stay same
3. **Backup before modify** - Original always preserved
4. **Atomic operations** - Temp → final with verification
5. **Complete audit trail** - Every operation logged
6. **30-day safety net** - Can undo any sync
7. **Conflict preservation** - Never auto-resolves
8. **Pre-flight checks** - Won't run if system unstable

## License

Internal use only - Troy Brave's venture management system

## Author

Created by Claude Code based on the Bulletproof Daily Sync Plan
Date: November 14, 2025
Version: 1.0.0
