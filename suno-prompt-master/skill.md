---
name: suno-prompt-master
description: Expert-level Suno AI music generation prompting. Use when creating style/genre prompts, formatting lyrics, or helping users generate songs with Suno. Triggers on requests involving Suno, AI music generation, song creation prompts, lyric formatting for AI, or music generation optimization.
allowed-tools: Read, Write, Edit, WebSearch
---

# Suno Prompt Master

Transform user song visions into precisely engineered Suno prompts optimized for first-generation success.

## Core Workflow

1. **Extract intent** - Understand desired genre, mood, energy, era, and purpose
2. **Build style prompt** - Layer genre tags + production descriptors + mood cues
3. **Format lyrics** - Apply proper section markers, vocal tags, and spacing
4. **Validate** - Check against known Suno interpretation patterns
5. **Deliver** - Provide style prompt + formatted lyrics + usage guidance

## Style Prompt Construction

Build prompts using this layered approach:

```
[Primary Genre], [Subgenre/Fusion], [Era/Aesthetic], [Production Style], [Mood Descriptors], [Tempo/Energy]
```

**Example**: `Indie folk, bedroom pop, lo-fi acoustic, intimate production, wistful and nostalgic, gentle tempo`

### Genre Stacking Rules

- Lead with the dominant genre (what the song primarily *is*)
- Stack 2-3 complementary subgenres (adjacent styles that blend well)
- Avoid contradictory combinations (don't mix "aggressive metal" with "gentle lullaby")
- Use era markers for sonic texture ("80s synth", "90s grunge", "2010s indie")

For comprehensive genre combinations and recipes, see `references/genre-library.md`.

### Production Descriptors

These shape the *sound* more than the genre:

| Category | Examples |
|----------|----------|
| Texture | lo-fi, crisp, warm, raw, polished, gritty |
| Space | intimate, arena, bedroom, stadium, cathedral reverb |
| Mix | bass-heavy, vocal-forward, layered harmonies, stripped-back |
| Era | vintage analog, modern digital, tape saturation |

Full descriptor reference in `references/production-descriptors.md`.

## Lyric Formatting

### Section Markers

```
[Intro]
[Verse]
[Pre-Chorus]
[Chorus]
[Bridge]
[Outro]
[Instrumental]
[Break]
```

### Vocal Style Tags (inline)

```
[spoken word] Text here
[whispered] Text here
[belted] Text here
[falsetto] Text here
[harmonies] Text here
[ad-lib] Text here
```

### Instrumental Breaks

```
[Instrumental Break]
[Guitar Solo]
[Synth Solo]
[Drum Fill]
```

### Critical Formatting Rules

1. **Blank line between sections** - Required for proper parsing
2. **No empty sections** - Every marker needs content
3. **Consistent capitalization** - Use title case for markers
4. **Parentheses for background vocals** - `(ooh, aah)` or `(hey, hey)`
5. **Asterisks for emphasis** - `*this word* hits harder`

Complete formatting guide with examples in `references/lyric-formatting.md`.

## Anti-Patterns (What NOT To Do)

- Don't name specific artists ("sounds like Taylor Swift")
- Don't reference copyrighted songs
- Don't use overly complex prompts (>50 words for style)
- Don't use contradictory descriptors ("upbeat melancholic aggressive chill")
- Don't use technical jargon Suno doesn't interpret ("sidechained kicks", "parallel compression")
- Don't leave empty section markers without lyrics
- Don't create walls of text without section breaks

## Prompt Templates

### Pop/Commercial

```
Style: Modern pop, radio-ready, polished production, catchy hooks, bright and uplifting, 120 BPM
```

### Emotional Ballad

```
Style: Piano ballad, intimate, raw vocals, minimal production, heartfelt, building dynamics, slow tempo
```

### High Energy

```
Style: EDM, festival anthem, euphoric drops, driving bass, energetic, 128 BPM, hands-in-the-air
```

### Cinematic

```
Style: Orchestral, epic trailer music, dramatic builds, sweeping strings, powerful brass, emotional climax
```

More templates in `references/genre-library.md`.

## Output Format

Always deliver:

1. **Style Prompt** - The genre/production description to paste in Suno's style field
2. **Formatted Lyrics** - Properly sectioned lyrics ready to paste
3. **Generation Tips** - Any version-specific or parameter guidance

```
## Style Prompt
[paste-ready style prompt]

## Lyrics
[paste-ready formatted lyrics]

## Tips
- [relevant guidance for this specific generation]
```

## Refinement Workflow

When first generation isn't perfect:

1. **Identify the gap** - What's missing from desired output?
2. **Adjust genre stack** - Try different genre ordering or swap subgenres
3. **Tune production descriptors** - More specific texture/space/mix terms
4. **Modify lyric pacing** - Adjust syllable density, add [breath] markers
5. **Extend or regenerate** - Use Suno's extend feature for sections that worked

## Version Considerations

Before prompting, verify current Suno capabilities via web search if user mentions:
- New features or recent updates
- Specific version numbers (v3.5, v4, etc.)
- Unfamiliar parameters or settings

Suno evolves frequently - search for latest guidance when uncertain.
