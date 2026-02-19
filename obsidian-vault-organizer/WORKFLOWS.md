# Common Obsidian Workflows

## Daily Note Workflow

### Create Daily Note
```markdown
---
tags: [daily, journal]
created: {{date}}
---

# {{date:YYYY-MM-DD}}

## Tasks
- [ ] Task 1
- [ ] Task 2

## Notes


## Links
- [[Yesterday's Note]]
- [[Tomorrow's Note]]
```

### Link to Existing Notes
When creating daily note, search for:
- Recently modified notes
- Notes with today's tasks
- Project notes needing updates

## Zettelkasten Method

### 1. Literature Notes
```markdown
---
type: literature
source: "Book/Article Title"
author: "Author Name"
tags: [literature, topic]
---

# Key Ideas from {{source}}

## Main Points
1. Point one...
2. Point two...

## Quotes
> "Direct quote" - Page X

## Related
- [[Permanent Note 1]]
- [[Permanent Note 2]]
```

### 2. Permanent Notes
```markdown
---
type: permanent
tags: [concept, topic]
created: {{date}}
---

# Concept Title

## Core Idea
One clear idea in your own words

## Connections
- Builds on: [[Related Concept]]
- Contradicts: [[Opposing View]]
- Examples: [[Case Study]]

## Sources
- [[Literature Note 1]]
- [[Literature Note 2]]
```

### 3. Index Notes (MOCs)
```markdown
# Topic Index

## Overview
High-level summary of topic

## Core Concepts
- [[Fundamental Concept 1]]
- [[Fundamental Concept 2]]

## Subtopics
### Subtopic A
- [[Note A1]]
- [[Note A2]]

### Subtopic B
- [[Note B1]]
```

## Project Management Workflow

### Project Note Template
```markdown
---
type: project
status: active
start-date: {{date}}
tags: [project, category]
---

# Project Name

## Goal
Clear objective

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Resources
- [[Resource Note 1]]
- [[Reference Material]]

## Progress Log
### {{date}}
- Progress update...

## Related Projects
- [[Related Project 1]]
```

### Weekly Review
1. Search for: `status: active`
2. Update progress on each project
3. Move completed to archive
4. Create next week's tasks

## Research Workflow

### Research Topic
```markdown
---
type: research
topic: "Topic Name"
status: in-progress
tags: [research, topic]
---

# Research: {{topic}}

## Questions
1. What is...?
2. How does...?
3. Why is...?

## Findings
### Source 1: [[Literature Note]]
- Finding 1
- Finding 2

### Source 2: [[Literature Note]]
- Finding 1

## Synthesis
Connections between findings...

## Next Steps
- [ ] Read [[Article Name]]
- [ ] Explore [[Related Topic]]
```

## Knowledge Base Building

### 1. Capture Phase
- Quick notes with minimal formatting
- Tag with `#inbox`
- Don't worry about organization yet

### 2. Process Phase
- Review inbox notes weekly
- Add proper frontmatter
- Create links to related notes
- Move to appropriate folders
- Remove `#inbox` tag

### 3. Connect Phase
- Find related notes
- Create bi-directional links
- Build MOCs for topics
- Update index notes

### 4. Create Phase
- Synthesize permanent notes
- Write new insights
- Create project notes
- Generate content from knowledge

## Tag Organization Strategies

### Hierarchical Tags
```
#project/work
#project/personal
#status/active
#status/completed
#status/archived
```

### Topic Tags
```
#topic/programming
#topic/writing
#topic/finance
```

### Temporal Tags
```
#2025
#2025/Q4
#2025/November
```

### Status Tags
```
#todo
#in-progress
#done
#waiting
```

## Link Management

### When to Create Links
- Note references same concept
- Note provides context
- Note contains example
- Note shows contrast
- Note is prerequisite knowledge

### Link Syntax Options
```markdown
[[Note Title]]                    # Basic link
[[Note Title|Display Text]]       # Alias
[[Note Title#Heading]]            # Link to heading
[[Note Title#^block-id]]          # Link to block
![[Note Title]]                   # Embed entire note
![[Image.png]]                    # Embed image
```

## Search Patterns

### Find Unlinked Notes (Orphans)
```bash
# Notes with no incoming links
# Search for notes not referenced anywhere
```

### Find Notes Without Tags
```bash
# Search for frontmatter without 'tags:' field
```

### Find Broken Links
```bash
# Search for [[Links]] that don't resolve
```

### Find Duplicate Content
```bash
# Search for similar content across notes
```

## Maintenance Workflows

### Weekly Vault Cleanup
1. Process inbox (`#inbox` tag)
2. Review orphaned notes
3. Consolidate similar tags
4. Update project statuses
5. Archive completed projects
6. Create weekly summary

### Monthly Vault Review
1. Generate vault statistics
2. Review most-linked notes
3. Identify knowledge gaps
4. Create missing MOCs
5. Consolidate redundant notes
6. Update templates

## Template Usage

### Meeting Notes
```markdown
---
type: meeting
date: {{date}}
attendees: []
tags: [meeting, team]
---

# Meeting: {{title}}

## Date
{{date}}

## Attendees
- Person 1
- Person 2

## Agenda
1. Topic 1
2. Topic 2

## Notes


## Action Items
- [ ] Action 1 - @person
- [ ] Action 2 - @person

## Follow-up
[[Next Meeting]]
```

### Reading Notes
```markdown
---
type: reading
title: "Book/Article Title"
author: "Author Name"
completed: false
tags: [reading, topic]
---

# {{title}}

## Metadata
- Author: {{author}}
- Type: Book/Article
- Status: In Progress

## Summary
Brief overview...

## Key Takeaways
1. Takeaway 1
2. Takeaway 2

## Quotes
> "Quote 1"

> "Quote 2"

## Related
- [[Related Note 1]]
- [[Related Note 2]]
```
