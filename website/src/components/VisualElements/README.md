# Visual Elements - Presentation-Aware Component System

This directory contains interactive visual components used throughout the AI Coding Course documentation and presentations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Component Catalog](#component-catalog)
- [Creating New Components](#creating-new-components)
- [Compact Mode Requirements](#compact-mode-requirements)
- [Color System](#color-system)
- [Testing](#testing)

---

## Overview

### The Problem

Visual components need to work in two distinct environments:

1. **Documentation Pages**: Scrollable, responsive, light/dark mode switching
2. **Presentation Slides**: Fixed 1280x720 viewport, always dark mode, non-scrollable

Without a unified system, each component required scattered CSS fixes to prevent layout breaks in presentations (overflow, sizing, spacing, dark mode colors).

### The Solution

A centralized presentation-aware component system with:

- **Type contract**: `PresentationAwareProps` interface for all visual components
- **Compact mode**: Explicit `compact` prop to optimize for presentation viewport
- **Unified CSS**: Centralized presentation overrides in `/website/src/styles/presentation-system.css`
- **Color system**: All colors via CSS variables for automatic light/dark mode adaptation

---

## Architecture

### File Structure

```
website/src/
├── components/
│   ├── PresentationMode/
│   │   ├── types.ts                    # PresentationAwareProps interface
│   │   ├── PresentationSlideContent.tsx # Reusable layout wrapper
│   │   └── RevealSlideshow.tsx         # Passes compact={true} to all visuals
│   └── VisualElements/
│       ├── README.md                    # This file
│       ├── CapabilityMatrix.tsx         # Example component
│       ├── CapabilityMatrix.module.css  # With .compact mode
│       └── ... (7 components total)
└── styles/
    └── presentation-system.css          # Centralized Reveal.js overrides
```

### Data Flow

```
RevealSlideshow.tsx
  └─> <VisualComponent compact={true} />
        └─> containerClassName = compact ? `${styles.container} ${styles.compact}` : styles.container
              └─> CSS: .container.compact { margin: 0; padding: 0.5rem; max-width: 95%; }
```

### Type System

All visual components implement `PresentationAwareProps`:

```typescript
import type { PresentationAwareProps } from '../PresentationMode/types';

export default function MyComponent({ compact = false }: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  return <div className={containerClassName}>...</div>;
}
```

---

## Component Catalog

| Component | Purpose | Compact Mode | Used In |
|-----------|---------|--------------|---------|
| **CapabilityMatrix** | Trust levels for AI capabilities | ✅ | Lesson 1 docs, Lesson 2 presentation |
| **UShapeAttentionCurve** | Context window attention visualization | ✅ | Lesson 3 docs & presentation |
| **WorkflowCircle** | 4-phase iterative workflow diagram | ✅ | Lesson 2 docs & presentation |
| **GroundingComparison** | Grounding strategies side-by-side | ✅ | Lesson 4 presentation |
| **ContextWindowMeter** | Interactive token usage meter | ✅ | Lesson 3 docs & presentation |
| **AbstractShapesVisualization** | Clean vs cluttered context demo | ✅ | Lesson 5 presentation |
| **PlanningStrategyComparison** | Exploration vs exact planning | ✅ | Lesson 6 presentation |

All components support both documentation and presentation modes.

---

## Creating New Components

### Step 1: Implement PresentationAwareProps

```typescript
// MyNewComponent.tsx
import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './MyNewComponent.module.css';

export default function MyNewComponent({ compact = false }: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  return (
    <div className={containerClassName}>
      {/* Your component JSX */}
    </div>
  );
}
```

### Step 2: Add Compact Mode CSS

```css
/* MyNewComponent.module.css */
.container {
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 8px;
  background: var(--visual-bg-workflow);
  border: 1px solid var(--visual-workflow);
}

/* Compact mode for presentations - maximize content area */
.container.compact {
  margin: 0 auto;
  padding: 0.5rem;
  max-width: 95%;
}
```

### Step 3: Use CSS Variables for Colors

```css
/* ❌ BAD - Hardcoded colors won't adapt to light/dark mode */
.element {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}

/* ✅ GOOD - CSS variables adapt automatically */
.element {
  color: var(--visual-workflow);
  background: var(--visual-bg-workflow);
}
```

### Step 4: Register in RevealSlideshow

```typescript
// RevealSlideshow.tsx
import MyNewComponent from '../VisualElements/MyNewComponent';

const VISUAL_COMPONENTS = {
  CapabilityMatrix,
  UShapeAttentionCurve,
  WorkflowCircle,
  MyNewComponent, // Add your component here
  // ...
};
```

### Step 5: Use in Presentation Data

```typescript
{
  type: 'visual',
  title: 'My New Visualization',
  component: 'MyNewComponent',
  caption: 'This demonstrates...',
}
```

---

## Compact Mode Requirements

### Layout Constraints

Presentation slides have a **fixed 1280x720 viewport**. Components must:

1. **Remove vertical margins**: `margin: 0 auto` (only horizontal centering)
2. **Minimize padding**: `padding: 0.5rem` (or less for large visuals)
3. **Maximize width**: `max-width: 95%` (use full slide width)
4. **Remove max-height**: Allow flexbox to control height naturally

### Pattern Comparison

| Aspect | Documentation Mode | Compact Mode |
|--------|-------------------|--------------|
| **Margin** | `2rem 0` | `0 auto` |
| **Padding** | `1.5rem` | `0.5rem` |
| **Max-width** | `600px` | `95%` |
| **Max-height** | Not set | `none` |

### Visual Sizing

Some components need **additional scaling** in presentations:

```css
/* For diagrams that are too small at 1:1 scale */
.container.compact {
  margin: 0 auto;
  padding: 0;
  max-width: 1000px; /* Larger than default 95% */
}
```

Example: **WorkflowCircle** uses `max-width: 1000px` instead of `95%` because the SVG diagram needs more space to be readable from classroom distance.

---

## Color System

### Available CSS Variables

All visual components must use CSS variables from `/website/src/css/custom.css`:

#### Semantic Colors

```css
--visual-workflow       /* Purple - AI workflows/agents */
--visual-capability     /* Cyan - capabilities/success */
--visual-limitation     /* Orange - limitations/warnings */
--visual-decision       /* Light purple - decision points */
--visual-error          /* Rose - errors/critical */
--visual-neutral        /* Slate - neutral states */
```

#### Transparent Backgrounds

```css
--visual-bg-workflow    /* rgba(167, 139, 250, 0.15) */
--visual-bg-capability  /* rgba(34, 211, 238, 0.15) */
--visual-bg-limitation  /* rgba(251, 146, 60, 0.15) */
--visual-bg-decision    /* rgba(196, 181, 253, 0.15) */
--visual-bg-error       /* rgba(251, 113, 133, 0.15) */
```

#### Docusaurus/Infima Variables

```css
--ifm-font-color-base            /* Primary text color */
--ifm-heading-color              /* Heading text color */
--ifm-color-emphasis-700         /* Dark text (secondary) */
--ifm-color-emphasis-600         /* Medium text (tertiary) */
--ifm-color-emphasis-300         /* Light borders */
--ifm-color-emphasis-200         /* Lighter borders */
--ifm-background-color           /* Page background */
--ifm-background-surface-color   /* Card/elevated surface background */
```

### Dark Mode Adaptation

**All CSS variables automatically adapt** to light/dark mode:

```css
/* Light mode */
:root {
  --visual-workflow: #7c3aed;  /* Medium purple */
}

/* Dark mode */
[data-theme='dark'] {
  --visual-workflow: #a78bfa;  /* Brighter purple */
}

/* Presentations (always dark) */
:global(.reveal) {
  --visual-workflow: #a78bfa;  /* Same as dark mode */
}
```

Components don't need mode-specific CSS - the variables handle it.

### Hardcoded Colors: When They're Acceptable

**Avoid hardcoded colors**, but exceptions exist:

✅ **Acceptable**:
- **Shadows**: `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)` (black is universally neutral)
- **Gradients**: SVG gradients with `stopColor` attributes (when using CSS variables in SVG is unsupported)

❌ **Not Acceptable**:
- Text colors
- Background colors
- Border colors
- Fill colors (unless in SVG gradients)

**Better approach for shadows** (when supported):

```css
/* Use color-mix() to derive shadow from theme color */
box-shadow: 0 2px 8px color-mix(in srgb, var(--brand-primary) 30%, transparent);
```

---

## Testing

### Manual Testing Checklist

For each new component, verify:

- [ ] **Documentation page**: Renders correctly in light mode
- [ ] **Documentation page**: Renders correctly in dark mode
- [ ] **Documentation page**: Responsive on mobile (320px to 1920px)
- [ ] **Presentation slide**: No overflow beyond 1280x720
- [ ] **Presentation slide**: Colors readable on dark background
- [ ] **Presentation slide**: Content fills available space (not too small)
- [ ] **Presentation slide**: Description/controls hidden if not needed

### Testing in Dev Server

```bash
cd website && npm start
```

1. **Documentation**: Navigate to lesson pages and toggle light/dark mode
2. **Presentation**: Click "Present" button on lesson pages

### Visual Regression Testing

Currently **manual** (screenshots). Future: Storybook + Chromatic.

---

## Best Practices

### DO ✅

- Use `PresentationAwareProps` for all visual components
- Define `.container.compact` in CSS modules
- Use CSS variables exclusively for colors
- Test in both documentation and presentation modes
- Hide non-essential UI elements in compact mode (descriptions, controls)
- Use `max-width: 95%` for standard components
- Document component purpose in this README

### DON'T ❌

- Hardcode colors (except shadows/gradients)
- Use fixed `max-width` in pixels (use `95%` or `1000px` for large diagrams)
- Ignore responsive design (components are used in docs too)
- Create mode-specific CSS (use CSS variables for light/dark adaptation)
- Forget to register component in `RevealSlideshow.tsx`

---

## Troubleshooting

### Component Overflows Slide in Presentation

**Symptom**: Content extends beyond 1280x720, requires scrolling

**Fix**:
1. Check `.container.compact` removes vertical margins: `margin: 0 auto`
2. Reduce padding: `padding: 0.5rem` or less
3. Increase max-width: `max-width: 95%`
4. Verify parent slide doesn't have extra padding

### Colors Look Wrong in Presentation

**Symptom**: Text/backgrounds invisible or low contrast on dark background

**Fix**:
1. Replace hardcoded colors with CSS variables
2. Verify variables are defined in `/website/src/styles/presentation-system.css`
3. Check `:global(.reveal)` overrides in `presentation-system.css`

### Component Too Small in Presentation

**Symptom**: Visual is legible on laptop but unreadable from classroom distance

**Fix**:
1. Increase `max-width` in `.container.compact` (e.g., `1000px` instead of `95%`)
2. Consider using `transform: scale(1.5)` for SVGs (see WorkflowCircle example)
3. Simplify UI - remove non-essential elements in compact mode

### TypeScript Error: "compact does not exist"

**Symptom**: `Property 'compact' does not exist on type 'IntrinsicAttributes'`

**Fix**:
1. Ensure component props extend `PresentationAwareProps`
2. Import: `import type { PresentationAwareProps } from '../PresentationMode/types'`
3. Function signature: `export default function MyComponent({ compact = false }: PresentationAwareProps = {})`

---

## Future Improvements

### Planned

- [ ] **Storybook integration**: Visual regression testing for all components
- [ ] **Automated compact mode tests**: Cypress E2E tests for slide layout
- [ ] **Theme variables**: Extend presentation-system.css with component-specific variables
- [ ] **Performance monitoring**: Track animation performance in presentations
- [ ] **Accessibility audit**: WCAG compliance for all visual components

### Under Consideration

- [ ] **Auto-detect presentation mode**: Components detect `.reveal` ancestor (avoid explicit `compact` prop)
- [ ] **Presentation context**: React Context API for global presentation state
- [ ] **Layout presets**: Pre-configured PresentationSlideContent presets (centered, scaled, fullscreen)

---

## Related Documentation

- **Type Definitions**: `/website/src/components/PresentationMode/types.ts`
- **Presentation System CSS**: `/website/src/styles/presentation-system.css`
- **Color System**: `/website/src/css/custom.css`
- **Reveal.js Integration**: `/website/src/components/PresentationMode/RevealSlideshow.tsx`
- **Course Content**: `/website/docs/` (MDX files)

---

## Questions?

For architecture questions or bugs, check:
1. This README
2. Type definitions in `PresentationMode/types.ts`
3. Existing component implementations (e.g., WorkflowCircle.tsx)
4. Git history for this directory (`git log -- website/src/components/VisualElements`)

**Maintainer**: Senior architect (see project CLAUDE.md for mindset)
