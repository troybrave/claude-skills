---
name: sermon-publisher
description: Publishes sermon notes to Notion with beautiful formatting, cover images, and automatic redirect updates. Use when publishing sermons, updating sermon notes, or managing brvlf.com/notes redirect.
version: "1.0.0"
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# Sermon Publisher Skill

Publishes sermon markdown files to the dedicated "Today's Notes" Notion page and ensures brvlf.com/notes redirect is current.

## What This Skill Does

1. Reads sermon markdown file from Obsidian vault
2. Extracts the first `# Heading` as the page title
3. **UPDATES** the Notion page title property with the extracted title
4. **ADDS** beautiful cover image and 📖 icon to the page
5. **APPLIES** professional formatting: colored headings, scripture callouts, visual dividers
6. **UPDATES** the "Today's Notes" page content (excluding the first heading - it's now the page title)
7. Redirect is already configured - no manual steps needed!

**Key Behavior:** The first `# Heading` in the markdown becomes the Notion page title and is removed from the content to avoid duplication.

**Visual Enhancements Applied Automatically:**
- Cover image: Beautiful open Bible with golden light
- Page icon: 📖 Book emoji
- H1 headings: Blue color with dividers
- H2 headings: Smart coloring (purple for scripture, orange for stories)
- H3 headings: Gray color
- Scripture quotes (>) → Blue callouts with 📖 icon
- Scripture references → Purple callouts with 📖 icon
- Lines starting with emojis → Special callouts using that emoji as icon
- Dividers (---) preserved for visual separation

## Usage

### Via Skill (Recommended)
```
Use the sermon-publisher skill to publish [sermon-name]
```

### Via Python Script Directly
```bash
python3 /Users/troybrave/Documents/Projects/Session\ Files/Ai\ Projects/URL\ redirect\ project/sermon-automation-bulletproof/brvlf-redirect-service/cli/publish_sermon.py "/path/to/sermon.md"
```

The script automatically:
- Extracts title from first `# Heading`
- Updates Notion page title
- Removes first heading from content
- Clears old content
- Uploads new sermon blocks

## Configuration

### Credentials (Hardcoded)
- **Notion Token:** `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`
- **Notion Page ID:** `2aa50f6463878084ace0f72115993a7b` (Today's Notes - ALWAYS UPDATE THIS PAGE)
- **Public URL:** `https://bravelife.notion.site/todaysnotes` (Already public, already configured)
- **Railway URL:** `https://brvlf-redirect-service-production.up.railway.app`

### File Locations
- **Sermon Files:**
  - `/Users/troybrave/Documents/Projects/Full Vault/Ministry/Sermon Notes/Troy Brave/` (PRIMARY - USE THIS)

## Step-by-Step Process

### Step 1: Find and Read Sermon File

If user provides file name:
- Search for the file in known sermon directories
- Read the complete markdown content

If no file name provided:
- List recent sermon files
- Ask user which one to publish

### Step 2: Extract Title and Parse Content

**CRITICAL:** Extract title from first `# Heading` and use it as page title:

1. **Find the first `# Heading`** in the markdown file
2. **Extract the title text** (everything after `# `)
3. **Remove that first heading from content** (it will be the page title instead)
4. **Convert remaining markdown to Notion blocks**

Example:
```markdown
# Moses My Servant is dead    <- Extract this as title, remove from content

🧨 **Joshua 1:2**             <- Start content here
## 1. The Legacy of Moses
...
```

### Step 3: Update Page Title, Cover, and Icon

**IMPORTANT:** Always update the page title property, cover image, and icon first!

```bash
curl -X PATCH https://api.notion.com/v1/pages/2aa50f6463878084ace0f72115993a7b \
  -H "Authorization: Bearer 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" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "title": {
        "title": [
          {
            "type": "text",
            "text": {
              "content": "[extracted-title]"
            }
          }
        ]
      }
    },
    "cover": {
      "type": "external",
      "external": {
        "url": "https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1200"
      }
    },
    "icon": {
      "type": "emoji",
      "emoji": "📖"
    }
  }'
```

This sets:
- **Title**: Extracted from first # heading
- **Cover**: Beautiful Bible with golden light (Unsplash)
- **Icon**: 📖 Book emoji

### Step 4: Clear Existing Content and Upload New Sermon

**IMPORTANT:** We UPDATE the existing page, not create a new one!

Make API calls to update page blocks:
```bash
# First, delete all existing blocks
curl -X DELETE https://api.notion.com/v1/blocks/{block-id} \
  -H "Authorization: Bearer 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" \
  -H "Notion-Version: 2022-06-28"

# Then append new sermon content (without the first # heading)
curl -X PATCH https://api.notion.com/v1/blocks/2aa50f6463878084ace0f72115993a7b/children \
  -H "Authorization: Bearer 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" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "children": [sermon-blocks]
  }'
```

### Step 5: Verify Redirect (Already Configured)

The redirect is already set up and doesn't need updating:
- **Path:** /notes
- **Target:** https://bravelife.notion.site/todaysnotes
- **Status:** Active

Test the redirect:
```bash
curl -I https://brvlf.com/notes
```

Should return:
- HTTP 301
- Location: https://bravelife.notion.site/todaysnotes

Confirm with user:
```
✓ Complete!

Sermon published: [sermon-title]
Page title updated on Notion
Live at: https://brvlf.com/notes

Users can text "notes" to 813-590-1706 to receive this link via SMS!
```

## Error Handling

### File Not Found
- List available sermon files
- Ask user to specify correct file name

### Notion API Error
- Check API token is valid
- Verify parent page has integration access
- Show full error message to user

### Redirect Update Failed
- Verify Railway service is running
- Check redirect API endpoint
- Show error and provide manual update command

### User Doesn't Provide Public URL
- Remind them page must be public
- Offer to create redirect with private URL (will require login)
- Provide alternative: update redirect later manually

## Notion Block Formatting

**The Python script automatically applies beautiful formatting:**

### Heading Formatting
- First `# Title` → Removed from content, becomes page title
- Subsequent `# Headings` → Blue heading_1 with divider above
- `## Headings` → heading_2 with smart coloring:
  - Purple if contains: "scripture", "bible", "verse"
  - Orange if contains: "story", "example", "illustration"
  - Default color otherwise
- `### Subheadings` → Gray heading_3

### Scripture & Special Content
- `> Blockquotes` → Blue callouts with 📖 icon (for scripture)
- Lines with scripture references (e.g., "Joshua 1:2") → Purple callouts with 📖 icon
- Lines starting with emojis (e.g., "🧨 **Text**") → Callouts using that emoji as icon
- `---` → Divider blocks for visual separation

### Lists & Text
- `- Bullet points` → bulleted_list_item with preserved formatting
- Paragraphs → paragraph blocks
- **Bold text** → Preserved with annotations
- *Italic text* → Preserved with annotations

### Cover & Icon
- Cover image: https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1200
- Page icon: 📖 emoji

**All formatting is handled automatically by the publish_sermon.py script!**

## Example Execution

```
User: "Use sermon-publisher to publish Moses My Servant is dead"

Step 1: Find file
✓ Found: /Users/troybrave/Documents/Projects/Full Vault/Ministry/Sermon Notes/Troy Brave/Moses My Servant is dead.md

Step 2: Extract title and parse content
✓ Title extracted: Moses My Servant is Dead
✓ First # heading removed from content
✓ Converted to 42 Notion blocks with beautiful formatting

Step 3: Update page title, cover, and icon
✓ Page title updated: Moses My Servant is Dead
✓ Cover image added: Bible with golden light
✓ Icon added: 📖

Step 4: Clear existing content and upload new sermon
✓ Cleared 42 old blocks
✓ Uploaded 42 new blocks with formatting:
  - Blue H1 headings with dividers
  - Purple scripture callouts
  - Gray H3 subheadings
  - Preserved bold/italic text

Step 5: Verify redirect
✓ Redirect working: https://brvlf.com/notes → https://bravelife.notion.site/todaysnotes
✓ HTTP 301 redirect confirmed

✓ Complete! Sermon published with beautiful formatting!
Live at: https://brvlf.com/notes

Users can text "notes" to 813-590-1706 to receive this link!
```

## Future Improvements

1. **Auto-detect public sharing:** Check if parent page is public
2. **Batch publishing:** Publish multiple sermons at once
3. **Preview mode:** Show Notion blocks before creating
4. **Markdown enhancements:** Better formatting for scripture, bullet points
5. **Backup:** Save sermon content before publishing
6. **Version history:** Track previous sermon URLs

## Troubleshooting

### "Page requires login"
→ Page isn't public. Follow Step 4 to share to web.

### "Redirect not updating"
→ Check Railway service is running: `curl https://brvlf-redirect-service-production.up.railway.app/health`

### "Can't find sermon file"
→ Check file paths in configuration match your Obsidian vault location

### "Notion API returns 401"
→ Token may be expired. Check Notion integration settings.

## Related Files

- **Python Script:** `/Users/troybrave/Documents/Projects/Session Files/Ai Projects/URL redirect project/sermon-automation-bulletproof/brvlf-redirect-service/cli/publish_sermon.py`
- **CLI Tool:** `~/bin/brvlf`
- **Railway Service:** `https://brvlf-redirect-service-production.up.railway.app`
- **Sermon Vault:** `/Users/troybrave/Documents/Projects/Full Vault/Ministry/Sermon Notes/Troy Brave/`
- **Documentation:** `/Users/troybrave/Documents/Projects/Session Files/URL redirect project/FINAL-STATUS.md`

## Quick Reference

### Publishing a Sermon (Three Ways)

**1. Using the Skill (Recommended)**
```
Use sermon-publisher to publish [sermon-name]
```

**2. Using Python Script Directly**
```bash
python3 /Users/troybrave/Documents/Projects/Session\ Files/Ai\ Projects/URL\ redirect\ project/sermon-automation-bulletproof/brvlf-redirect-service/cli/publish_sermon.py "/path/to/sermon.md"
```

**3. Finding Sermon Files First**
```bash
ls "/Users/troybrave/Documents/Projects/Full Vault/Ministry/Sermon Notes/Troy Brave/"
```

### What Happens Automatically

✅ **Page Setup**
- Title extracted from first `# Heading`
- Cover image added (Bible with golden light)
- Icon added (📖 book emoji)

✅ **Content Formatting**
- First heading removed (it's now the page title)
- H1: Blue with dividers
- H2: Smart colored (purple/orange/default)
- H3: Gray
- Scripture quotes: Blue callouts with 📖
- Scripture refs: Purple callouts with 📖
- Emoji lines: Special callouts with that emoji
- Bold/italic preserved

✅ **Publishing**
- Old content cleared
- New content uploaded
- Redirect already configured at brvlf.com/notes

### Testing the Published Sermon

```bash
# Test redirect
curl -I https://brvlf.com/notes

# Should return:
# HTTP/2 301
# location: https://bravelife.notion.site/todaysnotes
```

### SMS Workflow (Already Configured)

1. User texts "notes" to **813-590-1706**
2. GHL sends SMS: "Check out today's sermon: https://brvlf.com/notes"
3. User clicks → Redirects to the published sermon
4. User sees beautifully formatted sermon with cover image

### Key Notion API Details

- **Page ID:** `2aa50f6463878084ace0f72115993a7b`
- **Public URL:** `https://bravelife.notion.site/todaysnotes`
- **Short URL:** `https://brvlf.com/notes`
- **Token:** Already configured in script
- **Version:** 2022-06-28

### Common Markdown Patterns

```markdown
# Main Title                    → Page title (removed from content)

## Scripture Reference           → Purple H2
> Quote text                     → Blue callout with 📖

Joshua 1:2                       → Purple callout with 📖
🧨 **Important text**            → Callout with 🧨 icon

## The Legacy of Moses           → Default H2
### Major Achievements           → Gray H3

- **Bold item**: Description    → Bulleted list with bold preserved
---                              → Visual divider
```

### Troubleshooting Checklist

- [ ] Sermon file exists in vault?
- [ ] First line is `# Title`?
- [ ] Python 3 installed? (`python3 --version`)
- [ ] Railway service running? (`curl https://brvlf-redirect-service-production.up.railway.app/health`)
- [ ] Notion page is public? (Check bravelife.notion.site URL)
- [ ] Redirect working? (`curl -I https://brvlf.com/notes`)
