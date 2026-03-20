# Agentic Coding — Design System

You are implementing UI for a monochrome-first design system. Color exists only for semantic meaning. All surfaces, borders, and text are achromatic by default.

## Constraints

1. **Achromatic base** — Use pure gray for all surfaces, borders, and text. Do NOT use tinted neutrals. Instead, use the neutral palette (C:0.000) for all non-semantic elements.
2. **Color = meaning** — Apply chromatic color only for semantic callouts, diagrams, status indicators, and data viz. Before using any color, answer: "what does this hue mean here?" If there is no semantic answer, use neutral gray instead.
3. **Equal hue standing** — All 9 chromatic hues have equal weight. Do NOT treat any single hue as "the brand color." Instead, select hue based on semantic meaning (see Color Selection Procedure).
4. **Flat construction** — Do NOT use gradients, shadows, or glows. Instead, use solid fills, clean borders (1px solid), and whitespace for visual hierarchy. Exception: All emoji representations (Noto SVGs via `scripts/fetch-emoji.js`, custom inline SVG recreations, or `<img>` fallbacks) are exempt — emoji visuals must never be modified to conform to this system.
5. **Typographic interaction** — Identify interactive elements by typography and shape. Use underlines + font-weight for links. Use dark/light fills for buttons. Do NOT rely on color to signal interactivity. Instead, use shape, weight, and underlines.
6. **Color budget: 60-30-10** — 60% achromatic surfaces, 30% elevated gray, 10% semantic color. Default to 95/5 for content pages. Reserve 60-30-10 for diagram-heavy pages only.
7. **Curved default, angular accent** — Use rounded forms (squircle containers, Bezier connectors) as the default shape vocabulary. Reserve angular forms (diamonds, chevrons, sharp miters) for high-arousal semantic states (error, warning, code). Do NOT mix angular containers with positive-valence content. Instead, match shape curvature to semantic valence (see Illustration System).
8. **Motion is purposive** — Every animated element must answer: "what does this motion orient, teach, or confirm?" If no answer, use no animation. Do NOT animate for decoration. Reserve looping motion (idle states) for semantic signals only: active authoring, AI processing, data flow, system readiness. Max 2 simultaneous idle loops per figure.
9. **Static completeness** — Design the final settled state first. Animation reveals content; it does not define it. Every figure must communicate its full concept in the phase=1 state with no motion.

---

## Color Selection Procedure

### Step 1: Determine semantic category

| Hue | Semantic Role | Apply To |
|-----|--------------|----------|
| Error (H:25°) | Danger, critical | Error states, breaking changes, destructive actions |
| Warning (H:70°) | Caution, attention | Warnings, deprecation notices, hallucination risk |
| Success (H:155°) | Validated, complete | Completed states, validation passes, active connections |
| Cyan (H:195°) | System, code | System components, code generation, infrastructure |
| Indigo (H:250°) | Knowledge, data | Documentation, context retrieval, data references |
| Violet (H:285°) | AI transformation | AI processing, transformation steps, synthesis operations |
| Magenta (H:320°) | AI creative | LLM agents, creative processes, prompt engineering |
| Neutral | Human actor / base | Human actors, developer intent — achromatic by design |

**Removed hues:** Lime (H:110°) aliased to Success — semantically overlapping at 45° gap.
Rose (H:355°) aliased to Neutral — human actors represented achromatic per the base principle.
CSS tokens `--visual-lime` and `--visual-rose` remain as aliases for backward compatibility.

### Step 2: Select shade by context

| Context | Light Mode Shade | Dark Mode Shade |
|---------|-----------------|-----------------|
| Semantic text and icons | Pareto-optimal¹ (WCAG AA ≥4.5:1 on white) | 400 (WCAG AA on #0d1117) |
| Subtle tinted backgrounds | 50 | 950 |
| Borders, decorative fills | 100–200 | 700–800 |
| Mid-tone accents | 500 | 500 |
| Darkest text on colored bg | 900 | — |

### Step 3: Use CSS tokens (not raw hex)

| Token | Light mode | Dark mode | OKLCH |
|-------|------------|-----------|-------|
| `--visual-error` | #ee0028 | #ec7069 | Pareto-optimal, H:25° |
| `--visual-warning` | #a76900 | #cd8c37 | Gamut-clipped C=0.125, H:70° |
| `--visual-success` | #00894d | #48b475 | C=0.137, H:155° |
| `--visual-cyan` | #008485 | #00b2b2 | Gamut-clipped C=0.095, H:195° |
| `--visual-indigo` | #307ac0 | #53a0ec | C=0.13, H:250° |
| `--visual-violet` | #736cc3 | #938eeb | C=0.13, H:285° |
| `--visual-magenta` | #9d5fab | #c07ecf | C=0.13, H:320° |
| `--visual-neutral` | #666666 | #9b9b9b | Achromatic |
| `--visual-lime` | → `--visual-success` | → `--visual-success` | Alias — removed from spectrum |
| `--visual-rose` | → `--visual-neutral` | → `--visual-neutral` | Alias — removed from spectrum |

**Chroma normalization:** Categorical hues (indigo, violet, magenta) are capped at C=0.13 to
enforce visual equal-standing. The previous Pareto-optimal approach produced violet/magenta at
C≈0.29 — three times louder than cyan (C=0.095). The 1.37× residual variation is physical gamut
limits at constrained hue angles (cyan, warning). Error retains Pareto-optimal for its semantic
role as a high-arousal danger signal.

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

Apply `--font-display` to `h1`, `h2`. Apply `--font-body` to body. Monaspace faces share identical metrics — mix freely.

### OpenType Features

Apply to all Monaspace containers:

```css
font-feature-settings: var(--font-mono-features);
```

- `calt` ON — Texture healing for even visual density across the monospace grid.
- `liga` OFF — Prevents ambiguous ligatures. Opt in per-context via stylistic sets (`ss01`–`ss10`), never globally.

### Typographic Voice Selection

Color encodes *category*. Typeface encodes *speaker*. These axes are orthogonal — a keyword can be Krypton *and* cyan; a comment can be Radon *and* muted gray.

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

Voice faces: monospace only. Max 2 per block. Radon is scarce — not for emphasis. Fallback: `var(--font-mono)` → `monospace`.

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

## Content Composition

### Page Reading Flow

Content follows a single-column vertical flow. Block elements (figures, code blocks, admonitions) interrupt the prose column and span its full width.

| Transition | Spacing | Token |
|-----------|---------|-------|
| Paragraph → paragraph | 16px | `--space-2` |
| Paragraph → block element | 32px | `--space-4` |
| Block element → paragraph | 32px | `--space-4` |
| Block element → block element | 24px | `--space-3` |
| Section heading → first element | 16px | `--space-2` |
| Last element → section heading | 64px | `--space-6` |

Apply `max-width: 66ch` to prose containers. Block elements (figures, code blocks) may extend to the content column's full width but do NOT exceed it.

Do NOT place a figure before its first textual reference. Instead, the figure appears immediately after the paragraph that introduces it.

### Figure Integration

Use semantic `<figure>` and `<figcaption>` for all visual block elements — diagrams, screenshots, illustrations, and annotated code.

```html
<figure>
  <!-- SVG diagram, image, or code block -->
  <figcaption>Figure 4.3 — Context window token allocation across three agent turns.</figcaption>
</figure>
```

| Property | Value |
|----------|-------|
| Caption font | `--text-sm` (13px) |
| Caption color | `--text-muted` |
| Caption spacing | `--space-1` above caption |
| Figure margin | `--space-4` top and bottom |
| Numbering | Optional, section-based: `Figure {section}.{n} —` |

| Figure Type | Width | Alignment |
|------------|-------|-----------|
| Diagram (SVG) | 100% of content column | Centered via `margin-inline: auto` |
| Screenshot | Intrinsic, max 100% | Centered |
| Inline icon pair | Intrinsic | Inline with text |

Do NOT use figures without captions. Every `<figure>` must contain a `<figcaption>` that describes the content.

Do NOT use `<img>` directly for diagrams or illustrations. Instead, wrap in `<figure>` with a descriptive caption.

### Progressive Disclosure

| Pattern | Primitive | Use When |
|---------|-----------|----------|
| Collapsible depth | `<details>` / `<summary>` | Optional deep-dive, implementation detail, proof, or derivation |
| Parallel alternatives | `<Tabs>` | Multiple equivalent approaches (languages, frameworks, OS) |
| Semantic alert | Admonition (`:::type`) | Contextual warnings, tips, or prerequisites that interrupt flow |

| Question | If Yes → |
|----------|----------|
| Is this content required to understand the main argument? | Keep inline — do NOT hide it |
| Does the reader choose one of N equivalent paths? | `<Tabs>` |
| Is this a tangent that only some readers need? | `<details>` |
| Does this interrupt flow with a warning, tip, or prerequisite? | Admonition |

Do NOT hide critical content behind `<details>`. Instead, keep essential information in the primary prose flow.

Do NOT nest disclosure patterns. A `<details>` inside a `<Tabs>` panel (or vice versa) adds cognitive overhead. Instead, flatten the structure.

### Content Block Hierarchy

Content occupies three tiers; tiers 1–2 must be self-sufficient.

| Tier | Elements | Role |
|------|----------|------|
| 1 — Primary | Prose paragraphs, headings, inline code | Core argument and explanation |
| 2 — Secondary | Figures, code blocks, tables | Evidence, demonstration, specification |
| 3 — Tertiary | Admonitions, `<details>`, footnotes | Supplementary context, caveats, deep-dives |

Do NOT place essential information exclusively in tier 3. Instead, state the key point in tier 1 prose, then elaborate in tier 3 if needed.

Do NOT exceed 3 consecutive block elements (tier 2 or 3) without intervening prose. Instead, add a bridging sentence that connects the blocks to the argument.

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

### Admonitions

Docusaurus admonition types map to the semantic hue palette and use the Callout Borders pattern (3px left border + colored label).

| Admonition | Hue | Token | Label Color |
|-----------|-----|-------|-------------|
| `:::tip` | Cyan (H:195°) | `--visual-cyan` | `var(--visual-cyan)` |
| `:::info` | Indigo (H:250°) | `--visual-indigo` | `var(--visual-indigo)` |
| `:::note` | Neutral | `--visual-neutral` | `var(--visual-neutral)` |
| `:::caution` | Warning (H:70°) | `--visual-warning` | `var(--visual-warning)` |
| `:::danger` | Error (H:25°) | `--visual-error` | `var(--visual-error)` |

Body text inside admonitions stays `--text-body`. Only the label and left border carry the semantic color.

Do NOT apply background tints to admonitions. Instead, use `--surface-raised` for the container background, matching the flat construction constraint.

---

## Illustration System

Curved forms (Smooth Circuit) are default. Angular forms (Terminal Geometry) reserved for high-arousal states. See `ILLUSTRATION_GUIDE.md`.

### Actor Primitives

All actor primitives share a bounding-box grid for visual equal-standing.

#### Bounding Box Grid

| Primitive | Emoji Ref | Bounding Box | Semantic Color |
|-----------|-----------|--------------|----------------|
| `OperatorNode` | 🧑‍💻 | 40×40 (primary) / 32×32 (worker) | Neutral (`--visual-neutral`) |
| `AgentNode` | 🤖 | 40×40 (primary) / 32×32 (worker) | Original emoji palette (hardcoded) |

All coordinates in `ActorNodes.tsx` are annotated: `// Computed via scripts/compute-actor-coords.js`.

#### Size Encoding

Hierarchy is expressed through **size only**, never through color.

| Role | BB Size | Use |
|------|---------|-----|
| Primary / orchestrator | 40×40 | Top of hierarchy, one per level |
| Worker / delegate | 32×32 | Bottom of hierarchy, multiple parallel |

Do NOT distinguish orchestrator from worker agents by color. Use 40→32 size differential only.
Do NOT place primary and worker actors in the same horizontal row without applying the size step.

#### Construction

**OperatorNode** — Smooth Circuit head, Terminal Geometry legs:
- Head circle: `r = BB × 0.15`. Fill `--visual-bg-neutral`, stroke `--visual-neutral` 2px.
- Shoulder U-path: Smooth Circuit (`stroke-linecap="round"` `stroke-linejoin="round"`). Span = BB × 0.90, corner radius = BB × 0.10.
- Legs: two lines (Terminal Geometry, `stroke-linecap="square"`) spreading to BB base.

**AgentNode** — Original Google Noto 🤖 emoji (`/img/emoji/u1f916.svg`):
- Delegates to `NotoEmoji` component with `codepoint="1f916"`.
- Gradient ID isolation is automatic; SVG `<image>` renders as a separate document.

**NotoEmoji** — Generic wrapper for any Noto emoji:
- `<NotoEmoji codepoint="1f4a1" x={...} y={...} size={40} />` renders `/img/emoji/u1f4a1.svg`.
- Add new emojis via `node scripts/fetch-emoji.js <codepoint>` — caches raw in `scripts/.noto-cache/`, writes cleaned SVG to `website/static/img/emoji/u{cp}.svg`.

#### Animated Emoji: `NotoEmoji` vs Hand-Coded Components

Use **`NotoEmoji`** (via `<image>`) for static emoji nodes. The SVG renders as an opaque sub-document — individual paths inside it are not accessible to the parent SVG's CSS or SMIL, so per-path animation is impossible.

Use a **hand-coded component** (e.g. `AuthorWaveNode`) when the emoji needs animation. Inline the paths directly into the parent SVG so CSS transforms and `className` can target individual elements. Obtain source paths from the Noto SVG (via `scripts/fetch-emoji.js`); simplify fills to flat colors (no gradients) and omit any paths not visible at the target size.

#### Emoji Node Rendering

ALL `NotoEmoji` instances render **bare** — no background `<rect>`, no filled container, no exceptions.

- The emoji IS the node. Its bounding box IS the hit area.
- Do NOT wrap `NotoEmoji` in a colored `<rect>`, `<circle>`, or any other filled shape.
- Do NOT add squircle or pill containers behind emoji nodes — those are structural region shapes (see Shape Selection Procedure).

#### Ghost Placeholders

Ghost placeholders provide spatial mass before a node enters, preserving layout balance (per the "every act-state must be visually complete" rule).

- **Construction:** dashed-stroke rect (`strokeDasharray="3 4"`, `strokeWidth={1}`), semantic background fill (`--visual-bg-{hue}`), semantic stroke (`--visual-{hue}`).
- **Size:** matches the emoji's bounding box (or the head portion for actor primitives with body geometry).
- **Lifecycle:** `ghostShown` → visible while node is pending; `ghostHidden` → `opacity: 0` when node enters.
- The ghost is the ONLY rect. The settled node is a bare emoji with no background shape.

#### Communication Medium

> **Note:** `PromptCard` was renamed to `PromptIcon`. `TravelingPromptCard` is its animated variant — used for delegation-flow motion along an edge path; not a separate primitive.

Every edge connecting actor nodes carries either:
- A `PromptIcon` artifact (36×20 centered prompt card, used in delegation flows), or
- A plain Bezier arc with arrowhead (for return flow / result propagation).

Do NOT use other metaphors (looms, punch cards, pipes) for prompt artifacts.

---

### Shape Vocabulary

| Family | Forms | Superellipse n | Default For |
|--------|-------|----------------|-------------|
| Smooth Circuit | Squircle containers, Bezier connectors, circular endpoints, round caps | n = 3–4 (squircle), n = 2 (circle) | Positive-valence: success, AI, system, knowledge, progress |
| Terminal Geometry | Diamond accents, chevron arrows, angular miters, bracket syntax | n = 1–1.5 (diamond), 45° angles | High-arousal: error, warning, code structure, human action |

Do NOT use strict-rectangle-only construction (90° routing, sharp corners on all containers). Instead, use squircle containers (n=3–4) even for box-like elements.

Do NOT apply angular containers (diamonds, sharp-cornered shapes) to success, AI, or system content. Instead, use squircle or circular containers for positive-valence elements.

### Shape Selection Procedure

Smooth Circuit for all hues except Error and Warning (Terminal Geometry).

#### Step 1: Select container shape

| Content Type | Container | SVG Implementation |
|-------------|-----------|-------------------|
| System node / module | Squircle | `<rect rx="10">` (40px box) or superellipse `<path>` |
| Agent / AI process region | Circle or pill | `<circle>` or `<rect rx="50%">` |
| Data / knowledge | Rounded rect | `<rect rx="8">` |
| Human actor region | Circle or squircle | `<circle>` or `<rect rx="10">` |
| Generic container | Squircle | `<rect rx="10">` to `<rect rx="14">` |
| Code / terminal | Diamond or sharp rect | `<polygon>` (4-point) or `<rect rx="2">` |
| Error state | Sharp rect or diamond | `<rect rx="2">` or `<polygon>` |
| Warning state | Triangle or diamond | `<polygon>` (3-point up) |

> **Note:** These containers describe **structural regions and grouping shapes** — not per-node backgrounds. Emoji icon nodes always render bare (see Actor Primitives → Emoji Node Rendering). `AgentNode` is a bare 🤖 emoji, not a circle container; "Agent / AI process region" refers to a panel or zone grouping multiple agent nodes.

#### Step 3: Choose connector style

| Connection Type | Connector | SVG Implementation |
|----------------|-----------|-------------------|
| Data flow (happy path) | Bezier curve | `<path d="M… C…">` with `stroke-linecap="round"` |
| Error / rejection path | Angular polyline | `<polyline>` with `stroke-linecap="square"` |
| Bidirectional | Bezier with markers at both ends | `marker-start` + `marker-end` |
| Optional / dashed | Bezier with dash array | `stroke-dasharray="6 4"` |

### Stroke Weight Scale

| Token | Value | Purpose |
|-------|-------|---------|
| `--stroke-fine` | 1px | Grid lines, hairlines, decorative rules |
| `--stroke-light` | 1.5px | Secondary connectors, annotations |
| `--stroke-default` | 2px | Standard connectors, internal details |
| `--stroke-medium` | 2.5px | Container outlines, primary shapes |
| `--stroke-heavy` | 3px | Emphasized elements, primary flow arrows |
| `--stroke-accent` | 4px | Semantic accent strokes (1 per diagram max) |

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

### Icon Tiers

| Tier | Canvas / viewBox | Style | Use |
|------|-----------------|-------|-----|
| UI icon | `0 0 24 24` | Outline stroke (`currentColor`) | Inline text, buttons, nav, phase indicators |
| Illustration icon | `0 0 128 128` | Flat filled (Noto emoji style) | Bullet icons, feature cards, hero callouts |

Both tiers share `--icon-*` size tokens for rendered width/height. The viewBox is fixed per tier; scaling is via `width`/`height` attributes.

### Icon Sizes

| Token | Value | Purpose |
|-------|-------|---------|
| `--icon-sm` | 16px | Inline text icons |
| `--icon-md` | 24px | Default UI icons |
| `--icon-lg` | 32px | Card/callout icons |
| `--icon-xl` | 48px | Diagram node icons |
| `--icon-2xl` | 64px | Hero/feature icons |

Do NOT create icons at arbitrary sizes. Instead, use `--icon-*` tokens.

### UI Icon Construction

| Property | Value |
|----------|-------|
| `fill` | `none` (outline style) |
| `stroke` | `currentColor` |
| `stroke-width` | `2` (at 24px canvas) |
| `stroke-linecap` | `round` (Smooth Circuit) or `square` (Terminal Geometry) |
| `stroke-linejoin` | `round` (Smooth Circuit) or `miter` (Terminal Geometry) |

### Illustration Icon Construction

Illustration icons follow a Noto Color Emoji–inspired flat construction standard. All 128×128 viewBox icons must comply. This section applies to *custom* illustration icons — emoji representations (fetched, inlined, or recreated from Noto) are exempt per constraint #4.

#### Core Principles

1. **Flat fills only** — solid color shapes. No tonal gradation within the same structural part.
2. **Layered silhouette** — 3–5 overlapping filled shapes that read as a bold silhouette at 32px.
3. **Geometric simplicity** — minimize path points; prefer arcs and clean curves over organic detail.
4. **Achromatic structure + chromatic accent** — neutral fills for structure, `currentColor` for the one semantic layer.

#### Fill Budget

Maximum 4 distinct fill values per icon:

| Slot | Fill | Neutral shade | Role |
|------|------|---------------|------|
| Body | hardcoded hex | neutral-600 (`#666666`) | Primary structural mass |
| Detail | hardcoded hex | neutral-900 (`#2b2b2b`) | Dark accents, internal features |
| Secondary | hardcoded hex | neutral-300 (`#b7b7b7`) | Secondary body, bezels, minor marks |
| Accent | `currentColor` | inherited from parent | Semantic tint (solid or `opacity="0.15"` wash) |

Slot usage: Body + Accent are required. Detail and Secondary are optional. Total ≤ 4.

#### Accent Layer

- Every illustration icon MUST have ≥1 element with `fill="currentColor"`.
- Two permitted opacity values: `1` (solid accent) and `0.15` (tinted wash). No other opacities.
- Do NOT hardcode semantic hex colors (e.g., `#ad3735`). Use `currentColor` so the parent assigns meaning via `--visual-*`.
- Structural fills must be opaque. A path that serves as backdrop for other visible elements (e.g., a clock face behind tick marks) must use a neutral hex fill, not a `currentColor` wash. Reserve `opacity="0.15"` washes for overlay accents that layer on top of opaque structure (e.g., a tinted face layered over a `#666666` body).

#### Banned Techniques

- Highlight fills (lighter neutral on darker to simulate reflection)
- Shadow ridge fills (darker neutral alongside structural neutral to simulate depth)
- Multiple tonal layers on the same part (e.g., neutral-100 + -300 + -500 + -600 on one object)
- SVG filters, gradients, or opacity shading on neutral fills
- neutral-50 (`#f5f5f5`), neutral-100 (`#e8e8e8`), neutral-400 (`#9b9b9b`), neutral-500 (`#808080`) as fill colors — these exist only for 3D simulation

### Diagram Sizing

| Diagram Type | ViewBox Width | Typical Height |
|-------------|--------------|---------------|
| Inline icon pair | 100–200 | 48–64px |
| Flow diagram | 400–600 | 160–240px |
| System diagram | 500–1000 | 300–500px |
| Comparison (side-by-side) | 600–1000 | 200–400px |
| Figure caption | Same as parent figure | `--text-sm` line-height (24px) |

All diagram containers use `width: 100%` with SVG `viewBox` controlling aspect ratio. Do NOT set fixed pixel widths on diagram containers.

### Diagram Accessibility

Every SVG diagram requires:

1. `role="img"` on the `<svg>` element
2. `aria-label` describing the diagram's content and relationships
3. Semantic color paired with a non-color indicator (shape difference, label text, or pattern)

Do NOT rely on color alone to distinguish diagram elements. Instead, combine color + shape + label.

---

## Motion System

Generated from `ANIMATION_GUIDE.md` Phase 2 (agent-executed math). Brand profile: productive style, medium arousal, medium pleasure. Do NOT override computed values. Re-run `ANIMATION_GUIDE.md` scripts if brand PAD profile changes.

### Brand Motion Profile

| PAD Axis | Level | Motion consequence |
|----------|-------|--------------------|
| Pleasure | Medium | Productive curves; slight warmth on diagram reveals |
| Arousal | Low–Medium | Moderate duration (150–240ms); 80ms stagger |
| Dominance | Medium | Ease-out settle; no spring bounce on standard UI |

**Motion style:** Productive. Expressive curves reserved for actor diagram reveals only — never for UI chrome, buttons, or tables.

### Motion Tokens

```css
/* Duration */
--duration-instant:       70ms;   /* toggle, checkbox — at perception floor */
--duration-fast:         110ms;   /* opacity/color, badge update */
--duration-subtle:       150ms;   /* node entrance, icon swap */
--duration-moderate:     240ms;   /* connector draw, widget reveal */
--duration-deliberate:   400ms;   /* large panel, full-section reveal */
--duration-ambient:      700ms;   /* background overlay — not user-triggered */

/* Exit variants (×0.75 per NNGroup asymmetry rule) */
--duration-fast-exit:     80ms;
--duration-subtle-exit:  110ms;
--duration-moderate-exit: 180ms;
--duration-deliberate-exit: 300ms;

/* Easing — productive style */
--ease-enter:    cubic-bezier(0.00, 0.00, 0.38, 0.9); /* entrance: decelerate to rest */
--ease-exit:     cubic-bezier(0.20, 0.00, 1.00, 0.9); /* exit: accelerate away */
--ease-standard: cubic-bezier(0.20, 0.00, 0.38, 0.9); /* reposition within viewport */
--ease-linear:   linear;                               /* spinners, progress bars only */

/* Stagger */
--motion-stagger-sm:  60ms;  /* 5–8 items */
--motion-stagger-md:  80ms;  /* 3–4 items */
--motion-stagger-lg: 100ms;  /* 2 items */

/* Reveal offsets */
--motion-reveal-y-scroll:  12px;   /* scroll-reveal: elements rise into viewport */
--motion-reveal-y-load:    -8px;   /* page-load: elements settle downward */
--motion-reveal-scale:     0.96;   /* modal/dialog only — never for lists */
```

Do NOT use the CSS `ease` keyword. Use `--ease-*` tokens exclusively.
Do NOT animate `width`, `height`, `left`, `top`, `margin`, or `padding`. Use `opacity` and `transform` only.

### Figure Animation Grammar

Five archetypes. Each has a fixed animation grammar. Do NOT mix grammars.

| Archetype | Trigger | Acts | Entrance | Idle | Budget |
|-----------|---------|------|----------|------|--------|
| **Actor diagram** | scroll phase 0→1 | 4–6 phase-gated | `fadeIn + translateY(12px)` per node at `--duration-subtle`; connectors draw via `stroke-dashoffset` at `--duration-moderate` | cursor-blink / status-pulse / ready-breathe per act | ≤1000ms story |
| **Data viz** | scroll phase 0→1 | 2–3 | Containers simultaneous; connectors draw last | flow-drift (optional) | ≤600ms |
| **Interactive widget** | scroll reveal (IO) | 1 | Unit `fadeIn + translateY(12px)` at `--duration-moderate` | none — user-driven | ≤300ms |
| **Data table** | scroll reveal (IO) | 1 | Row stagger at `--motion-stagger-sm` (60ms/row) | `ping-once` on badges at row entry | ≤500ms |
| **Sticky narrative** | chapter ID | N | Chapter transition at `--duration-subtle`; exit at `--duration-subtle-exit` | per-chapter idle | chapter-driven |

**Entrance keyframe (shared by all archetypes):**

```css
@keyframes actEnter {
  from { opacity: 0; transform: translateY(var(--motion-reveal-y-scroll)); }
  to   { opacity: 1; transform: translateY(0); }
}
/* apply: animation: actEnter --duration-subtle --ease-enter both; */
```

**Connector draw-on:**

```css
/* set stroke-dasharray = stroke-dashoffset = el.getTotalLength() via JS on mount */
@keyframes drawPath { to { stroke-dashoffset: 0; } }
/* apply: animation: drawPath --duration-moderate --ease-enter both; */
```

### Act System

An **act** is a discrete visual state of a figure. Acts advance monotonically as scroll phase increases — never reverse.

```
phase 0→1  (from ScrollDrivenFigure context, or chapter ID from NarrativeFigure)
    │
    ▼
useActs(actDefs, phase) → { wasReached(id), isCurrentAct(id) }
    │
    ├── wasReached(id)    → element visible, settled appearance
    ├── isCurrentAct(id)  → apply idle class
    └── !wasReached(id)   → opacity: 0; pointer-events: none
```

Each `ActDef`: `{ id: string, threshold: number }` where threshold is 0–1 (phase-driven) or a chapter ID string (narrative-driven).

**Do NOT** put act logic in CSS `animation-delay` chains. Use `useActs` + conditional class names. CSS modules define entrance keyframes; the hook controls when they fire.

**Every act-state must be a visually complete, balanced composition.** Elements that arrive in later acts must have placeholder mass (ghost geometry, neutral fill) in earlier acts to preserve spatial balance. A diagram that looks broken at any act boundary violates this rule.

### Idle Micro-animation Vocabulary

All idle classes defined once in `custom.css`. Do NOT define idle keyframes per-component.

| Class | Motion | Loop | Semantic use |
|-------|--------|------|-------------|
| `.idle-cursor-blink` | `opacity 1→0→1` step-end | 1000ms | Active authoring (prompt artifact during composing act) |
| `.idle-status-pulse` | `opacity 1→0.5→1` ease-in-out | 2000ms | AI processing; connector during transit |
| `.idle-flow-drift` | `translateX 0→2px→0` ease-in-out | 3000ms | Data moving through a channel |
| `.idle-ready-breathe` | `scale 1→1.02→1` ease-in-out | 4000ms | Agent idle; system ready |
| `.ping-once` | `scale 1→1.4; opacity 1→0` ease-out | 400ms, 1× | One-shot attention on act entry |
| `.idle-arm-rock` | `rotate 0→-4°→0` ease-in-out | 5000ms | Human authoring; developer working |
| `.idle-palm-wave` | `rotate 0→±18°→0` ease-in-out | 5000ms | Greeting; interaction acknowledgement |
| `.idle-gear-spin` | `rotate 0→360°` linear | 2500ms | Mechanical processing; LLM inference engine |

Rules:
- Max **2 idle loops** simultaneously per figure. `cursor-blink` and `status-pulse` never together.
- `ping-once` is exempt (transient; `animation-iteration-count: 1`).
- Remove idle classes via `useActs` when the act advances — do NOT let them run in settled state.

### Stagger Order Rules

| Content | Order |
|---------|-------|
| Actor diagram nodes | Data-flow order (source → sink) |
| Connector drawing | After both connected nodes are settled |
| Labels / legends | Always last, after the elements they label |
| Data table rows | Top-to-bottom (reading order) |
| Parallel equal-weight grid | Simultaneous — stagger implies false hierarchy |
| Form fields | Top-to-bottom (completion order) |

### Reduced-Motion Contract

`ScrollDrivenFigure` enforces the entire contract at the wrapper level. Diagram components do NOT check `prefers-reduced-motion` directly.

| Condition | Behavior |
|-----------|----------|
| `prefers-reduced-motion: reduce` | `ScrollDrivenFigure` sets `phase=1` on mount; all acts fire instantly; diagrams render in final settled state; idle loop classes removed |
| No JavaScript | Diagrams render in final settled state (SSR default) |
| No CSS scroll-timeline | `IntersectionObserver` fires `phase=1` on first intersection; entrance animations play time-based (correct degradation) |

```css
@media (prefers-reduced-motion: reduce) {
  .idle-cursor-blink, .idle-status-pulse,
  .idle-flow-drift, .idle-ready-breathe, .ping-once,
  .idle-arm-rock, .idle-palm-wave, .idle-gear-spin {
    animation: none !important;
  }
}
```

Do NOT use `animation-duration: 0` — use `0.01ms`. Below 40ms, browsers may not fire `animationend` reliably.

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
