# Content Creator Skill

Create content items in the Notion Content Database.

## Trigger
Use when user asks to:
- Create content (video, post, article, graphic)
- Add a content idea
- Track a content piece
- "Make a video about..."
- "Write an article on..."
- "Post about..."
- "Design graphics for..."

Also invoked by **notion-task-creator** when a task involves content creation.

## Content Database
**ID:** `2c950f64-6387-8005-9861-f911607204ea`
**Alias:** `content-database`

## Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| Name | title | Yes | Content title/description |
| Status | status | Yes | Current stage (default: Idea) |
| Content Type | select | No | Type of content |
| Publish Date | date | No | Scheduled/actual publish date |
| Master Company | relation | No | Company this content is for |
| Entities | relation | No | Related entities |
| Task | relation | No | Linked task in Master Tasks |
| Master Projects | relation | No | Associated project |
| Events & Notes | relation | No | Related events/notes |

## Master Company Reference
| Company | ID |
|---------|-----|
| Troy Brave (personal) | `099c618e-d42b-4074-b710-8bc140f41ce5` |
| Endless Winning | `3bf11a9a-178e-4c88-8906-1604c1fcf0db` |
| Fortis Entities | `f8b5613b-814d-4835-b699-d398d6794377` |
| Brave Life | `318f827a-dd8a-4a29-b11b-9570f6d26e6c` |
| Trem Systems | `7bc3cf2f-69bf-443b-b2cf-e7205815cf61` |
| Dawn TMS | `b50f097d-1d59-467e-8bd0-bbb1a1665253` |
| AriMax Logistics | `e3ace802-befb-42dc-b38f-d6c94a98fb71` |
| Brave Freight | `7ee942e8-6411-4fc4-9dba-fb964af77748` |
| Clear Piggy | `24750f64-6387-80ac-8be3-d13f5080ed59` |

## Status Options
| Option | Stage |
|--------|-------|
| Idea | To-do |
| Planned | To-do |
| Scheduled | In progress |
| Recorded | In progress |
| Editing | In progress |
| Ready to Publish | In progress |
| Published | Complete |
| Archived | Inactive |
| On Hold | Inactive |

## Content Type Options
- Graphic
- Blog
- Podcast
- Long (long-form video)
- Short (short-form video)

## Command Template
```bash
cd /Users/troybrave/.claude/.CLI/notion-cli && node cli.js create content-database '{
  "Name": {"title": [{"text": {"content": "CONTENT_TITLE"}}]},
  "Status": {"status": {"name": "STATUS"}},
  "Content Type": {"select": {"name": "TYPE"}},
  "Master Company": {"relation": [{"id": "COMPANY_ID"}]},
  "Publish Date": {"date": {"start": "YYYY-MM-DD"}}
}'
```

## Default Values
- **Status:** `Idea` (for new content items)
- **Content Type:** Infer from context (video → Long/Short, article → Blog, etc.)

## Examples

**User:** "Add a content idea for a YouTube video about productivity"
```bash
cd /Users/troybrave/.claude/.CLI/notion-cli && node cli.js create content-database '{"Name": {"title": [{"text": {"content": "YouTube: Productivity Tips"}}]}, "Status": {"status": {"name": "Idea"}}, "Content Type": {"select": {"name": "Long"}}}'
```

**User:** "Create a short video content item about daily routines, scheduled for next week"
```bash
cd /Users/troybrave/.claude/.CLI/notion-cli && node cli.js create content-database '{"Name": {"title": [{"text": {"content": "Daily Routines Short"}}]}, "Status": {"status": {"name": "Scheduled"}}, "Content Type": {"select": {"name": "Short"}}, "Publish Date": {"date": {"start": "2025-12-21"}}}'
```

**User:** "Add a blog post idea about AI tools"
```bash
cd /Users/troybrave/.claude/.CLI/notion-cli && node cli.js create content-database '{"Name": {"title": [{"text": {"content": "Blog: AI Tools Guide"}}]}, "Status": {"status": {"name": "Idea"}}, "Content Type": {"select": {"name": "Blog"}}}'
```

## Output
Returns the created page ID and URL. When invoked from notion-task-creator, pass the URL back to link in the task body.
