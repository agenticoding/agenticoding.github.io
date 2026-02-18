# Agentic Coding — Design System

You are implementing UI for a monochrome-first design system. Color exists only for semantic meaning. All surfaces, borders, and text are achromatic by default.

## Constraints

Apply these rules to every UI decision:

1. **Achromatic base** — Use pure gray for all surfaces, borders, and text. Do NOT use tinted neutrals. Instead, use the neutral palette (C:0.000) for all non-semantic elements.
2. **Color = meaning** — Apply chromatic color only for semantic callouts, diagrams, status indicators, and data viz. Before using any color, answer: "what does this hue mean here?" If there is no semantic answer, use neutral gray instead.
3. **Equal hue standing** — All 9 chromatic hues have equal weight. Do NOT treat any single hue as "the brand color." Instead, select hue based on semantic meaning (see Color Selection Procedure).
4. **Flat construction** — Do NOT use gradients, shadows, or glows. Instead, use solid fills, clean borders (1px solid), and whitespace for visual hierarchy.
5. **Typographic interaction** — Identify interactive elements by typography and shape. Use underlines + font-weight for links. Use dark/light fills for buttons. Do NOT rely on color to signal interactivity. Instead, use shape, weight, and underlines.
6. **Color budget: 60-30-10** — 60% achromatic surfaces, 30% elevated gray, 10% semantic color. Default to 95/5 for content pages. Reserve 60-30-10 for diagram-heavy pages only.
7. **Curved default, angular accent** — Use rounded forms (squircle containers, Bezier connectors) as the default shape vocabulary. Reserve angular forms (diamonds, chevrons, sharp miters) for high-arousal semantic states (error, warning, code). Do NOT mix angular containers with positive-valence content. Instead, match shape curvature to semantic valence (see Illustration System).

---

## Color Selection Procedure

When deciding which color to apply, follow these steps:

### Step 1: Determine semantic category

| Hue | Semantic Role | Apply To |
|-----|--------------|----------|
| Error (H:25°) | Danger, critical | Error states, breaking changes, destructive actions |
| Warning (H:70°) | Caution, attention | Warnings, deprecation notices, hallucination risk |
| Lime (H:110°) | Progress, growth | In-progress states, intermediate steps, iteration cycles |
| Success (H:155°) | Validated, complete | Completed states, validation passes, active connections |
| Cyan (H:195°) | System, code | System components, code generation, infrastructure |
| Indigo (H:250°) | Knowledge, data | Documentation, context retrieval, data references |
| Violet (H:285°) | AI transformation | AI processing, transformation steps, synthesis operations |
| Magenta (H:320°) | AI creative | LLM agents, creative processes, prompt engineering |
| Rose (H:355°) | Human actor | User input, human actors, developer intent, emphasis |

### Step 2: Select shade by context

| Context | Light Mode Shade | Dark Mode Shade |
|---------|-----------------|-----------------|
| Semantic text and icons | 600 (WCAG AA on white) | 400 (WCAG AA on #0d1117) |
| Subtle tinted backgrounds | 50 | 950 |
| Borders, decorative fills | 100–200 | 700–800 |
| Mid-tone accents | 500 | 500 |
| Darkest text on colored bg | 900 | — |

### Step 3: Use CSS tokens (not raw hex)

| Token | Light (shade-600) | Dark (shade-400) |
|-------|-------------------|-------------------|
| `--visual-error` | #ad3735 | #ec7069 |
| `--visual-warning` | #8e5900 | #cd8c37 |
| `--visual-lime` | #6b6b00 | #a1a22b |
| `--visual-success` | #007a44 | #48b475 |
| `--visual-cyan` | #007576 | #00b2b2 |
| `--visual-indigo` | #1369b0 | #53a0ec |
| `--visual-violet` | #6057af | #938eeb |
| `--visual-magenta` | #874895 | #c07ecf |
| `--visual-rose` | #9b436a | #d7799f |
| `--visual-neutral` | #666666 | #9b9b9b |

### Step 4: For diagram region fills, use background tokens

Transparent tints at 10% light / 15% dark:

```css
--visual-bg-{hue}: color-mix(in srgb, var(--visual-{hue}) 10%, transparent);
/* Dark mode: 15% instead of 10% */
```

All 10 hues (error, warning, lime, success, cyan, indigo, violet, magenta, rose, neutral) have `--visual-bg-*` tokens.

---

## Typography

### Font Assignment

| Role | Font | CSS Variable | Weights |
|------|------|-------------|---------|
| Display / headings | Space Grotesk | `--font-display` | 600, 700 |
| Body text | Inter | `--font-body` | 400, 500, 600, 700, 800 |
| Code — default | Monaspace Neon | `--font-mono` | 400, 500, 600, 700 |
| Code — AI voice | Monaspace Argon | `--font-mono-ai` | 400, 500 |
| Code — spec/schema | Monaspace Xenon | `--font-mono-spec` | 400, 500, 600 |
| Code — human note | Monaspace Radon | `--font-mono-human` | 400 |
| Code — keyword/op | Monaspace Krypton | `--font-mono-keyword` | 400, 500 |

```css
--font-display: 'Space Grotesk', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'Monaspace Neon', monospace;
--font-mono-ai: 'Monaspace Argon', monospace;
--font-mono-spec: 'Monaspace Xenon', monospace;
--font-mono-human: 'Monaspace Radon', monospace;
--font-mono-keyword: 'Monaspace Krypton', monospace;
--font-mono-features: 'calt' 1, 'liga' 0;
```

Apply `--font-display` to `h1`, `h2`. Apply `--font-body` to body text. All five Monaspace faces share identical metrics and mix freely within the same monospaced grid.

### OpenType Features

Apply to all Monaspace containers:

```css
font-feature-settings: var(--font-mono-features);
```

- `calt` ON — Texture healing for even visual density across the monospace grid.
- `liga` OFF — Prevents ambiguous ligatures. Opt in per-context via stylistic sets (`ss01`–`ss10`), never globally.

### Typographic Voice Selection

Color encodes *category*. Typeface encodes *speaker*. These axes are orthogonal — a keyword can be Krypton *and* cyan; a comment can be Radon *and* muted gray.

When selecting a monospace voice:

| Face | Voice | Apply To |
|------|-------|----------|
| **Neon** | System / neutral | Source code, terminal output, config files, tool invocations. Default for all `<code>`. |
| **Argon** | AI agent | LLM responses, agent reasoning traces, AI-generated explanations, ghost text. |
| **Xenon** | Authoritative / structural | Spec IDs, schema keys, API contracts, system boundary labels, constraint rules. |
| **Radon** | Human / informal | Code comments, developer notes, prompt drafts, TODO markers. |
| **Krypton** | Technical / mechanical | Keywords, operators, CLI flags, file paths in callouts, taxonomy labels. |

### Voice Application by Content Type

**Code blocks:** Neon base. Comments in Radon. Keywords in Krypton. AI output in Argon.

**Prompt templates:** Human text in Radon. Placeholders in Xenon. Expected AI response in Argon.

**Spec tables:** Spec IDs in Xenon. Verification methods in Neon. Rationale in Argon.

**Diagram labels:** System/boundary names in Xenon. Agent labels in Argon. Human actors in Radon. Data flows in Krypton.

**Inline code:** Default Neon. Override via utility class: `<code class="mono-ai">`, `<code class="mono-spec">`, etc.

### Voice Constraints

- **Monospace only.** Do NOT apply voice faces to body text or headings. Instead, keep body as Inter, headings as Space Grotesk.
- **Max 2 voices per block.** Use 3 only when explicitly contrasting human / AI / system actors.
- **Radon is scarce.** Reserve for genuinely human content. Do NOT use Radon for emphasis or decoration. Instead, use weight or Krypton.
- **Graceful fallback.** All voice tokens fall back to `var(--font-mono)` → system `monospace`.

---

## Design Tokens

### Token Architecture

| Tier | Purpose | Naming | Example |
|------|---------|--------|---------|
| Primitive | Raw palette values | `{hue}-{shade}` | `cyan-600`, `neutral-200` |
| Semantic | UI surfaces, text, borders, illustration | `--{category}-{role}` | `--surface-page`, `--visual-cyan` |
| Component | Per-component overrides | (not in this document) | — |

### Surface, Text & Border Tokens

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--surface-page` | #ffffff | #0d1117 |
| `--surface-raised` | #f5f5f5 (neutral-50) | #161b22 |
| `--surface-muted` | #e8e8e8 (neutral-100) | #3d3d3d (neutral-800) |
| `--text-heading` | #2b2b2b (neutral-900) | #e8e8e8 (neutral-100) |
| `--text-body` | #505050 (neutral-700) | #d4d4d4 (neutral-200) |
| `--text-muted` | #808080 (neutral-500) | #9b9b9b (neutral-400) |
| `--border-subtle` | #d4d4d4 (neutral-200) | #3d3d3d (neutral-800) |
| `--border-default` | #b7b7b7 (neutral-300) | #505050 (neutral-700) |

---

## Spatial System

Base unit: 8px. All spacing and line-heights snap to 8px grid multiples.

### Spacing Scale

| Token | Value |
|-------|-------|
| `--space-0` | 0px |
| `--space-px` | 1px |
| `--space-0h` | 4px |
| `--space-1` | 8px |
| `--space-2` | 16px |
| `--space-3` | 24px |
| `--space-4` | 32px |
| `--space-5` | 48px |
| `--space-6` | 64px |
| `--space-7` | 80px |
| `--space-8` | 96px |
| `--space-9` | 128px |
| `--space-10` | 160px |

```css
--space-0: 0px;
--space-px: 1px;
--space-0h: 4px;
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 48px;
--space-6: 64px;
--space-7: 80px;
--space-8: 96px;
--space-9: 128px;
--space-10: 160px;
```

| Purpose | Steps | Values |
|---------|-------|--------|
| Component padding | step 2–3 | 16–24px |
| Section gap | step 5–6 | 48–64px |
| Page margin | step 7–8 | 80–96px |

Do NOT use arbitrary pixel values for spacing. Instead, use `--space-*` tokens.

### Type Scale

Minor Third (1.200), base 16px. Sizes integer-rounded. Line-heights 8px-snapped.

| Token | Size | Line-Height | Role |
|-------|------|-------------|------|
| `--text-xs` | 11px | 24px (`--lh-sm`) | Fine print, captions |
| `--text-sm` | 13px | 24px (`--lh-sm`) | Secondary, metadata |
| `--text-base` | 16px | 24px (`--lh-sm`) | Body text |
| `--text-lg` | 19px | 32px (`--lh-lg`) | Lead paragraphs |
| `--text-xl` | 23px | 32px (`--lh-lg`) | h4 subheadings |
| `--text-2xl` | 28px | 40px (`--lh-2xl`) | h3 section headings |
| `--text-3xl` | 33px | 40px (`--lh-2xl`) | h2 major headings |
| `--text-4xl` | 40px | 48px (`--lh-3xl`) | h1 page titles |

```css
--text-xs: 11px;
--text-sm: 13px;
--text-base: 16px;
--text-lg: 19px;
--text-xl: 23px;
--text-2xl: 28px;
--text-3xl: 33px;
--text-4xl: 40px;

--lh-tight: 16px;
--lh-sm: 24px;
--lh-lg: 32px;
--lh-2xl: 40px;
--lh-3xl: 48px;
```

Do NOT use computed `line-height: 1.5`. Instead, assign `--lh-*` tokens.

Apply `max-width: 66ch` to text containers.

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-none` | 0px |
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-2xl` | 24px |
| `--radius-full` | 9999px |

```css
--radius-none: 0px;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

| Context | Adjustment | Radius |
|---------|-----------|--------|
| Error/danger | -50% | 2px |
| Warning | -25% | 2px |
| Success | +25% | 4px |
| Neutral/info | default | 3px |
| Avatar | circle | 50% |
| Input fields | -25% | 2px |

Do NOT apply high curvature (`--radius-full`) to error or warning elements. Instead, use `--radius-sm` or lower.

Use `--radius-md` (8px) for cards and containers. Use `--radius-sm` (4px) for inputs and badges.

Do NOT apply border-radius to accent-bordered elements (3–4px `border-left` or `border-top` callouts, blockquotes, step indicators). Radius rounds the accent stroke's endpoints into decoration that communicates nothing. Instead, use `border-radius: 0` and let the accent border terminate with sharp edges. Exception: cards with a full surrounding `border` (all four sides) may use `--radius-md` even when one side carries a thicker accent override.

### Line Weight

| Token | Thickness | Light Color | Dark Color |
|-------|-----------|-------------|------------|
| `--border-subtle` | 1px | #d4d4d4 (neutral-200) | #3d3d3d (neutral-800) |
| `--border-default` | 1px | #b7b7b7 (neutral-300) | #505050 (neutral-700) |
| `--border-emphasis` | 1px | #808080 (neutral-500) | #808080 (neutral-500) |
| `--border-strong` | 2px | #505050 (neutral-700) | #b7b7b7 (neutral-300) |
| `--border-accent` | 3px | semantic color | semantic color |

Do NOT exceed 4 visible structural borders per viewport section. Instead, use spacing or surface tone for grouping.

Reserve `--border-accent` (3px) for semantic callouts only.

### Target Sizes

| Token | Height | H-Padding | Use |
|-------|--------|-----------|-----|
| `--target-sm` | 32px | 16px | Tertiary actions, inline buttons, tags |
| `--target-md` | 40px | 24px | Secondary actions, form inputs |
| `--target-lg` | 48px | 32px | Primary actions, main CTAs |
| `--target-xl` | 56px | 48px | Hero CTAs, prominent actions |

All interactive elements must be at least 24×24 CSS px (WCAG 2.2 AA). Primary actions use `--target-lg` (48px) to meet WCAG AAA.

Do NOT place adjacent interactive elements closer than 8px apart.

### Proximity Grouping

| Relationship | Spacing |
|-------------|---------|
| Tightly related | 8px (`--space-1`) |
| Within-group | 16px (`--space-2`) |
| Between-group | 48px (`--space-5`) |
| Between-section | 64–96px (`--space-6` – `--space-8`) |

Within-group spacing must be less than half the between-group spacing.

Do NOT use equal spacing within and between groups. Instead, ensure at least a 2× step difference.

---

## UI Patterns

### Buttons

| Variant | Background | Border | Text | Use |
|---------|-----------|--------|------|-----|
| Primary CTA | cyan-600 (light) / cyan-400 (dark) | none | white | Main conversion action (1 per page max) |
| Primary | #2b2b2b (light) / #e8e8e8 (dark) | none | white (light) / dark (dark) | Standard primary actions |
| Outline | transparent | dark | dark | Secondary actions |
| Ghost | transparent | none | underlined dark | Tertiary / inline actions |

Chromatic color is permitted on **Primary CTA only** — one per page, using `var(--visual-cyan)` as background. This is the sole exception to achromatic buttons. All other button variants remain neutral. Do NOT introduce additional hue variants. Hover: darken fill (shift to cyan-700/cyan-300). Do NOT change hue on hover.

White text on cyan-600 (#007576) achieves 5.38:1 contrast ratio (WCAG AA). White text on cyan-400 (#00b2b2) in dark mode achieves sufficient contrast on the lighter teal fill.

### Badges

| Mode | Background | Text | Border |
|------|-----------|------|--------|
| Light | shade-50 | shade-600 | 1px solid shade-600 |
| Dark | shade-600 | white | none |

Example (cyan light): `background: #d4fffe; color: #007576; border: 1px solid #007576;`
Example (cyan dark): `background: #007576; color: #fff;`

### Cards

- Border: `1px solid var(--border-default)`, `border-radius: var(--radius-md)`
- Background: `var(--surface-raised)` or `var(--surface-page)`
- Hover: shift border to neutral-400. Do NOT add color on hover. Instead, increase border contrast only.

### Callout Borders

- 3px left border in semantic color + colored label text. Body text stays neutral.
- Example: `border-left: 3px solid #1369b0;` with `<span style="color:#1369b0;">TIP</span>`
- Do NOT apply border-radius to callout containers. Instead, use `border-radius: 0`. The accent border's sharp endpoints reinforce its directional intent.

### Interactive States

| State | Treatment |
|-------|-----------|
| Rest | neutral border |
| Hover | border lightens (neutral-700 → neutral-400) |
| Focus | darker border (contrast shift) |
| Active | darker fill or inverted contrast |

All state changes use contrast/weight shifts. Do NOT introduce hue changes on interaction states. Instead, shift lightness within the neutral palette.

### Inputs

- Border: neutral. Focus: darker border.
- Do NOT use colored focus rings. Instead, increase border contrast on focus.

---

## Illustration System

All illustrations, diagrams, and icons use a unified shape vocabulary derived from two parametric families. Curved forms are the default. Angular forms are reserved for high-arousal semantic states. See `ILLUSTRATION_GUIDE.md` for shape psychophysics theory and parametric math.

### Shape Vocabulary

| Family | Forms | Superellipse n | Default For |
|--------|-------|----------------|-------------|
| Smooth Circuit | Squircle containers, Bezier connectors, circular endpoints, round caps | n = 3–4 (squircle), n = 2 (circle) | Positive-valence: success, AI, system, knowledge, progress |
| Terminal Geometry | Diamond accents, chevron arrows, angular miters, bracket syntax | n = 1–1.5 (diamond), 45° angles | High-arousal: error, warning, code structure, human action |

Do NOT use strict-rectangle-only construction (90° routing, sharp corners on all containers). Instead, use squircle containers (n=3–4) even for box-like elements.

Do NOT apply angular containers (diamonds, sharp-cornered shapes) to success, AI, or system content. Instead, use squircle or circular containers for positive-valence elements.

### Shape Selection Procedure

When choosing a shape for a diagram element, follow these steps:

#### Step 1: Determine valence from semantic hue

| Semantic Hue | Valence | Shape Family |
|-------------|---------|-------------|
| Success (H:155°) | Positive | Smooth Circuit |
| Cyan (H:195°) | Positive | Smooth Circuit |
| Indigo (H:250°) | Positive | Smooth Circuit |
| Violet (H:285°) | Positive | Smooth Circuit |
| Magenta (H:320°) | Positive | Smooth Circuit |
| Lime (H:110°) | Neutral | Smooth Circuit |
| Neutral | Neutral | Smooth Circuit |
| Error (H:25°) | Negative | Terminal Geometry |
| Warning (H:70°) | High-arousal | Terminal Geometry |
| Rose (H:355°) | Active | Either (context-dependent) |

#### Step 2: Select container shape

| Content Type | Container | SVG Implementation |
|-------------|-----------|-------------------|
| System node / module | Squircle | `<rect rx="10">` (40px box) or superellipse `<path>` |
| Agent / AI process | Circle or pill | `<circle>` or `<rect rx="50%">` |
| Data / knowledge | Rounded rect | `<rect rx="8">` |
| Human actor | Circle or squircle | `<circle>` or `<rect rx="10">` |
| Generic container | Squircle | `<rect rx="10">` to `<rect rx="14">` |
| Code / terminal | Diamond or sharp rect | `<polygon>` (4-point) or `<rect rx="2">` |
| Error state | Sharp rect or diamond | `<rect rx="2">` or `<polygon>` |
| Warning state | Triangle or diamond | `<polygon>` (3-point up) |

#### Step 3: Choose connector style

| Connection Type | Connector | SVG Implementation |
|----------------|-----------|-------------------|
| Data flow (happy path) | Bezier curve | `<path d="M… C…">` with `stroke-linecap="round"` |
| Error / rejection path | Angular polyline | `<polyline>` with `stroke-linecap="square"` |
| Bidirectional | Bezier with markers at both ends | `marker-start` + `marker-end` |
| Optional / dashed | Bezier with dash array | `stroke-dasharray="6 4"` |

Do NOT use straight-line connectors for happy-path data flow. Instead, use Bezier curves (`C` or `Q` commands).

Do NOT use rounded caps on error/warning connectors. Instead, use `stroke-linecap="square"` and `stroke-linejoin="miter"`.

### Stroke Weight Scale

| Token | Value | Purpose |
|-------|-------|---------|
| `--stroke-fine` | 1px | Grid lines, hairlines, decorative rules |
| `--stroke-light` | 1.5px | Secondary connectors, annotations |
| `--stroke-default` | 2px | Standard connectors, internal details |
| `--stroke-medium` | 2.5px | Container outlines, primary shapes |
| `--stroke-heavy` | 3px | Emphasized elements, primary flow arrows |
| `--stroke-accent` | 4px | Semantic accent strokes (1 per diagram max) |

```css
--stroke-fine: 1px;
--stroke-light: 1.5px;
--stroke-default: 2px;
--stroke-medium: 2.5px;
--stroke-heavy: 3px;
--stroke-accent: 4px;
```

Do NOT exceed 4px stroke width. Instead, use fill-weight or size increase for emphasis.

Do NOT use more than 3 distinct stroke weights in a single diagram.

### Arrow Markers

| Type | Marker Size | refX | Polygon Points |
|------|------------|------|---------------|
| Standard | 6×6 | 5 | `0 0, 6 3, 0 6` |
| Large | 8×8 | 6 | `0 0, 8 4, 0 8` |

Use Standard (6px) by default. Use Large (8px) only in narrow viewBox diagrams (< 400px wide). Arrow fill inherits from stroke color.

### Construction Rules

1. **Grid snap** — All anchor points snap to the 8px spatial grid (`--space-*` tokens). Minimum shape dimension = 8px.
2. **Preferred angles** — 15°, 30°, 45°, 60°, 75°, 90°. Other angles require justification.
3. **Proportional corner radius** — Scale `rx` proportionally: `rx = height × 0.25` (range 8–16px). Do NOT use a fixed `rx` regardless of box size.
4. **Minimum gap** — 8px (`--space-1`) between shapes. 16px (`--space-2`) between shape and label.
5. **Label placement** — Labels go directly adjacent to elements (spatial contiguity). Do NOT use a separate legend when inline labels fit.
6. **Coherence** — Every shape serves a communicative purpose. Do NOT add decorative shapes.

### Flat Construction Enforcement

Do NOT use SVG filters (`<filter>`, `feDropShadow`, `feGaussianBlur`). Instead, use stroke-weight hierarchy and surface tone for emphasis.

Do NOT use SVG `<linearGradient>` or `<radialGradient>` for fills. Instead, use solid `--visual-bg-*` tint tokens.

Do NOT use `box-shadow` on diagram containers. Instead, use `border` with `--border-default` or semantic color.

---

## Icon & Diagram Geometry

### Icon Canvas

| Token | Value | Purpose |
|-------|-------|---------|
| `--icon-sm` | 16px | Inline text icons |
| `--icon-md` | 24px | Default UI icons |
| `--icon-lg` | 32px | Card/callout icons |
| `--icon-xl` | 48px | Diagram node icons |
| `--icon-2xl` | 64px | Hero/feature icons |

```css
--icon-sm: 16px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 48px;
--icon-2xl: 64px;
```

All icons use a square viewBox matching their canvas (e.g., `viewBox="0 0 24 24"` for `--icon-md`). Content fills 80% of the canvas; 10% padding on each side.

Do NOT create icons at arbitrary sizes. Instead, use `--icon-*` tokens.

### Icon Construction

| Property | Value |
|----------|-------|
| `fill` | `none` (outline style) |
| `stroke` | `currentColor` |
| `stroke-width` | `2` (at 24px canvas) |
| `stroke-linecap` | `round` (Smooth Circuit) or `square` (Terminal Geometry) |
| `stroke-linejoin` | `round` (Smooth Circuit) or `miter` (Terminal Geometry) |

Smooth Circuit icons (default): `stroke-linecap="round"` + `stroke-linejoin="round"`.

Terminal Geometry icons (error, warning, code): `stroke-linecap="square"` + `stroke-linejoin="miter"`.

Do NOT mix linecap/linejoin styles within a single icon. Choose one family based on semantic valence.

### Diagram Sizing

| Diagram Type | ViewBox Width | Typical Height |
|-------------|--------------|---------------|
| Inline icon pair | 100–200 | 48–64px |
| Flow diagram | 400–600 | 160–240px |
| System diagram | 500–1000 | 300–500px |
| Comparison (side-by-side) | 600–1000 | 200–400px |

All diagram containers use `width: 100%` with SVG `viewBox` controlling aspect ratio. Do NOT set fixed pixel widths on diagram containers.

### Diagram Accessibility

Every SVG diagram requires:

1. `role="img"` on the `<svg>` element
2. `aria-label` describing the diagram's content and relationships
3. Semantic color paired with a non-color indicator (shape difference, label text, or pattern)

Do NOT rely on color alone to distinguish diagram elements. Instead, combine color + shape + label.

---

## Dark Mode

| Property | Value |
|----------|-------|
| Page background | #0d1117 |
| Surface/cards | #161b22 |
| Muted surface | #3d3d3d (neutral-800) |
| Body text | #cdd6d6 (neutral-200) |
| Heading text | #e2eae9 (neutral-100) |
| Semantic colors | shade-400 (not shade-600) |
| Bg tint opacity | 15% (not 10%) |

Do NOT use pure #000000 for backgrounds. Instead, use #0d1117.
Do NOT use pure #ffffff for text. Instead, use neutral-100 (#e2eae9) or neutral-200 (#cdd6d6).

All `--visual-*` tokens shift from shade-600 to shade-400 in dark mode.

---

## Accessibility

- **WCAG AA contrast:** shade-600 on white ≥ 4.5:1. shade-400 on #0d1117 ≥ 4.5:1.
- **Redundant encoding:** Every color signal must pair with a non-color indicator (icon, text label, pattern, or underline). Do NOT convey information through color alone. Instead, always add icon + text label alongside color.
- **Error example:** red border + icon + "Error:" text label. Success: green border + icon + "Success:" text.
- **Links:** Must have underline or equivalent non-color indicator.
- **Colorblind-safe:** Success uses teal-green (H:155°), distinguishable from error red under protanopia/deuteranopia.

---

## Brand Identity Assets

### Logo Mark

- `</>` monochrome glyph. Dark on light backgrounds, light on dark backgrounds.
- Do NOT create colored logo variants. The mark is always achromatic.

### Favicon

- SVG with `prefers-color-scheme` media query for light/dark switching
- `.ico` fallback at 32x32, Apple touch icon at 180x180

### Social Card

- Dark background (#111111), white title text, optional 3px semantic accent line

---

## Color Palettes (Reference)

### Neutral — Achromatic (C:0.000)

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #f5f5f5 | #e8e8e8 | #d4d4d4 | #b7b7b7 | #9b9b9b | #808080 | #666666 | #505050 | #3d3d3d | #2b2b2b | #222222 |

### Error — H:25° C:0.16

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #fff2f0 | #ffdfdc | #ffc3bd | #ff958d | #ec7069 | #ce514d | #ad3735 | #8d2324 | #701719 | #520e10 | #410b0c |

### Warning — H:70° C:0.13

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #fff3e6 | #ffe3c3 | #fcca91 | #e6aa63 | #cd8c37 | #b17000 | #8e5900 | #704500 | #573400 | #402400 | #331b00 |

### Lime — H:110° C:0.14

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #f7fac9 | #eaedb0 | #d8da8d | #bcbe5c | #a1a22b | #868600 | #6b6b00 | #535400 | #404000 | #2e2e00 | #242400 |

### Success — H:155° C:0.14

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #ddffe8 | #bef8d1 | #9fe8b8 | #72ce95 | #48b475 | #1c985a | #007a44 | #006034 | #004a27 | #00361a | #002a13 |

### Cyan — H:195° C:0.145

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #d4fffe | #a5faf9 | #7aeae9 | #2ad0d0 | #00b2b2 | #009393 | #007576 | #005c5c | #004747 | #003333 | #002828 |

### Indigo — H:250° C:0.14

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #eef6ff | #d7eaff | #b4d8ff | #7cbdff | #53a0ec | #3284d0 | #1369b0 | #005190 | #003e71 | #002c54 | #002242 |

### Violet — H:285° C:0.14

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #f4f4ff | #e5e5ff | #cfcfff | #b0adff | #938eeb | #7971d0 | #6057af | #4b4290 | #393172 | #282254 | #1f1b42 |

### Magenta — H:320° C:0.14

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #fcf0ff | #f9ddff | #f2bffd | #da9de8 | #c07ecf | #a462b4 | #874895 | #6d3579 | #55265f | #3d1a45 | #301436 |

### Rose — H:355° C:0.13

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| #fff1f6 | #ffdde9 | #ffbfd7 | #f198bb | #d7799f | #bb5c84 | #9b436a | #7e3053 | #632240 | #48172d | #391223 |
