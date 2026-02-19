---
name: image-prompt
description: Creates optimized image generation prompts. Use when user says "create an image prompt", "generate art of", "make a Sora prompt", "Midjourney prompt for", "DALL-E prompt". NOT for text prompts or copywriting.
allowed-tools: Read, Write, Edit
---

# Image Prompt Engineer

Creates precisely crafted prompts for AI image generators (Sora, Midjourney, DALL-E, Stable Diffusion) that produce exactly the visual output the user envisions.

---

## Before Starting

Read `/Users/troybrave/.claude/skills/image-prompt/skill-log.md` to learn from past sessions.

---

## Workflow

### Step 1: Gather Requirements

Ask the user for (if not already provided):

1. **Target platform** - Sora, Midjourney, DALL-E, Stable Diffusion?
2. **Subject** - What's the main focus of the image?
3. **Style** - Photorealistic, illustration, anime, oil painting, etc.?
4. **Mood/atmosphere** - Dramatic, peaceful, energetic, mysterious?
5. **What to avoid** - Elements that should NOT appear

### Step 2: Identify Platform and Apply Syntax

#### Sora (OpenAI Video/Image)

```
STRUCTURE:
- Natural language, descriptive paragraphs
- Focus on scene description, camera movement, temporal flow
- Describe lighting, time of day, atmosphere
- Include motion/action descriptions for video

SYNTAX:
- No special parameters or weights
- Describe in order: subject → action → setting → style → mood
- Be cinematic: "camera slowly pans", "golden hour lighting"

EXAMPLE:
"A golden retriever running through a sunlit wheat field at sunset.
The camera follows from a low angle as the dog bounds joyfully through
the tall grass. Warm golden hour lighting creates lens flares.
Photorealistic, cinematic depth of field, 4K quality."
```

#### Midjourney

```
STRUCTURE:
- Comma-separated descriptors
- Most important elements first
- Parameters at end with --

SYNTAX:
- Subject, style, lighting, mood, details
- --ar [ratio] (aspect ratio: 16:9, 1:1, 9:16, etc.)
- --v [version] (v6.1 is current)
- --s [0-1000] (stylize: lower=literal, higher=artistic)
- --c [0-100] (chaos: variation between outputs)
- --q [.25, .5, 1, 2] (quality/detail level)
- --no [element] (negative prompt)
- ::N (weight: element::2 = double weight)

EXAMPLE:
"majestic lion portrait, hyperrealistic photography, dramatic rim lighting,
dark moody background, intricate fur detail, piercing golden eyes::1.5,
National Geographic style --ar 3:4 --v 6.1 --s 250 --q 2"
```

#### DALL-E 3 (OpenAI)

```
STRUCTURE:
- Natural language, clear descriptions
- Specific details over abstract concepts
- Style references work well

SYNTAX:
- No special parameters (handled in API/UI)
- Be explicit about style: "in the style of", "photorealistic", "digital art"
- Describe composition: "close-up", "wide shot", "centered"
- Include lighting: "soft lighting", "dramatic shadows"

EXAMPLE:
"A close-up portrait of an elderly fisherman with weathered skin and
kind eyes, wearing a faded blue cap. Soft morning light illuminates
his face against a blurred harbor background. Photorealistic,
shot on medium format camera, shallow depth of field."
```

#### Stable Diffusion / Flux

```
STRUCTURE:
- Positive prompt: what you want
- Negative prompt: what to avoid
- Weighted tokens with (parentheses) or [brackets]

SYNTAX:
- (element:1.5) = increase weight 50%
- [element] = decrease weight
- Separate concepts with commas
- Quality boosters: "masterpiece, best quality, highly detailed"
- Negative prompt examples: "blurry, low quality, deformed, text, watermark"

EXAMPLE:
Positive: "portrait of a cyberpunk woman, neon city background,
(detailed face:1.3), intricate jewelry, (volumetric lighting:1.2),
cinematic, masterpiece, best quality, 8k uhd"

Negative: "blurry, low quality, deformed hands, extra fingers,
text, watermark, signature, bad anatomy"
```

### Step 3: Build the Core Prompt

Layer these elements in order of importance:

1. **Subject** - The main focus (most important, goes first)
2. **Action/Pose** - What the subject is doing
3. **Setting/Environment** - Where this takes place
4. **Style** - Artistic style, medium, technique
5. **Lighting** - Light quality, direction, color
6. **Mood/Atmosphere** - Emotional tone
7. **Technical** - Camera, lens, quality descriptors
8. **Negative elements** - What to exclude (platform-specific)

### Step 4: Apply Style Enhancements

#### Photography Styles
- "shot on [camera]" - Sony A7III, Hasselblad, Canon 5D
- "35mm film", "medium format", "Polaroid"
- "[photographer] style" - Annie Leibovitz, Steve McCurry

#### Art Styles
- "oil painting", "watercolor", "digital art"
- "[artist] style" - Greg Rutkowski, Alphonse Mucha, Studio Ghibli
- "concept art", "matte painting", "illustration"

#### Lighting Terms
- Golden hour, blue hour, overcast
- Rim lighting, Rembrandt lighting, butterfly lighting
- Volumetric rays, god rays, lens flare
- Dramatic shadows, soft diffused light

#### Quality Boosters
- "highly detailed", "intricate", "8k", "ultra HD"
- "masterpiece", "award-winning", "professional"
- "sharp focus", "crisp details"

### Step 5: Explain the Prompt Structure

Teach the user by explaining:

1. **Why elements are ordered this way** - importance hierarchy
2. **Platform-specific choices** - weights, parameters, syntax
3. **What could be adjusted** - for different variations

Format as:

```markdown
## Prompt Breakdown

| Element | Purpose | Adjustable? |
|---------|---------|-------------|
| [element] | [why included] | [how to vary] |
```

### Step 6: Deliver with Variations

Present the optimized prompt in a code block.

Then offer:
- "Want a variation with different style/mood?"
- "Should I create versions for other platforms?"
- "Any elements to emphasize or remove?"

---

## Quality Checklist

Before delivering:

- [ ] Subject is clearly described and prominent
- [ ] Style is explicitly stated (not assumed)
- [ ] Platform-specific syntax is correct
- [ ] Lighting/mood contributes to vision
- [ ] Negative prompts address common issues (if applicable)
- [ ] Technical terms match platform capabilities
- [ ] No conflicting descriptors (e.g., "dark" + "bright")
- [ ] Prompt is appropriately detailed (not too sparse or overloaded)

---

## Error Handling

| Error | Response |
|-------|----------|
| User doesn't specify platform | Ask which platform, or default to Midjourney (most common) |
| Vague subject description | Ask for specifics: age, expression, pose, details |
| Conflicting style requests | Point out conflict, ask user to prioritize |
| Request for copyrighted character | Suggest describing the character's attributes instead |
| User wants text in image | Warn that AI struggles with text, suggest post-processing |

---

## Platform Quick Reference

| Platform | Strength | Weakness | Best For |
|----------|----------|----------|----------|
| **Sora** | Motion, video, cinematic | New, limited access | Video clips, animations |
| **Midjourney** | Artistic quality, aesthetics | Less photorealistic | Art, illustration, creative |
| **DALL-E 3** | Text following, composition | Less stylized | Product shots, specific layouts |
| **Stable Diffusion** | Customization, control | Requires tuning | Technical control, specific styles |

---

## Skill Log Integration

After delivering a prompt:

1. Ask: "How did the generated image turn out? Any adjustments needed?"
2. If feedback given, update `/Users/troybrave/.claude/skills/image-prompt/skill-log.md` with:
   - What worked well for this platform
   - Adjustments that improved results
   - Terms/styles the user prefers
