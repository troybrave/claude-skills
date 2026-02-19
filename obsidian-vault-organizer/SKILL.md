---
name: obsidian-vault-organizer
description: Organizes Obsidian vaults, finds notes, creates links, manages tags, and helps with note-taking workflows. Use when working with Obsidian, organizing notes, searching vault content, or managing knowledge base.
version: "1.0.0"
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Obsidian Vault Organizer

Helps you organize and manage your Obsidian vaults with intelligent note organization, link discovery, tag management, and content search.

## When This Skill Activates

- User mentions "Obsidian", "vault", or "notes"
- User wants to find, organize, or create notes
- User asks about linking notes or finding connections
- User needs to search vault content
- User wants to manage tags or metadata
- User asks to create index pages or MOCs (Maps of Content)

## Vault Locations

Your known Obsidian vaults:
- **iCloud Vault**: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Brave Vault`
- **Remote Obsidian**: `~/Documents/Remote Obsidian/Remote Brave`
- **Custom vaults**: Ask user if working with a different location

## Quick Actions

### Find Notes
```
Find all notes about [topic]
```
- Use Grep to search vault content
- Search in file names and content
- Case-insensitive search
- Return relevant note paths and snippets

### Organize by Topic
```
Organize notes about [topic] into [folder]
```
- Find related notes
- Create folder if needed
- Move or suggest organization structure
- Create index note linking related content

### Create Links Between Notes
```
Find notes related to [note-name] and suggest links
```
- Search for similar content
- Identify potential connections
- Suggest bi-directional links
- Generate link syntax for Obsidian

### Tag Management
```
Find all notes with tag #[tagname]
```
- Search for specific tags
- List all tags in vault
- Suggest tag consolidation
- Find untagged notes

### Create Index/MOC
```
Create a Map of Content for [topic]
```
- Find all related notes
- Generate structured index
- Include backlinks
- Create hierarchical organization

### Search Vault Content
```
Search vault for "[search term]"
```
- Full-text search across all notes
- Context-aware results
- Show surrounding content
- Group by folder/topic

## Obsidian-Specific Operations

### Internal Links
Format: `[[Note Title]]` or `[[Note Title|Display Text]]`

### Tags
Format: `#tag` or `#nested/tag`

### Frontmatter
```yaml
---
tags: [tag1, tag2]
created: 2025-11-09
modified: 2025-11-09
---
```

### Backlinks
Automatically tracked by Obsidian - we can help create them

### Daily Notes
Standard location: `Daily Notes/YYYY-MM-DD.md`

## Progressive Disclosure

For detailed operations, see:
- **WORKFLOWS.md** - Common Obsidian workflows
- **TEMPLATES.md** - Note templates and structures
- **SEARCH.md** - Advanced search patterns

## Common Workflows

### 1. Find Related Notes
```
1. Search vault for keywords
2. Analyze content similarity
3. Suggest link connections
4. Generate connection map
```

### 2. Organize New Notes
```
1. Analyze note content
2. Suggest appropriate folder
3. Recommend tags
4. Identify related notes for linking
```

### 3. Create Topic Index
```
1. Find all notes on topic
2. Group by subtopic
3. Create hierarchical structure
4. Generate MOC with links
```

### 4. Clean Up Vault
```
1. Find duplicate notes
2. Identify orphaned notes (no links)
3. Suggest tag consolidation
4. Report broken links
```

## Best Practices

### When Searching
- Use Grep with case-insensitive flag
- Search both filenames and content
- Provide context (surrounding lines)
- Group results logically

### When Creating Links
- Use Obsidian's `[[]]` syntax
- Check if target note exists
- Suggest creating missing notes
- Use meaningful display text

### When Organizing
- Respect existing folder structure
- Ask before moving files
- Update links if files move
- Maintain vault consistency

### When Creating Notes
- Include frontmatter for metadata
- Add relevant tags
- Link to related notes
- Use consistent naming

## Output Formats

### Search Results
```markdown
## Found 5 notes matching "topic"

### Note 1: [[Example Note]]
Located: Folder/Subfolder/
Tags: #tag1, #tag2
Snippet: ...relevant content...

### Note 2: [[Another Note]]
...
```

### Link Suggestions
```markdown
## Suggested links for [[Current Note]]:

1. [[Related Note 1]] - Similar topic about...
2. [[Related Note 2]] - Mentions same concept...
3. [[Related Note 3]] - Connected idea...

Add to your note:
- [[Related Note 1|descriptive text]]
```

### MOC Structure
```markdown
# Topic Map of Content

## Overview
Brief description of topic

## Core Concepts
- [[Concept 1]]
- [[Concept 2]]

## Subtopics
### Subtopic A
- [[Note 1]]
- [[Note 2]]

### Subtopic B
- [[Note 3]]
```

## Vault Statistics

When requested, provide:
- Total note count
- Notes per folder
- Most common tags
- Orphaned notes count
- Recent notes
- Vault size

## Error Handling

If vault path doesn't exist:
1. Check alternative locations
2. Ask user for vault path
3. Suggest checking Obsidian settings

If search returns too many results:
1. Suggest narrowing search
2. Show top 10 most relevant
3. Offer to search in specific folder

If note doesn't exist for link:
1. Suggest creating it
2. Provide template
3. Link to related notes

## Integration with Obsidian MCP

If obsidian-mcp server is available in `~/.claude/.MCP/`:
- Use MCP tools for direct vault access
- Leverage Obsidian's API capabilities
- Access graph data
- Use advanced search features

Check: `ls ~/.claude/.MCP/obsidian-mcp/` for MCP integration

## Notes

- Always preserve Obsidian's markdown syntax
- Respect `.obsidian` config folder (don't modify)
- Handle spaces in note titles correctly
- Use forward slashes for paths
- Preserve existing frontmatter
- Don't delete notes without confirmation
