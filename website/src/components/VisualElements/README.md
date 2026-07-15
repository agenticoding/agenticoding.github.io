# Visual Elements

This directory contains interactive visual components used throughout the AI Coding Course documentation.

## Table of Contents

- [Component Catalog](#component-catalog)
- [Creating New Components](#creating-new-components)
- [Color System](#color-system)
- [Testing](#testing)

---

## Component Catalog

| Component                       | Purpose                                |
| ------------------------------- | -------------------------------------- |
| **UShapeAttentionCurve**        | Context window attention visualization |
| **WorkflowCircle**              | 4-phase iterative workflow diagram     |
| **GroundingComparison**         | Grounding strategies side-by-side      |
| **ContextWindowMeter**          | Interactive token usage meter          |
| **AbstractShapesVisualization** | Clean vs cluttered context demo        |
| **PlanningStrategyComparison**  | Exploration vs exact planning          |
| **FailureStickinessChain**      | Failure propagation and checkpointing  |

---

## Creating New Components

Components default export without special presentation overhead.

### Use CSS Variables for Colors

```css
/* ❌ BAD - Hardcoded colors won't adapt to light/dark mode */
.element {
  color: #007576;
  background: rgba(0, 117, 118, 0.1);
}

/* ✅ GOOD - CSS variables adapt automatically */
.element {
  color: var(--visual-cyan);
  background: var(--visual-bg-cyan);
}
```

---

## Color System

### Available CSS Variables

All visual components must use CSS variables from `/website/src/css/custom.css`:

#### Semantic Colors

```css
--visual-cyan       /* Cyan - AI workflows/agents */
--visual-success     /* Cyan - capabilities/success */
--visual-warning     /* Orange - limitations/warnings */
--visual-indigo       /* Light cyan - decision points */
--visual-error          /* Rose - errors/critical */
--visual-neutral        /* Slate - neutral states */
```

#### Transparent Backgrounds

```css
--visual-bg-cyan    /* rgba(167, 139, 250, 0.15) */
--visual-bg-success  /* rgba(34, 211, 238, 0.15) */
--visual-bg-warning  /* rgba(251, 146, 60, 0.15) */
--visual-bg-indigo    /* rgba(196, 181, 253, 0.15) */
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
  --visual-cyan: #007576; /* Cyan-600 */
}

/* Dark mode */
[data-theme='dark'] {
  --visual-cyan: #00b2b2; /* Brighter cyan */
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
box-shadow: 0 2px 8px color-mix(in srgb, var(--visual-cyan) 30%, transparent);
```

---

## Testing

### Manual Testing Checklist

For each new component, verify:

- [ ] **Documentation page**: Renders correctly in light mode
- [ ] **Documentation page**: Renders correctly in dark mode
- [ ] **Documentation page**: Responsive on mobile (320px to 1920px)

### Testing in Dev Server

```bash
cd website && npm start
```

Navigate to chapter pages and toggle light/dark mode.

### Visual Regression Testing

Currently **manual** (screenshots). Future: Storybook + Chromatic.
