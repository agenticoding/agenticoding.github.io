# Presentation Generation System

This system generates AI-powered presentation slides from lesson content for classroom teaching.

## Overview

The presentation generation system follows the same pattern as the podcast generation:

1. **Parse** lesson MDX content and extract clean text
2. **Generate** condensed presentation slides using Claude Code CLI (Haiku 4.5)
3. **Output** structured JSON with slides, speaker notes, and metadata
4. **Deploy** presentations alongside the Docusaurus site

## Architecture

```
MDX Lesson → AI Processing → JSON Presentation → Reveal.js → Classroom Display
```

### Components

- **generate-presentation.js** - AI-powered script generator
- **RevealSlideshow.tsx** - Reveal.js wrapper component
- **PresentationToggle.tsx** - Toggle button for docs pages
- **DocItem/Layout** - Swizzled Docusaurus component that injects the toggle

## Usage

### Generate Presentations

```bash
# Interactive mode (select file)
node scripts/generate-presentation.js

# Generate for specific file
node scripts/generate-presentation.js --file intro.md

# Generate for all files in a module
node scripts/generate-presentation.js --module understanding-the-tools

# Generate for all lessons
node scripts/generate-presentation.js --all

# Debug mode (saves AI prompt for inspection)
node scripts/generate-presentation.js --file intro.md --debug
```

### View Presentations

1. **In Development**: Navigate to any lesson page and click the "Present" button (🎭)
2. **Keyboard Shortcut**: Press `P` on any lesson page to toggle presentation mode
3. **Exit**: Press `ESC` or click the close button (✕)

### Speaker Notes

Press `S` while in presentation mode to open the speaker notes view, which shows:

- Talking points for current slide
- Timing guidance
- Discussion prompts
- Real-world context
- Transition notes for next slide

## Slide Types

The AI generates different slide types based on content:

### 1. Title Slide
- Lesson title and subtitle
- Learning objectives
- Estimated duration

### 2. Concept Slide
- Key idea with 3-5 bullet points
- Progressive reveal (fragment animation)
- Used for main teaching points

### 3. Code Example Slide
- Syntax-highlighted code block
- Caption explaining purpose
- Up to 15 lines for readability

### 4. Comparison Slide
- Side-by-side ineffective vs effective patterns
- Color-coded (red for bad, green for good)
- Shows contrast between approaches

### 5. Visual Slide
- Custom React components (CapabilityMatrix, UShapeAttentionCurve, etc.)
- Interactive visualizations
- Caption explaining the visual

### 6. Key Takeaway Slide
- Summary of section or lesson
- 3-5 main points
- Reinforces learning objectives

## Customization

### Disable Presentation for a Lesson

Add to frontmatter:

```yaml
---
title: "Lesson Title"
presentation: false  # Hides presentation button
---
```

### Reveal.js Configuration

Edit `RevealSlideshow.tsx` to customize:

```typescript
const deck = new Reveal(deckRef.current, {
  width: 1280,         // Presentation width
  height: 720,         // Presentation height
  transition: 'slide', // Transition effect
  slideNumber: 'c/t',  // Current/total slide numbers
  // ... more options
});
```

## AI Prompt Design

The presentation prompt focuses on:

1. **Condensation**: 8-15 slides per lesson (vs 50+ paragraphs in docs)
2. **Visual Focus**: Bullet points, not paragraphs
3. **Speaker Notes**: Detailed talking points for instructor
4. **Code Selection**: Only most illustrative examples
5. **Logical Flow**: Clear transitions between concepts

### Prompt Structure

```
TASK: Convert technical course material into presentation format

TARGET AUDIENCE: Senior software engineers (3+ years)

PRESENTATION STRUCTURE:
✓ Create 8-15 slides total
✓ Each slide covers ONE key concept
✓ Use bullet points (3-5 per slide)
✓ Include speaker notes with timing, discussion prompts
✓ Preserve important code examples
✓ Identify visual components to use

OUTPUT FORMAT: Valid JSON with metadata and slides array
```

## Output Structure

### Manifest File

Located at:
- `scripts/output/presentations/manifest.json` (build-time)
- `website/static/presentations/manifest.json` (deployed)

```json
{
  "intro.md": {
    "presentationUrl": "/presentations/intro.json",
    "slideCount": 12,
    "estimatedDuration": "30-45 minutes",
    "title": "AI Coding for Senior Engineers",
    "generatedAt": "2025-01-09T12:00:00.000Z"
  }
}
```

### Presentation File

Example: `website/static/presentations/intro.json`

```json
{
  "metadata": {
    "title": "AI Coding for Senior Engineers",
    "lessonId": "intro",
    "estimatedDuration": "30-45 minutes",
    "learningObjectives": [
      "Understand the operator mindset for AI coding",
      "Identify when to use agents vs write code manually",
      "Apply Plan-Execute-Validate methodology"
    ]
  },
  "slides": [
    {
      "type": "title",
      "title": "AI Coding for Senior Engineers",
      "subtitle": "Master AI-assisted software engineering",
      "content": [],
      "speakerNotes": {
        "talkingPoints": "Welcome students...",
        "timing": "2 minutes",
        "discussion": "Ask about their experience...",
        "context": "This course was built using the same techniques...",
        "transition": "Let's start by understanding the problem..."
      }
    },
    {
      "type": "concept",
      "title": "The Operating Model Problem",
      "content": [
        "AI coding assistants are production-standard in 2025",
        "Most developers hit frustration wall within weeks",
        "Wrong mental model: treating AI as junior developer",
        "Correct model: AI agents are CNC machines for code"
      ],
      "speakerNotes": { ... }
    }
  ]
}
```

## Keyboard Shortcuts

- **P** - Toggle presentation mode
- **Arrow Keys** - Navigate slides (Reveal.js)
- **S** - Open speaker notes view
- **ESC** - Exit presentation mode
- **F** - Fullscreen (browser)
- **O** - Overview mode (see all slides)

## Best Practices

### For Content Authors

1. Write detailed lesson content - AI will condense it
2. Use clear headings (H2) to structure sections
3. Include code examples with context
4. Add admonitions (:::tip, :::warning) for important points
5. Use visual components where appropriate

### For Instructors

1. Review speaker notes before class
2. Practice timing on key concepts
3. Use discussion prompts to engage students
4. Reference real-world examples from speaker notes
5. Adjust pace based on student questions

### For Maintenance

1. Regenerate presentations after lesson updates
2. Test presentation display on classroom projector
3. Verify code examples are readable from distance
4. Check that visual components render correctly
5. Review speaker notes for accuracy

## Troubleshooting

### Presentation button doesn't appear

1. Check manifest exists: `website/static/presentations/manifest.json`
2. Verify lesson path matches manifest key
3. Ensure `presentation: false` is not in frontmatter
4. Check browser console for errors

### Slides don't render correctly

1. Verify JSON structure is valid
2. Check that visual component names match imports
3. Test with simpler slide type first
4. Review Reveal.js console errors

### Speaker notes missing

1. Ensure speakerNotes field exists in JSON
2. Check that all required fields are present
3. Press `S` to toggle speaker view
4. Verify browser allows popups (for separate speaker window)

### Code examples too long

1. Edit JSON to shorten code
2. Regenerate with updated lesson content
3. Split into multiple code slides
4. Use caption to reference full code in docs

## Development

### Adding New Slide Types

1. Add type to TypeScript interface in `RevealSlideshow.tsx`
2. Implement render case in `renderSlide()` function
3. Add CSS styling in `RevealSlideshow.module.css`
4. Update AI prompt to generate new type
5. Test with sample lesson

### Modifying AI Prompt

Edit `buildPresentationPrompt()` in `generate-presentation.js`:

```javascript
function buildPresentationPrompt(content, fileName, outputPath) {
  return `You are a presentation script writer...

TASK: Convert technical course material...

PRESENTATION STRUCTURE REQUIREMENTS:
✓ DO: Create 8-15 slides total
✓ DO: Each slide should cover ONE key concept
// ... add your requirements

OUTPUT FORMAT: Valid JSON...`;
}
```

## Performance

- **Generation Time**: 30-60 seconds per lesson (depends on length)
- **Bundle Size**: Reveal.js adds ~60KB gzipped
- **Slide Load Time**: <100ms for typical presentation
- **Speaker Notes**: Minimal performance impact

## Future Enhancements

Potential improvements:

- [ ] PDF export for offline use
- [ ] Custom themes per module
- [ ] Animation library for visual elements
- [ ] Live polling/quizzes embedded in slides
- [ ] Screen recording mode
- [ ] Accessibility improvements (ARIA labels, high contrast)
- [ ] Mobile presenter remote control
- [ ] Auto-advance with timings
- [ ] Slide annotations/drawing tools
