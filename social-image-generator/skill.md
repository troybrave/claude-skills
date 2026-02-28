# Social Image Generator

Generate professional, on-brand social media images for Instagram, Facebook, Twitter, and LinkedIn. This skill works across multiple clients with unique branding requirements.

## When to Use This Skill

Use this skill when the user requests:
- "Generate a quote image for Instagram"
- "Create social media graphics for [client name]"
- "Make an announcement post for Facebook"
- "Design an event promo image"
- "Generate a batch of quote images"
- "Create blog post images"
- "Design Instagram story graphics"

## Capabilities

This skill can:
- Generate single social media images
- Process batch image generation from JSON input
- Onboard new clients with interactive wizard
- Validate brand configurations
- List available templates
- Generate images for Instagram (feed/story/carousel), Facebook, Twitter, LinkedIn
- Ensure WCAG accessibility compliance
- Maintain complete brand consistency

## Available Templates

- **quote-gradient** - Quote with gradient background
- **quote-minimal** - Minimalist quote design
- **quote-bold** - Bold, high-impact quote
- **announcement-bold** - Bold announcement
- **announcement-minimal** - Clean announcement
- **event-standard** - Event with date/time/location
- **event-countdown** - Event with countdown
- **blog-hero** - Blog post hero image
- **blog-feature** - Blog featured image
- **story-card** - Instagram story card
- **carousel-series** - Multi-slide carousel

## Configured Clients

- **brave-life** - Brave Life ministry brand
- **taskaroo** - Taskaroo software brand
- **mx-detail** - MX Detail detailing brand
- **endless-winning** - Endless Winning agency brand

## Usage

### Generate Single Image

```bash
cd /Users/troybrave/.claude/skills/social-image-generator

# Basic quote image
node cli.js generate \
  --client brave-life \
  --template quote-gradient \
  --content "Faith grows stronger with praise" \
  --reference "Romans 4:20" \
  --platform instagram-feed

# Event promo
node cli.js generate \
  --client brave-life \
  --template event-standard \
  --content '{"title": "Sunday Service", "date": "March 15, 2025", "time": "10:00 AM EST", "location": "Main Auditorium"}' \
  --platform facebook-post

# With custom gradient
node cli.js generate \
  --client brave-life \
  --template quote-gradient \
  --content "Take bold action" \
  --gradient energy-gradient \
  --platform instagram-story
```

### Batch Generation

```bash
cd /Users/troybrave/.claude/skills/social-image-generator

# Create input JSON file first (quotes.json)
# Then run batch
node cli.js batch \
  --client brave-life \
  --input quotes.json
```

### Client Management

```bash
cd /Users/troybrave/.claude/skills/social-image-generator

# Onboard new client
node cli.js onboard --client new-client-name

# Validate brand configuration
node cli.js validate --client brave-life

# List available templates for client
node cli.js list-templates --client brave-life
```

## Expected Input Formats

### Quote Content

For quote templates, provide:
```json
{
  "main": "The quote text goes here",
  "reference": "Optional source or reference"
}
```

### Event Content

For event templates, provide:
```json
{
  "title": "Event Title",
  "date": "March 15, 2025",
  "time": "7:00 PM EST",
  "location": "Venue Name",
  "description": "Optional description"
}
```

### Announcement Content

For announcement templates, provide:
```json
{
  "title": "Announcement Title",
  "body": "Main announcement text",
  "cta": "Optional call to action"
}
```

### Batch Input

For batch generation, create a JSON array:
```json
[
  {
    "template": "quote-gradient",
    "platform": "instagram-feed",
    "content": {
      "main": "Quote text",
      "reference": "Source"
    },
    "overrides": {
      "gradient": "spiritual-gradient",
      "logoPlacement": "bottom-center"
    }
  }
]
```

## Platforms

Available platform targets:
- `instagram-feed` - 1080x1080px square
- `instagram-story` - 1080x1920px vertical
- `instagram-carousel` - 1080x1080px (multi-slide)
- `facebook-post` - 1200x630px landscape
- `facebook-story` - 1080x1920px vertical
- `twitter-post` - 1200x675px landscape
- `linkedin-post` - 1200x627px landscape

## Output Location

Generated images are saved to:
```
/Users/troybrave/Documents/Projects/Full Vault/Assets/Social Images/[client-id]/[timestamp]/
```

Each generation includes:
- Image file (JPG or PNG)
- Metadata JSON file with generation details

## Validation

Before generating images, the skill validates:
- Brand configuration schema compliance
- WCAG color contrast ratios (4.5:1 minimum)
- Asset file existence (logos, images)
- Platform compatibility
- Template requirements
- Content structure

## Error Handling

The skill provides clear, actionable error messages:
- Missing or invalid brand configurations
- Insufficient color contrast with suggestions
- Missing asset files with paths
- Template incompatibilities with alternatives
- File size violations with optimization tips

## Best Practices

When using this skill:

1. **Always validate first** - Run `validate` before generating images
2. **Test single before batch** - Generate one image to verify settings
3. **Check output** - Review generated images for quality and accuracy
4. **Use absolute paths** - Brand configs should use absolute paths for assets
5. **Monitor batch progress** - Watch console output during batch generation
6. **Review batch reports** - Check batch-report.json for failures

## Workflow Example

```
User: "Generate 5 quote images for Brave Life's Instagram feed from the Romans 4 sermon"

Claude Code:
1. Create quotes.json with 5 quotes from Romans 4 sermon
2. Validate brave-life brand config
3. Run batch generation
4. Review output and report results to user
5. Provide paths to generated images
```

## Notes

- All images meet WCAG accessibility standards
- Templates automatically adapt to brand guidelines
- Logo placement respects brand-defined safe zones
- Font fallbacks ensure reliable rendering
- Batch processing continues on partial failures
- Complete metadata tracked for audit trail

## Dependencies

Requires:
- Node.js 18+
- Playwright (for rendering)
- Brand configuration files in `brands/` directory
- Logo assets at paths specified in brand configs

## Troubleshooting

If generation fails:
1. Check brand config: `node cli.js validate --client [client-id]`
2. Verify logo paths exist
3. Ensure template exists: `node cli.js list-templates`
4. Check platform compatibility
5. Review error message for specific guidance

---

**Skill Location:** `/Users/troybrave/.claude/skills/social-image-generator/`

**CLI Entry Point:** `cli.js`

**Status:** Production-ready
