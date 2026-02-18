---
sidebar_position: 1
sidebar_label: 'Lesson 14: Design Tokens & Visual Primitives'
title: 'Lesson 14: Design Tokens & Visual Primitives'
---

[Lesson 12](/docs/practical-techniques/lesson-12-spec-driven-development) established that specs are scaffolding — temporary thinking tools deleted after implementation. This section applies spec-driven development to user-facing interfaces. We call this **Experience Engineering** — specifying design tokens, component APIs, interaction flows, and accessibility architecture precisely enough for an agent to implement and browser automation to verify. For system-level specs, see [Lesson 13](/docs/practical-techniques/lesson-13-systems-thinking-specs).

The key insight: **the experience layer can be fully built and validated before any backend exists.** Design tokens, component layouts, interaction flows, accessibility constraints — none of these depend on API responses. An agent generates the UI with mocked data (behavior mocks via MSW), browser automation verifies it through the accessibility tree (`snapshot -ic`), and you iterate on the experience until it's right. Backend integration comes later, and by then the interface contract is locked.

This lesson walks through building a production color palette using [Lesson 3](/docs/methodology/lesson-3-high-level-methodology)'s four-phase workflow — **Research → Plan → Execute → Validate** — applied to experience engineering. The running example throughout these lessons: a **team dashboard for a SaaS billing product** — subscription plans, usage metrics, invoices, team management, and settings.

### Why Agents Need You for UI

**The review paradox.** UI code is the hardest to review because correctness is visual and behavioral, not just logical. You can't grep for "the button is in the wrong place" or "the modal doesn't feel right." This makes the spec → build → check loop even more critical for frontend work — the spec defines what "correct" means, browser automation checks it deterministically, and the accessibility tree makes it machine-readable.

**The perceptual limitation.** Multimodal LLMs process screenshots through Vision Transformers that divide images into fixed patches — typically 16×16 pixels each. A 1920×1080 screenshot becomes roughly 1,100 tokens representing over two million pixels — each patch compressed into a single embedding vector. The model sees major structural features clearly: missing sections, wrong layout direction, a red error banner where a green success banner should be. But sub-patch details — a 3px spacing difference, a 1px border, the distinction between `gray-200` and `gray-300` — fall below the resolution floor. Vision is excellent for broad guidance during development. It cannot do exact verification or perceptual evaluation.

This is why the four-phase workflow matters for experience engineering: the agent handles math and generation (Execute), but **you** provide perceptual judgment (Validate). The division of labor is driven by a known architectural limitation, not preference.

## Three-Tier Token Architecture

Design tokens are the foundational design decisions of the UI — colors, spacing, typography, shadows. When they change, the impact ripples through every component, layout, and flow.

| Tier | Name | Example | Purpose |
|------|------|---------|---------|
| Primitive | Raw values | `blue-500: oklch(0.55 0.15 250)` | Color space, no semantics |
| Semantic | Intent | `color-bg-primary: {blue-500}` | Meaning, theme-switchable |
| Component | Scoped | `button-bg: {color-bg-primary}` | Component-specific |

Components reference **semantic** tokens, never primitives. A theme swap changes only the primitive→semantic mapping. Components don't know or care.

Brand colors are your judgment. Everything derivative — shade scales, harmony colors, dark mode variants, contrast validation — is computable math.

## Research: Grounding Color Decisions

[Lesson 3](/docs/methodology/lesson-3-high-level-methodology)'s first phase: ground the agent in both your codebase and domain knowledge before planning changes. For color systems, that means understanding the color science, studying how competitors handle palettes, and confirming accessibility requirements — before you pick a single hue.

### Domain Research with ArguSeek

You wouldn't pick a database without researching the options. Same principle applies to color decisions. [ArguSeek](/docs/methodology/lesson-5-grounding#arguseek-isolated-context--state)'s `research_iteratively` builds cumulative knowledge across queries through semantic subtraction — each follow-up skips already-covered content and advances the research:

```
Q1: "OKLCH color space best practices for design systems and token generation"
    → 18 sources: perceptual uniformity, gamut mapping, CSS Color 4 spec
    → Returns ~3,000 tokens

Q2: "SaaS billing dashboard color palettes — Stripe, Linear, Vercel design approaches"
    → 22 sources, skips OKLCH basics from Q1, focuses on competitor patterns
    → Returns ~3,400 tokens (competitor-specific, no repeated theory)

Q3: "WCAG 2.1 AA contrast requirements for design token systems"
    → 15 sources, skips color theory and competitor patterns already covered
    → Returns ~2,800 tokens (accessibility-specific)

Total: 55 sources scanned, ~9,200 tokens to your orchestrator
```

After three queries you have grounded knowledge on the color space (OKLCH over HSL), competitor precedent (what works in production SaaS dashboards), and the accessibility constraints your palette must satisfy (WCAG AA ≥ 4.5:1). All without polluting your main context — ArguSeek runs in isolated context per [Lesson 5](/docs/methodology/lesson-5-grounding)'s sub-agent pattern.

### Visual Research with agent-browser

Text research tells you *about* competitor palettes. Screenshots show you the actual result. Use agent-browser to capture competitor dashboards for **your** visual analysis:

```
open "https://stripe.com/billing"
screenshot /tmp/stripe-billing.png

open "https://linear.app"
screenshot /tmp/linear-dashboard.png
```

The agent captures the screenshots. **You** evaluate them — which color temperature feels right for a billing product? How do competitors handle the neutral scale? Does Stripe's blue feel more trustworthy than Linear's purple? These are perceptual judgments the agent cannot make (the VT limitation above). But the agent saved you from manually navigating, waiting for page loads, and managing screenshot files.

| Actor | Research Phase Responsibility |
|-------|-------------------------------|
| Human | Decide what to research, evaluate visual inspiration, form brand opinions |
| Agent | Retrieve and synthesize domain knowledge (ArguSeek), capture competitor screenshots (agent-browser) |

## Plan: Source Hues and Token Spec

Research complete. Now lock in the design decisions that drive everything downstream. This is [Lesson 3](/docs/methodology/lesson-3-high-level-methodology)'s Plan phase — and for color palettes, it's "Exact Planning": the solution structure is known (OKLCH shade scales), so be directive with specificity and constraints.

### Source Hue Selection (Human Judgment)

The shade-scale algorithm works for any hue. A production palette applies it to **multiple independent source hues** — not computed harmonies, but convention-fixed colors that users already associate with specific meanings.

**Source hues for the billing dashboard:**

| Role | Hue | Peak Chroma | Rationale |
|------|-----|-------------|-----------|
| Primary | 250° | 0.15 | Brand blue — identity, CTAs, active states |
| Neutral | 250° | 0.015 | Brand-tinted gray — same hue, ~10% chroma |
| Error | 25° | 0.15 | Convention: red-family for danger |
| Warning | 70° | 0.12 | Convention: amber for caution |
| Success | 155° | 0.13 | Teal-green — colorblind-safe vs. error red |

Error is red because users expect red for danger — not because red is a harmony of blue. Success uses teal-green rather than pure green because teal remains distinguishable from error-red under protanopia and deuteranopia (the two most common forms of color vision deficiency). Neutral is the brand hue with chroma stripped to ~0.015: this produces a brand-tinted gray that feels cohesive without being colorful. This project's own `custom.css` uses exactly this pattern: `--semantic-success: #06b6d4` (cyan), `--semantic-error: #e11d48` (rose-red) — independently chosen, not derived from `--brand-primary: #007576`.

These five hue choices are **the** human judgment calls in this lesson. Everything downstream — shade generation, contrast checking, semantic mapping, dark mode derivation — is math the agent computes.

### The Shade Scale Spec (Agent Math)

HSL looks intuitive but isn't perceptually uniform — `hsl(60,100%,50%)` (yellow) appears far brighter than `hsl(240,100%,50%)` (blue) despite identical lightness values. OKLCH fixes this by design, which is why the primitive tokens above use it. From a single brand color, the agent writes and executes code to derive the entire primitive tier. This is [Lesson 4](/docs/methodology/lesson-4-prompting-101)'s math-as-code principle in action: LLMs can't do arithmetic reliably, but they write code that does — color math is a perfect application.

**What one brand color yields:**

| Step | Output | Method |
|------|--------|--------|
| Shade scale (50–950) | 11 perceptually even shades | Non-linear lightness curve in OKLCH L channel |
| Hue compensation | Corrected hue per shade | Bezold-Brücke shift (colors drift toward yellow/purple with lightness) |
| Chroma curve | Balanced saturation | Parabolic — peak at midtones, taper at extremes |
| Harmony colors | Decorative accents, data-viz variety | Hue rotation in OKLCH H channel (not semantic roles — [see below](#color-harmony-for-decorative-variety)) |
| Dark mode | Inverted palette | Lightness inversion with chroma preservation |
| Contrast pairs | Valid text/bg combinations | WCAG AA ≥ 4.5:1 validation (A-010) |

This table is the spec: it tells the agent exactly what to compute and how. Five hues × 11 shades = 55 primitive tokens, plus semantic mappings and contrast pairs.

### Color Harmony for Decorative Variety

Harmony rotation produces visually cohesive hue sets for data visualization, illustration palettes, and decorative accents — anywhere you need multiple distinct hues that feel related. It is **not** how semantic roles (error, warning, success) are assigned. Those are convention-fixed.

| Harmony | Rotation | Best For |
|---------|----------|----------|
| Monochromatic | 0° (shade scale only) | Single-brand UIs, dashboards |
| Analogous | ±30° | Harmonious palettes, gradients |
| Complementary | 180° | CTAs, alerts, high-contrast accents |
| Split-complementary | 150° + 210° | Balanced accent pairs |
| Triadic | ±120° | Multi-brand, data visualization |
| Tetradic | 90° intervals | Complex UIs needing 4+ distinct hues |

Which harmonies to include is design judgment. The calculation is the agent's job.

### Token Assumptions Table

| Token Assumption | Source | Drives |
|------------------|--------|--------|
| Spacing base = 8px, scale = 0.5x/1x/1.5x/2x/3x/4x | Design system | All component padding, margins, gaps |
| Type scale ratio = 1.25 (Major Third) | Typography standards | All font sizes: base × ratio^n |
| Min contrast = 4.5:1 (WCAG AA) | Accessibility requirement | A-010, all text/bg combinations |
| OKLCH gamut = sRGB with fallbacks | Browser support | All color tokens need sRGB fallback |
| Every semantic background has a paired foreground token | Production design systems (M3, shadcn) | A-010, all text/bg combinations across themes |

The **Drives** column creates traceability from token decision to spec element. When a design decision changes (new brand colors, updated spacing scale, tighter accessibility requirements), the Drives column tells both you and the agent which constraints to re-verify.

## Execute: Agent-Generated Palette

Plan locked. The agent now writes and runs TypeScript to compute the entire palette — [Lesson 3](/docs/methodology/lesson-3-high-level-methodology)'s Execute phase. The prompt below feeds the source hues and algorithm spec directly to the agent. This is [Lesson 4](/docs/methodology/lesson-4-prompting-101)'s math-as-code principle: the agent can't do color arithmetic reliably, but it writes code that does.

### The Prompt

Demonstrates [Lesson 4](/docs/methodology/lesson-4-prompting-101) principles — imperative commands, constraints as guardrails, chain-of-thought, structure, math-as-code:

```
Write a TypeScript script that generates a production color palette from
source hues. Use OKLCH for all calculations; output both OKLCH values
and sRGB hex fallbacks.

## Input — Source Hues
| Role    | Hue | Peak Chroma | Notes                        |
|---------|-----|-------------|------------------------------|
| primary | 250 | 0.15        | Brand blue                   |
| neutral | 250 | 0.015       | Brand-tinted gray            |
| error   | 25  | 0.15        | Red-family for danger        |
| warning | 70  | 0.12        | Amber for caution            |
| success | 155 | 0.13        | Teal-green, colorblind-safe  |

## Steps
1. For each source hue, generate shade scale (50–950, 11 stops):
   - Map lightness non-linearly: L=0.97 at 50, L=0.25 at 950
   - Apply Bezold-Brücke hue compensation per shade
   - Use parabolic chroma curve: peak at mid-lightness, taper at extremes
   - Neutral scale uses same curve but capped at peak chroma 0.015
2. Build semantic mapping for light and dark themes:
   - Light: bg-page=neutral-50, text-primary=neutral-900,
     primary=primary-600, error=error-600, etc.
   - Dark: bg-page=neutral-900, text-primary=neutral-50,
     primary=primary-400, error=error-400, etc.
   - Use shade 600 for light-mode semantic colors (passes AA on white)
   - Use shade 400 for dark-mode semantic colors (passes AA on dark bg)
3. Compute paired foreground tokens:
   - For every background semantic token, find the shade with
     highest contrast ≥ 4.5:1 (prefer white/black, then lightest/darkest)
   - Output as --on-primary, --on-error, etc.
4. Validate every semantic text/background pair:
   - WCAG AA ≥ 4.5:1 for normal text, ≥ 3:1 for large text
   - Flag failing pairs with suggested fix (adjust shade until passing)
5. Output as CSS custom properties organized by tier:
   - Primitives: --color-primary-500: oklch(...)
   - Semantic (light): --color-primary: var(--color-primary-600)
   - Semantic (dark): --color-primary: var(--color-primary-400)
   - Include sRGB fallback for every primitive

## Constraints
- All math in OKLCH — sRGB only for fallback output
- Gamut-map out-of-range values by clamping chroma, preserving hue
- Every generated value must include both OKLCH and hex
- 5 roles × 11 shades = 55 primitives + ~15 semantic tokens per theme
```

The prompt structure maps directly to [Lesson 4](/docs/methodology/lesson-4-prompting-101) principles: imperative commands ("Write a script that..."), constraints as guardrails (WCAG thresholds, color space, gamut), chain-of-thought (numbered steps), markdown structure for information density, and math-as-code — the agent writes and runs the calculation rather than guessing color values. The input table separates designer judgment (which hues, which roles) from agent work (shade generation, contrast checking, semantic mapping).

### What the Agent Produces

The interactive component below demonstrates what the agent outputs from ~80 lines of TypeScript. Your job at this stage: run it, look at the result, and form a perceptual opinion before moving to the Validate phase. Try changing the hue from 250 to 30 (orange) — the entire palette recalculates.

import ColorPaletteGenerator from '@site/src/components/VisualElements/ColorPaletteGenerator';

<ColorPaletteGenerator />

**Concrete example.** Here's what one brand color (`oklch(0.55 0.15 250)` — the blue-500 already in the token table) produces:

export const shadeExample = [
  { shade: '50',  oklch: '0.91 0.042 254', hex: '#cfe5ff', vsW: '1.3:1',  vsB: '16.3:1', text: 'Black' },
  { shade: '100', oklch: '0.87 0.066 253', hex: '#b6d7ff', vsW: '1.5:1',  vsB: '14.1:1', text: 'Black' },
  { shade: '200', oklch: '0.79 0.111 252', hex: '#85beff', vsW: '1.9:1',  vsB: '10.8:1', text: 'Black' },
  { shade: '300', oklch: '0.71 0.150 252', hex: '#53a6fc', vsW: '2.6:1',  vsB: '8.2:1',  text: 'Black' },
  { shade: '400', oklch: '0.64 0.150 251', hex: '#398fe3', vsW: '3.4:1',  vsB: '6.2:1',  text: 'Black' },
  { shade: '500', oklch: '0.57 0.150 250', hex: '#1b7acb', vsW: '4.5:1',  vsB: '4.7:1',  text: 'Either' },
  { shade: '600', oklch: '0.50 0.140 249', hex: '#0067b0', vsW: '5.9:1',  vsB: '3.6:1',  text: 'White' },
  { shade: '700', oklch: '0.44 0.121 248', hex: '#005591', vsW: '7.8:1',  vsB: '2.7:1',  text: 'White' },
  { shade: '800', oklch: '0.37 0.084 248', hex: '#14446b', vsW: '10.2:1', vsB: '2.1:1',  text: 'White' },
  { shade: '900', oklch: '0.31 0.031 247', hex: '#243240', vsW: '13.0:1', vsB: '1.6:1',  text: 'White' },
  { shade: '950', oklch: '0.28 0.000 246', hex: '#292929', vsW: '14.6:1', vsB: '1.4:1',  text: 'White' },
];

<table>
<thead><tr><th>Shade</th><th>OKLCH</th><th>Color</th><th>vs White</th><th>vs Black</th><th>Text</th></tr></thead>
<tbody>
{shadeExample.map(s => (
  <tr key={s.shade}>
    <td>{s.shade}</td>
    <td><code>oklch({s.oklch})</code></td>
    <td><span style={{display:'inline-block',width:'2.5em',height:'1.2em',backgroundColor:s.hex,borderRadius:'3px',verticalAlign:'middle',border:'1px solid var(--border-default)',marginRight:'0.5em'}}></span><code>{s.hex}</code></td>
    <td>{s.vsW}</td>
    <td>{s.vsB}</td>
    <td>{s.text}</td>
  </tr>
))}
</tbody>
</table>

Note the three algorithms at work: lightness drops non-linearly (0.91→0.28), chroma peaks at 300–400 then tapers (parabolic curve), and hue drifts subtly from 254→246 (Bezold-Brücke compensation). Every shade has a valid WCAG AA text color. The crossover at shade 500–600 is where text switches from black to white — this is computed, not chosen.

## Validate: The Perceptual Loop

[Lesson 3](/docs/methodology/lesson-3-high-level-methodology)'s Validate phase closes the loop — and for experience engineering, this is where the human-agent division of labor matters most. The agent handles automated validation (contrast math, gamut checks). You handle perceptual validation (does it look right?). Neither can do the other's job.

### Automated Validation (Agent)

The agent validates every generated token against the spec constraints. Feed each source hue through the same shade-scale algorithm. Five hues × 11 shades = 55 primitive tokens. Here's a cross-section (shades 50, 500, 900):

export const primitiveOverview = [
  { role: 'Primary', shade: '50',  oklch: '0.97 0.068 250', hex: '#d3faff' },
  { role: 'Primary', shade: '500', oklch: '0.60 0.150 250', hex: '#2784d5' },
  { role: 'Primary', shade: '900', oklch: '0.29 0.092 250', hex: '#002c57' },
  { role: 'Neutral', shade: '50',  oklch: '0.97 0.007 250', hex: '#f2f6fa' },
  { role: 'Neutral', shade: '500', oklch: '0.60 0.015 250', hex: '#7a8189' },
  { role: 'Neutral', shade: '900', oklch: '0.29 0.009 250', hex: '#282c30' },
  { role: 'Error',   shade: '50',  oklch: '0.97 0.068 25',  hex: '#ffe4de' },
  { role: 'Error',   shade: '500', oklch: '0.60 0.150 25',  hex: '#ca5551' },
  { role: 'Error',   shade: '900', oklch: '0.29 0.092 25',  hex: '#501212' },
  { role: 'Warning', shade: '50',  oklch: '0.97 0.054 70',  hex: '#fff0ce' },
  { role: 'Warning', shade: '500', oklch: '0.60 0.120 70',  hex: '#ad721c' },
  { role: 'Warning', shade: '900', oklch: '0.29 0.074 70',  hex: '#422300' },
  { role: 'Success', shade: '50',  oklch: '0.97 0.059 155', hex: '#d7ffe4' },
  { role: 'Success', shade: '500', oklch: '0.60 0.130 155', hex: '#2c965d' },
  { role: 'Success', shade: '900', oklch: '0.29 0.080 155', hex: '#003618' },
];

<table>
<thead><tr><th>Role</th><th>Shade</th><th>OKLCH</th><th>Color</th></tr></thead>
<tbody>
{primitiveOverview.map((s, i) => (
  <tr key={i}>
    <td>{s.role}</td>
    <td>{s.shade}</td>
    <td><code>oklch({s.oklch})</code></td>
    <td><span style={{display:'inline-block',width:'2.5em',height:'1.2em',backgroundColor:s.hex,borderRadius:'3px',verticalAlign:'middle',border:'1px solid var(--border-default)',marginRight:'0.5em'}}></span><code>{s.hex}</code></td>
  </tr>
))}
</tbody>
</table>

Same algorithm, different inputs. The neutral scale's low chroma (~0.015 vs. 0.15) produces near-gray with a subtle blue undertone. Error, warning, and success scales are as saturated as primary — their 600 shades all pass WCAG AA on white, making them safe for text and icons in light mode.

**Semantic mapping.** Primitives are raw values; semantic tokens assign meaning. The agent maps shades to roles for both light and dark themes:

| Semantic Token | Light | Dark | Purpose |
|----------------|-------|------|---------|
| `--bg-page` | `neutral-50` | `neutral-900` | Page background |
| `--bg-surface` | `white` | `neutral-800` | Cards, popovers, modals |
| `--bg-muted` | `neutral-100` | `neutral-700` | Secondary surfaces, disabled |
| `--text-primary` | `neutral-900` | `neutral-50` | Body text |
| `--text-secondary` | `neutral-500` | `neutral-400` | Placeholder, muted text |
| `--border` | `neutral-200` | `neutral-700` | Borders, dividers |
| `--primary` | `primary-600` | `primary-400` | CTAs, links, active states |
| `--on-primary` | `white` | `primary-950` | Text on primary backgrounds |
| `--error` | `error-600` | `error-400` | Error text, icons |
| `--on-error` | `white` | `error-950` | Text on error background |
| `--error-subtle` | `error-50` | `error-950` | Error banner background |
| `--warning` | `warning-600` | `warning-400` | Warning text, icons |
| `--warning-subtle` | `warning-50` | `warning-950` | Warning banner background |
| `--success` | `success-600` | `success-400` | Success text, icons |
| `--success-subtle` | `success-50` | `success-950` | Success banner background |

Note light mode uses shade 600 (not 500) for semantic text roles — 500 shades hover around 4:1 contrast on white, just below WCAG AA. Shade 600 clears the threshold consistently across all hues. Dark mode uses 400 shades for the same reason against dark backgrounds. This crossover is computed by the same contrast-checking algorithm from the shade scale, not guessed.

**Paired foreground tokens.** Every background semantic token needs a paired foreground with guaranteed contrast. Material Design 3 calls these `on-primary`, `on-error`. shadcn/ui uses `--primary-foreground`, `--destructive-foreground`. The naming convention varies; the constraint is universal. Without explicit pairs, agents pick arbitrary text colors and contrast breaks silently.

### Visual Validation (Human + agent-browser)

Automated checks confirm the math is correct. They can't tell you whether the palette *feels* right. This is where you close the loop — and where the VT perceptual limitation from earlier becomes a workflow constraint.

Have the agent render the generated tokens into a preview page, then capture it for your review:

```
open "http://localhost:3000/token-preview"
screenshot /tmp/palette-light.png

# toggle theme
click @dark-mode-toggle
screenshot /tmp/palette-dark.png
```

You now have side-by-side screenshots of the full palette in both themes. The agent produced these artifacts, but it cannot evaluate them — it can verify "the page rendered without errors" via `snapshot -ic`, but not "the warning yellow is too muted" or "the neutral scale feels too warm." That's your judgment call.

### The Iteration Loop

When you spot a perceptual issue, feed it back to the agent in natural language: *"The warning yellow feels too muted at shades 400-600. Increase peak chroma from 0.12 to 0.14."* The agent regenerates the warning scale, re-validates WCAG contrast automatically, and screenshots the result. You review again. This loop continues until the palette satisfies both the math constraints (agent) and your visual standards (human).

| Step | Human | Agent |
|------|:-----:|:-----:|
| Pick source hues and roles | ✓ | |
| Generate 55-token shade scales | | ✓ |
| Validate WCAG AA contrast pairs | | ✓ |
| Render and screenshot palette | | ✓ |
| Evaluate visual quality and harmony | ✓ | |
| Provide perceptual feedback | ✓ | |
| Regenerate from adjusted parameters | | ✓ |

This is [Lesson 3](/docs/methodology/lesson-3-high-level-methodology)'s "iterate back to research as needed" made concrete. The cycle isn't linear — a perceptual issue in Validate might send you back to Plan (different source hue) or even Research (what chroma range do competitors use for warnings?). The four phases are a cycle, not a waterfall.

### Theming as Validation

Theme switching is another validation axis. The palette must hold up under inversion.

**Light/dark themes.** Same semantic token names, different primitive references — the Light/Dark columns in the semantic mapping table above. A theme is a complete primitive→semantic mapping. The agent generates all shade scales from the source hues, and components never change.

**Custom themes / user-provided.** Token override layer. Feed a customer's brand color through the same derivation pipeline — the agent generates a full palette and validates it passes contrast checks (A-010). White-label skins and branded portals, once expensive custom design work, become a single prompt execution.

**Platform adaptations.** Scale tokens per device class (mobile/tablet/desktop). Base unit changes; proportional relationships stay constant.

## Key Takeaways

- **The four-phase workflow applies to experience engineering** — Research grounds color decisions in competitors and standards, Plan captures human judgment (source hues), Execute generates the math (55 primitives + semantic mapping), Validate closes the perceptual loop. Same [Lesson 3](/docs/methodology/lesson-3-high-level-methodology) cycle, different domain.

- **Visual quality is the human's job; contrast math is the agent's** — the VT perceptual floor means agents can screenshot what they can't evaluate. You provide the feedback that drives iteration; the agent regenerates and re-validates instantly.

- **Brand colors are design judgment; everything derivative is computable math** — shade scales, harmony colors, dark mode variants, and contrast validation are all derived by agent-written code from a handful of source hues.

- **Three-tier architecture enables theme switching without component changes** — primitives hold raw values, semantic tokens assign meaning, component tokens scope to specific elements. A theme swap changes only the primitive→semantic mapping.

- **OKLCH over HSL** — perceptually uniform color space produces accurate shade scales. HSL's non-uniform lightness makes "identical" lightness values appear drastically different across hues.

- **Every semantic background needs a paired foreground token** — without explicit `on-primary`, `on-error` pairs with guaranteed contrast, agents pick arbitrary text colors and contrast breaks silently.

- **Token assumptions table creates traceability** — the Drives column maps each design decision to the spec constraints it affects, telling you and the agent exactly what to re-verify when a token changes.

- **Design tokens are architectural constraints** — they affect every component and must be specified upfront. Retrofitting tokens is an order of magnitude harder than building them in. [Lesson 15](/docs/experience-engineering/lesson-15-ui-specs) builds components that consume these tokens.
