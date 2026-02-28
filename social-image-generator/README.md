# Social Image Generator - Complete Skill Specification

> Production-grade, multi-client social media image generation skill for Claude Code

## Overview

This skill generates professional, on-brand social media images for Instagram, Facebook, Twitter, and LinkedIn. It's designed to work across multiple clients, each with unique branding requirements, while ensuring consistent quality and brand compliance.

## Key Features

- **🎨 Multi-client Support** - Manage unlimited clients, each with complete brand configurations
- **📱 Platform Optimized** - Pre-configured specs for Instagram (feed/story/carousel), Facebook, Twitter, LinkedIn
- **✨ Template Library** - Reusable templates that adapt to any brand (quotes, announcements, events, blog headers)
- **🔍 Multi-layer Validation** - Schema validation, WCAG contrast checking, output validation
- **⚡ Batch Processing** - Generate dozens of images from JSON input
- **🛡️ Error-proof Design** - Graceful failures with actionable error messages
- **📊 Audit Trail** - Complete metadata for every generated image
- **♿ Accessibility** - WCAG AA/AAA contrast validation built-in

## Quick Start

### Generate Single Image

```bash
node cli.js generate \
  --client brave-life \
  --template quote-gradient \
  --content "Faith grows stronger with praise" \
  --reference "Romans 4:20" \
  --platform instagram-feed
```

### Batch Generation

```bash
# Create input file: quotes.json
[
  {
    "template": "quote-gradient",
    "content": {
      "main": "Your quote text here",
      "reference": "Scripture reference"
    }
  }
]

# Generate batch
node cli.js batch --client brave-life --input quotes.json
```

### Onboard New Client

```bash
node cli.js onboard --client new-client-name
# Interactive wizard guides you through brand setup
```

### Validate Brand Config

```bash
node cli.js validate --client brave-life
```

## Architecture

### File Structure

```
/Users/troybrave/.claude/skills/social-image-generator/
├── skill.md                          # Claude Code skill manifest
├── cli.js                            # Main CLI entry point
├── lib/                              # Core library modules
│   ├── generator.js                  # Image generation orchestrator
│   ├── brand-loader.js               # Brand config loader & validator
│   ├── validator.js                  # Multi-layer validation system
│   ├── template-engine.js            # Template rendering system
│   ├── asset-manager.js              # Logo/font/image asset manager
│   ├── contrast-checker.js           # WCAG contrast validator
│   └── utils.js                      # Shared utilities
├── templates/                        # Template library
│   ├── registry.js                   # Template registry
│   ├── quote-gradient.js             # Quote with gradient
│   ├── quote-minimal.js              # Minimalist quote
│   ├── event-standard.js             # Event promo
│   └── ...                           # Additional templates
├── brands/                           # Client brand configurations
│   ├── brave-life.json               # Example: Brave Life config
│   ├── taskaroo.json                 # Example: Taskaroo config
│   └── _template.json                # Template for new clients
└── output/                           # Generated images (gitignored)
    └── [client-id]/
        └── [timestamp]/
            ├── *.jpg|png
            └── metadata.json
```

### Core Components

1. **Brand Configuration Schema** (`brand-schema.json`)
   - Comprehensive JSON schema capturing all branding elements
   - Colors, typography, logos, layout, platform specs, imagery style

2. **Generator** (`lib/generator.js`)
   - Orchestrates the entire generation process
   - Loads brand, renders template, validates output
   - Handles both single and batch generation

3. **Template System** (`templates/*.js`)
   - Standardized template interface
   - Templates adapt to brand parameters automatically
   - Platform-aware rendering

4. **Validation Layer** (`lib/validator.js`)
   - Schema validation (JSON Schema + AJV)
   - Contrast ratio checking (WCAG compliance)
   - Output validation (dimensions, file size)

5. **Asset Manager** (`lib/asset-manager.js`)
   - Loads logos, fonts, textures
   - Encodes assets as base64 for embedding
   - Validates asset paths

## Brand Configuration

Every client has a comprehensive brand configuration file:

### Essential Elements

```json
{
  "client": {
    "id": "brave-life",
    "name": "Brave Life"
  },
  "colors": {
    "primary": { "main": "#2563EB", "usage": "Headlines, CTAs" },
    "background": { "light": "#FFFFFF", "dark": "#1F2937" },
    "text": { "primary": "#111827", "inverse": "#FFFFFF" },
    "gradients": [
      {
        "name": "primary-gradient",
        "css": "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)"
      }
    ]
  },
  "typography": {
    "families": {
      "primary": {
        "name": "Inter",
        "weights": [400, 500, 600, 700, 800],
        "fallback": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }
    },
    "hierarchy": {
      "quote": { "size": 48, "weight": 700, "lineHeight": 1.3 }
    }
  },
  "logos": {
    "primary": {
      "path": "/absolute/path/to/logo.png",
      "minWidth": 120,
      "maxWidth": 300,
      "preferredPlacement": ["bottom-center"]
    }
  },
  "layout": {
    "safeZones": {
      "instagram": {
        "feed": { "top": 80, "bottom": 80, "left": 80, "right": 80 }
      }
    }
  },
  "platforms": {
    "instagram": {
      "feed": {
        "dimensions": { "width": 1080, "height": 1080 },
        "format": "jpg",
        "quality": 92
      }
    }
  }
}
```

See `brand-schema.json` for complete schema documentation.

## Templates

### Available Templates

1. **quote-gradient** - Bold quote on gradient background
2. **quote-minimal** - Clean, minimalist quote design
3. **quote-bold** - High-impact quote with dramatic styling
4. **announcement-bold** - Bold announcement template
5. **event-standard** - Event promo with date/time/location
6. **event-countdown** - Event with countdown timer
7. **blog-hero** - Blog post hero image
8. **story-card** - Instagram story optimized

### Template Structure

Every template exports:

```javascript
module.exports = {
  id: 'quote-gradient',
  name: 'Quote with Gradient Background',
  description: '...',
  category: 'quote',
  platforms: ['instagram-feed', 'instagram-story', 'facebook-post'],
  requiredAssets: ['logo'],
  options: { /* customization options */ },
  render: async (context) => { /* returns HTML */ }
};
```

Templates automatically adapt to:
- Brand colors
- Typography hierarchy
- Logo placement rules
- Platform dimensions
- Safe zones

## Validation

### Three-layer Validation System

1. **Schema Validation** (Pre-generation)
   - Validates brand config against JSON schema
   - Checks required fields, data types, formats
   - Validates hex colors, file paths, URLs

2. **Design Validation** (During generation)
   - WCAG contrast ratio checking
   - Color usage rules (max colors per design)
   - Brand color compliance
   - Logo visibility requirements

3. **Output Validation** (Post-generation)
   - File size limits
   - Dimension verification
   - Format compliance

### Contrast Checking

Built-in WCAG compliance validation:

```javascript
// Check if text/background meets standards
const ratio = contrastChecker.calculate('#2563EB', '#FFFFFF');
// Returns: 8.2 (WCAG AAA compliant)

// Suggest better color if insufficient
const suggestion = contrastChecker.suggestBetterColor(
  '#8B5CF6',  // foreground
  '#FFFFFF',  // background
  4.5         // target ratio
);
```

## Usage Patterns

### Single Image

```bash
# Basic quote
node cli.js generate \
  --client brave-life \
  --template quote-gradient \
  --content "Your quote text" \
  --reference "Source" \
  --platform instagram-feed

# With overrides
node cli.js generate \
  --client brave-life \
  --template quote-gradient \
  --content "Your quote text" \
  --gradient energy-gradient \
  --logo-placement top-center \
  --platform instagram-story
```

### Batch Processing

**Input: quotes.json**
```json
[
  {
    "template": "quote-gradient",
    "platform": "instagram-feed",
    "content": {
      "main": "Quote text here",
      "reference": "Source"
    },
    "overrides": {
      "gradient": "spiritual-gradient",
      "logoPlacement": "bottom-center"
    }
  }
]
```

**Execute:**
```bash
node cli.js batch --client brave-life --input quotes.json
```

**Output:**
```
[1/3] Generating: "Quote text here..."
    ✅ Success

[2/3] Generating: "Second quote..."
    ✅ Success

[3/3] Generating: "Third quote..."
    ✅ Success

✅ Batch complete! Generated 3 images.
📁 Location: output/brave-life/2025-11-24T10-30-00/
```

### List Templates

```bash
# All templates
node cli.js list-templates

# Enabled for specific client
node cli.js list-templates --client brave-life
```

### Client Management

```bash
# Onboard new client (interactive wizard)
node cli.js onboard --client new-client

# Validate configuration
node cli.js validate --client brave-life

# Test generation
node cli.js generate \
  --client new-client \
  --template quote-gradient \
  --content "Test quote" \
  --platform instagram-feed
```

## Error Handling

### Graceful Failures with Actionable Messages

```javascript
// Example: Missing asset
{
  "error": "SocialImageError",
  "type": "ASSET_NOT_FOUND",
  "message": "Required asset not found: logo",
  "details": {
    "assetType": "logo",
    "path": "/path/to/missing/logo.png",
    "suggestion": "Update the brand configuration with the correct asset path"
  }
}

// Example: Insufficient contrast
{
  "error": "SocialImageError",
  "type": "CONTRAST_VIOLATION",
  "message": "Insufficient color contrast: 3.2:1 (minimum 4.5:1 required)",
  "details": {
    "foreground": "#8B5CF6",
    "background": "#FFFFFF",
    "currentRatio": "3.2",
    "requiredRatio": "4.5",
    "suggestion": "Adjust the brand colors to meet WCAG accessibility standards"
  }
}
```

### Common Edge Cases

1. **Missing Assets** - Clear error with path to fix
2. **Insufficient Contrast** - Automatic color suggestions
3. **Template Incompatibility** - Lists supported platforms
4. **File Size Exceeded** - Suggests quality adjustments
5. **Batch Partial Failure** - Continues processing, reports at end
6. **Font Not Available** - Automatic fallback to web-safe fonts
7. **Content Too Long** - Max character validation with clear limits

## Best Practices

### Brand Configuration

- ✅ Use absolute paths for all assets
- ✅ Version control brand configs
- ✅ Run `validate` after any changes
- ✅ Test generate after config updates
- ✅ Keep logo files under 2MB

### Template Development

- ✅ Start from existing template
- ✅ Use brand config values, never hardcode
- ✅ Test on all declared platforms
- ✅ Handle missing optional content gracefully
- ✅ Always escape user-provided text

### Production Deployment

- ✅ Pre-flight validation before batch
- ✅ Monitor console for failures
- ✅ Review batch reports
- ✅ Archive old outputs periodically
- ✅ Keep asset backups

## Dependencies

```json
{
  "dependencies": {
    "playwright": "^1.56.1",
    "commander": "^11.0.0",
    "ajv": "^8.12.0",
    "ajv-formats": "^2.1.1",
    "inquirer": "^9.2.0"
  }
}
```

## Platform Specifications

### Instagram

- **Feed:** 1080x1080px, JPG, 92% quality
- **Story:** 1080x1920px, JPG, 92% quality
- **Carousel:** 1080x1080px, max 10 slides

### Facebook

- **Post:** 1200x630px, JPG, 90% quality
- **Story:** 1080x1920px, JPG, 90% quality

### Twitter

- **Post:** 1200x675px, JPG, 90% quality

### LinkedIn

- **Post:** 1200x627px, JPG, 90% quality

## Installation

```bash
# Install dependencies
npm install

# Test installation
node cli.js --version

# List available clients
node cli.js list-clients

# Validate existing client
node cli.js validate --client brave-life
```

## Development

### Adding New Template

1. Copy existing template: `cp templates/quote-gradient.js templates/my-template.js`
2. Update template metadata and render function
3. Test: `node cli.js generate --client brave-life --template my-template --content "Test"`
4. Add to registry if needed

### Adding New Client

```bash
# Interactive wizard
node cli.js onboard --client new-client

# Or manually create brands/new-client.json
# Use brands/_template.json as starting point
```

### Running Tests

```bash
npm test

# Or specific tests
npm test -- brand-validation
npm test -- template-rendering
npm test -- contrast-checker
```

## Troubleshooting

### Validation Fails

```bash
# Get detailed error information
node cli.js validate --client your-client

# Common issues:
# - Invalid hex colors (must be #RRGGBB format)
# - Missing logo files (check absolute paths)
# - Insufficient contrast (use contrast checker)
```

### Generation Fails

```bash
# Check if template exists
node cli.js list-templates

# Check if platform is supported
node cli.js list-templates --client your-client

# Verify brand config is valid
node cli.js validate --client your-client
```

### Output Quality Issues

Adjust quality settings in brand config:

```json
"platforms": {
  "instagram": {
    "feed": {
      "quality": 95  // Increase for better quality (larger file size)
    }
  }
}
```

## File Locations

After implementation, the skill will be located at:

```
/Users/troybrave/.claude/skills/social-image-generator/
```

Invoke from Claude Code:
```
@social-image-generator generate brave-life quote "Faith grows with praise" --platform instagram-feed
```

## Documentation Files

This specification includes:

1. **README.md** (this file) - Overview and quick start
2. **brand-schema.json** - Complete JSON schema for brand configurations
3. **example-brave-life-config.json** - Real-world example configuration
4. **skill-architecture.md** - Detailed architecture and component design
5. **template-system.md** - Template structure and examples
6. **validation-usage-patterns.md** - Validation system, error handling, usage patterns, edge cases

## Next Steps

To implement this skill:

1. Create directory structure in `/Users/troybrave/.claude/skills/social-image-generator/`
2. Implement core modules (generator, brand-loader, validator, template-engine, asset-manager)
3. Create template library (start with quote-gradient, quote-minimal, event-standard)
4. Add brand configurations for existing clients (brave-life, taskaroo, mx-detail)
5. Create skill.md manifest for Claude Code
6. Test with single image generation
7. Test with batch generation
8. Deploy to production

---

**Status:** ✅ Specification Complete - Ready for Implementation

**Architecture:** Production-grade, scalable, error-proof

**Quality:** Professional output suitable for client-facing use

**Coverage:** All edge cases, error scenarios, and recovery patterns documented
