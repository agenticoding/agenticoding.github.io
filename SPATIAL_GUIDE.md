# Spatial Design System Generation Guide for AI Agents

Production spatial system generation using psychophysical shape perception, Gestalt grouping thresholds, Fitts' law motor modeling, modular proportion scales, and PAD-mapped geometric emotion. Designed as agent-executable specification — every formula is code-ready. Domain-agnostic: works for any brand category.

This guide is the spatial counterpart to `COLOR_GUIDE.md`. It takes three inputs — a validated color palette, a chosen typography stack, and a brand emotional profile (target PAD vector) — and produces a complete, validated spatial token system: spacing scale, border radii, line weights, surface hierarchy, proportion ratios, and target sizes.

Two phases: **Spatial Strategy** (human-driven brand geometry decisions grounded in perception science) and **Spatial Engineering** (agent-executable math producing token values). The first phase establishes the geometric personality of the brand. The second phase computes every token from that personality.

**Prerequisite:** Complete COLOR_GUIDE.md Phases 1–3 first. This guide references the PAD emotional model, font-color congruence framework, and three-tier token architecture defined there.

**IMPORTANT: The agent MUST write code to run the math then execute it, NEVER attempt to compute values directly. Strict mathematical adherence!**

---

## Phase 1: Spatial Strategy (Human Judgment)

Before computing spatial tokens, ground the geometric decisions in perception science. The agent assists with research retrieval and PAD alignment checks; the human makes the judgment call on brand geometry.

### Geometric Personality Framework

Color triggers emotional response along Pleasure-Arousal-Dominance. So do spatial properties — but on partially different axes. The table below maps each spatial dimension to its primary PAD axis, based on converging evidence from psychophysics, neuroaesthetics, and HCI research.

| Spatial Property | Primary PAD Axis | Direction | Evidence Strength | Key Source |
|---|---|---|---|---|
| Curvature (border-radius) | Pleasure | Curved ↑, Angular ↓ | Strong (fMRI, cross-cultural, cross-species) | Bar & Neta 2007; Gómez-Puerto et al. 2015 |
| Whitespace amount | Pleasure | More space ↑ | Moderate (+20% comprehension) | Mapletree Studio 2024; Fogg et al. 2003 |
| Border weight | Dominance | Thicker ↑ | Moderate (accessibility audits) | WordPress 5.3 audit 2019 |
| Element size | Dominance | Larger ↑ | Strong (Fitts' law, cross-domain) | Fitts 1954; ISO 9241-411 |
| Spacing density | Arousal | Tighter ↑ | Moderate (cognitive load studies) | NNG 2024 |
| Symmetry | Pleasure | Symmetric ↑ | Strong (EEG, eye-tracking) | Frontiers in Psychology 2016 |
| Asymmetry | Arousal | Asymmetric ↑ | Moderate | Frontiers in Human Neuroscience 2015 |
| Proportion (golden ratio) | Pleasure | Closer to φ ↑ | Moderate (aesthetic-usability effect) | Tractinsky et al. 2000 |
| Surface luminance stepping | Dominance | Greater step ↑ | Moderate | Material Design elevation studies |

**Critical insight:** Color saturation is the dominant arousal lever (η² = .693, Wilms & Oberfeld 2018). Font weight is the dominant dominance lever (see COLOR_GUIDE.md). Curvature is the dominant *spatial* pleasure lever. These three axes are partially orthogonal — they combine multiplicatively, not additively. Bold text + high chroma + angular geometry = maximum arousal AND dominance AND low pleasure (urgent, commanding, aggressive). Light text + medium chroma + curved geometry = moderate arousal, low dominance, high pleasure (friendly, approachable, warm).

### Curvature Preference: The Evidence Base

The human preference for curved over angular contours is one of the most replicated findings in visual perception. It is not a design opinion — it is a measured neural response.

**Source:** Gómez-Puerto, G., Munar, E., & Nadal, M. (2015). "Preference for curvature: A historical and conceptual framework." *Frontiers in Human Neuroscience*, 9:712. Comprehensive review spanning decades of curvature research.

Key experimental findings, chronologically:

| Study | Sample | Finding |
|---|---|---|
| Fantz & Miranda 1975 | 1-week-old neonates | Longer fixation on curved vs. sharp contour forms |
| Lundholm 1921 | Adults | Curved lines perceived as "gentle, quiet"; sharp lines as "agitating, hard, furious" |
| Poffenberger & Barrows 1924 | Adults | Confirmed Lundholm's affective associations |
| Bar & Neta 2006, *Psychological Science* | Adults | Curved stimuli liked more than angular even at 84ms exposure (subliminal threshold) |
| Bar & Neta 2007, *Neuropsychologia* | Adults (fMRI) | Sharp contours activate amygdala bilaterally; curved do not. Sharp = neural threat signal |
| Quinn et al. 1997 | 3–4 month infants | Curvature preference facilitates Gestalt organization |
| Leder et al. 2011, *Perception* | Adults | Curvature preference only significant when object has positive/neutral valence |
| Silvia & Barona 2009 | Adults | Non-experts prefer circles to hexagons; expertise moderates effect |
| Gómez-Puerto et al. 2013 | Rural Ghana | Curvature preference confirmed cross-culturally in non-Western population |
| Munar et al. 2015 | Non-human primates | Curvature preference observed across species |
| Vartanian et al. 2013 | Adults | Curved interior architectural spaces subjectively preferred |
| UXPA Journal 2024 | N=187 (between-subjects) | Rounded app corners → higher aesthetics (M=4.63/7, α=.89), warmth (M=5.25/7, α=.83), ease of use, satisfaction, and prosocial behavior |

**Critical moderator (Leder et al. 2011):** Curvature preference disappears when the object carries negative semantic valence. This means curvature is not a universal "make it better" lever — it works when the content supports a positive or neutral emotional frame. Error states, destructive actions, and danger signals are semantically negative. Applying high curvature to negative-valence UI elements is incongruent and may reduce perceived severity.

### Shape × Emotion Associations

**Sources:** Lundholm (1921); Aronoff et al. (1992); Larson et al. (2007); Uher (1991).

| Contour Type | Emotional Association | Neural Basis |
|---|---|---|
| Smooth curves | Gentle, quiet, safe, affiliative, happy | No amygdala activation; fluent processing |
| Wavy lines | Affiliative adjectives (Uher 1991) | Low spatial frequency, easy to parse |
| Sharp angles | Agitating, hard, furious, threatening | Bilateral amygdala activation (Bar & Neta 2007) |
| Zigzag lines | Antagonistic adjectives (Uher 1991) | High spatial frequency, effortful processing |
| V-shapes | Anger (Aronoff et al. 1992; Larson et al. 2007) | Threat geometry (eyebrow configuration) |
| Rounded shapes | Happiness (Larson et al. 2007) | Approach motivation |

**Processing fluency explanation:** Curves are preferred partly because they are computationally cheaper for the visual system. Smooth contours have lower spatial frequency — the visual cortex encodes them more economically, leading to faster mental rotation and improved visual search performance (Frontiers in Computer Science, 2024). Fluent processing → positive affect (the "beauty-in-averageness" / processing fluency pathway).

### Context-Dependent Shape Meaning

Like color emotion (Elliot & Maier 2012, Color-in-Context Theory), shape emotion is context-dependent:

| Context | Angular = | Curved = | Source |
|---|---|---|---|
| Service environment (crowded) | Competence → higher satisfaction | — | Ohio State, news.osu.edu |
| Service environment (uncrowded) | — | Friendliness → higher satisfaction | Ohio State, news.osu.edu |
| Consumer power state: high | Preferred (competence signal) | — | Frontiers in Psychology 2021 |
| Consumer power state: low | — | Preferred (warmth signal) | Frontiers in Psychology 2021 |
| Professional/institutional setting | Structure, efficiency | Too casual | Architizer 2024 |
| Consumer/personal setting | Cold, impersonal | Inviting, warm | Architizer 2024 |

**Implication for agents:** The optimal curvature is not fixed — it depends on the brand's target PAD profile, the audience power state, and the interaction context. The agent should compute curvature values that match the brand's target emotional profile, not default to maximum curvature.

### Flat vs. Elevated Surfaces

**Sources:** Interaction Design Foundation, Material Design documentation; Smashing Magazine (2017), "Using shadows and blur effects in UI design"; Kota.co.uk (2024), "The texture of trust."

Flat design (no shadows, no gradients) and material design (elevation via shadows) represent two strategies for the same goal: communicating interactive hierarchy.

| Strategy | Depth Mechanism | Trust Signal | Risk |
|---|---|---|---|
| Flat | Spacing + border contrast + surface tone | Modernity, premium, clarity | Loss of affordance cues (NNG: unlabeled elements, hidden actions) |
| Flat 2.0 | Subtle tone stepping + border emphasis | Clean but navigable | Requires disciplined surface hierarchy |
| Material | Drop shadows at computed elevation | Physical metaphor → intuitive | Visual noise if overused; complexity budget |

**For flat design systems:** Without shadows, perceived depth is created entirely by **luminance stepping** between surface tiers. This is computable:

```
perceived_elevation = |L_surface − L_page_background|
```

The agent must ensure each surface tier has sufficient luminance difference to be perceptible. The Weber fraction for luminance discrimination is approximately 1–3% for the adapted observer. Surface steps should exceed this threshold.

### Decision Framework

Score each spatial decision against the brand's target PAD vector:

| Dimension | What to Evaluate | Alignment Check |
|---|---|---|
| Curvature profile | Border-radius range across component types | Does curvature match target Pleasure level? |
| Spacing density | Base unit × scale factor | Does density match target Arousal level? |
| Border weight range | Min/max stroke widths | Does weight match target Dominance level? |
| Proportion system | Type scale ratio, layout ratios | Does scale contrast match hierarchy needs? |
| Surface hierarchy | Number of tiers, luminance stepping | Does depth match information architecture? |
| Symmetry strategy | Default symmetric vs. intentional asymmetry | Does layout energy match target Arousal? |
| Target sizing | Touch targets, interactive areas | Do sizes meet accessibility thresholds? |

The human operator evaluates these qualitatively against brand intent. The agent can compute PAD-congruent token values. Once the geometric personality is chosen, everything below is math.

---

## Phase 2: Spatial Engineering (Agent Math)

From this point forward, the agent generates the spatial token system autonomously. The human provides perceptual feedback during validation.

**IMPORTANT: The agent MUST write code to run the math then execute it, NEVER attempt to compute values directly. Strict mathematical adherence!**

## Input: Brand Geometry Table

The only human judgment calls. Everything downstream is computable math.

| Parameter | Value | Rationale |
|---|---|---|
| Target Pleasure | Low / Medium / High | From brand PAD profile |
| Target Arousal | Low / Medium / High | From brand PAD profile |
| Target Dominance | Low / Medium / High | From brand PAD profile |
| Base spacing unit | 4px or 8px | 8px default; 4px for dense data UIs |
| Type scale ratio | 1.125–1.618 | See Proportion System section |
| Base font size | 14–18px | From typography decisions |
| Primary surface strategy | Flat / Flat 2.0 / Elevated | From design philosophy |

## Spacing Scale Generation

### Base Unit Selection

The 8px base unit is the industry-converged standard (Google Material, Apple HIG, IBM Carbon, Shopify Polaris). It works because:

1. **Divisibility:** 8 divides cleanly into common viewport widths (320, 360, 375, 390, 414, 768, 1024, 1440)
2. **Sub-pixel avoidance:** Halving yields 4px → 2px → 1px — all integers on 1×, 2×, and 3× displays
3. **Perceptual stepping:** 8px increments produce visible but not jarring differences at UI scale

Use 4px base for dense UIs (data tables, dashboards, IDE-like interfaces) where finer control is needed. The 4px unit is a half-step within the 8px grid, not a separate system.

### Scale Formula

A modified geometric progression — not pure arithmetic (too uniform at large values) or pure geometric (non-integer values, gaps too large at small end):

```
spacing(step) = base × multiplier[step]

Step:        0    1    2    3    4    5     6     7     8     9     10
Multiplier:  0    1    2    3    4    6     8     10    12    16    20
Value (8px): 0    8    16   24   32   48    64    80    96    128   160
Value (4px): 0    4    8    12   16   24    32    40    48    64    80
```

The multiplier progression: ×1, ×2, ×1.5, ×1.33, ×1.5, ×1.33, ×1.25, ×1.2, ×1.33, ×1.25. This compresses at small values (where absolute pixel differences are perceptible) and expands at large values (where proportional differences matter more).

**Why not pure geometric (e.g., ×1.5 throughout)?** A strict 1.5× scale from 8px yields: 8, 12, 18, 27, 40.5... — non-integer values that cause sub-pixel rendering artifacts. The hybrid approach preserves integer multiples of the base unit while maintaining roughly proportional steps.

### Spacing Density by Brand Arousal

The spacing scale is the same for all brands. What changes is which steps are used for which purposes:

| Target Arousal | Component padding | Section gap | Page margin | Emotional Effect |
|---|---|---|---|---|
| Low (calm) | step 3–4 (24–32px) | step 6–7 (64–80px) | step 8–9 (96–128px) | Generous space → low arousal, high pleasure |
| Medium (balanced) | step 2–3 (16–24px) | step 5–6 (48–64px) | step 7–8 (80–96px) | Moderate density → neutral arousal |
| High (energetic) | step 1–2 (8–16px) | step 4–5 (32–48px) | step 5–6 (48–64px) | Tight density → high arousal, high dominance |

**Quantitative basis:** Generous whitespace around paragraphs increases reading comprehension by up to 20% (cognitive load research synthesized by Mapletree Studio 2024). Grid-based alignment improves usability ratings (Parallel HQ 2026). Tight spacing increases cognitive load but also increases perceived information density and system capability — valued in data-heavy professional contexts (NNG; MASTERCAWEB UX density research).

### Gestalt Proximity Threshold

**Source:** Kubovy, M., & van den Berg, M. (2008). "The whole is equal to the sum of its parts: A probabilistic model of grouping by proximity and similarity in regular patterns." *Psychological Review*. Springer (2017) — Tilt Aftereffect measurement of grouping strength: proximity produces larger perceptual grouping effects than color similarity.

The visual system groups elements by proximity. The critical threshold is a **ratio**, not an absolute value:

```
within_group_spacing < between_group_spacing × 0.5
```

If spacing within a group is less than half the spacing between groups, the visual system reliably perceives grouping. When the ratio approaches 1.0, grouping dissolves; elements are perceived as equidistant and ungrouped.

**Token mapping for proximity-based grouping:**

| Relationship | Spacing Step | Ratio to Within-Group | Example |
|---|---|---|---|
| Tightly related (within component) | step 1 (8px) | 1.0× (baseline) | Label-to-input, icon-to-text |
| Related (within group) | step 2 (16px) | 2.0× | Items in a list, form fields |
| Loosely related (between groups) | step 4–5 (32–48px) | 4–6× | Section to section, card groups |
| Unrelated (between sections) | step 6–8 (64–96px) | 8–12× | Page sections, major content areas |

The ratio between adjacent tiers should be ≥ 2× for the grouping boundary to be perceptible. Ratios below 1.5× create ambiguous grouping.

### Vertical Rhythm

**Source:** Robert Bringhurst, *The Elements of Typographic Style* (2004); Gamma UX (2023), "Types of grids: The evolution toward the 4-point grid system."

All vertical spacing should snap to multiples of the base unit to create a consistent visual rhythm. This is the typographic equivalent of rhythmic regularity in music — predictable patterns reduce cognitive effort.

```
line_height = ceil(font_size × line_height_ratio / base_unit) × base_unit

Example: font_size = 16px, line_height_ratio = 1.5, base_unit = 8px
  raw_value = 16 × 1.5 = 24px
  snapped = ceil(24 / 8) × 8 = 24px ✓

Example: font_size = 14px, line_height_ratio = 1.5, base_unit = 8px
  raw_value = 14 × 1.5 = 21px
  snapped = ceil(21 / 8) × 8 = 24px (rounds up to grid)
```

Snapping ensures that every text block, every component, and every section boundary aligns to the grid. When elements sit on the grid, vertical scanning is effortless. When they drift off-grid, the eye perceives "something is wrong" even without conscious awareness.

**Line-height ratios by context** (these feed into the snapping formula):

| Context | Ratio | Rationale | Source |
|---|---|---|---|
| Body text (Latin) | 1.4–1.6× | Saccade return accuracy | Bringhurst 2004 |
| Body text (CJK, Thai, Devanagari) | 1.6–1.8× | Stroke density + diacritical clearance | COLOR_GUIDE.md Phase 3 |
| Headings (display) | 1.1–1.2× | Tight for visual cohesion at large sizes | Convention |
| Code blocks | 1.3–1.5× | Monospace alignment | Convention |
| Captions, metadata | 1.3–1.4× | Compact but readable | Convention |

## Border Radius System

### Curvature as Computed Emotional Lever

Border radius modulates the curved–angular continuum from Phase 1. The agent computes radius values from the brand's target Pleasure level, the element's semantic role, and the element's size.

**Normalized curvature metric:**

```
curvature_ratio(r, width, height) = r / (min(width, height) / 2)

  0.0 = sharp rectangle (maximum angularity)
  0.0–0.15 = subtle rounding
  0.15–0.35 = moderate rounding
  0.35–0.50 = strong rounding
  0.50 = pill/stadium shape (maximum curvature for non-square rectangle)
  1.0 = circle (square element with r = 50%)
```

### Curvature by Brand Pleasure Target

| Target Pleasure | Default curvature_ratio | Pixel Range (for 40px-tall element) | Emotional Signal |
|---|---|---|---|
| Low (austere) | 0.0–0.05 | 0–1px | Sharp, institutional, authoritative |
| Medium (balanced) | 0.10–0.20 | 2–4px | Professional, approachable, structured |
| High (warm) | 0.25–0.40 | 5–8px | Friendly, inviting, consumer-facing |
| Maximum (playful) | 0.50 | pill | Casual, youthful, high warmth |

### Curvature by Semantic Role

Semantic role overrides brand default when congruence demands it. Error states should be sharper (threat congruence); success states can be rounder (positive valence congruence).

**Source for congruence penalty:** Fox, D., Shaikh, A. D., & Chaparro, B. S. (2007). "Effect of typeface appropriateness on the perception of documents." Measured 22% credibility loss for incongruent typography. The same principle applies to shape-emotion congruence.

| Element Role | Curvature Adjustment | Rationale |
|---|---|---|
| Error/danger states | −50% from default (sharper) | Angular = threat congruent (Bar & Neta 2007) |
| Warning states | −25% from default | Mild threat signal |
| Success/positive states | +25% from default (rounder) | Curved = positive valence congruent (Leder et al. 2011) |
| Neutral/informational | Brand default | No semantic override needed |
| Avatars, user photos | 50% (circle) | Maximum warmth for human representation |
| Input fields | −25% from default | Structure signals "fill this in" |

**Formula:**

```
element_radius(element_role, brand_default_ratio, element_height) =
  let adjustment = semantic_adjustment[element_role]  // -0.5, -0.25, 0, +0.25
  let adjusted_ratio = clamp(brand_default_ratio × (1 + adjustment), 0, 0.5)
  return round(adjusted_ratio × (element_height / 2))
```

### Radius Scale (Token Output)

Rather than computing per-element, generate a radius token scale and assign tokens semantically:

```
radius_scale(brand_pleasure, base_unit) =
  let base_r = base_unit × pleasure_multiplier[brand_pleasure]
  return [0, base_r × 0.5, base_r, base_r × 1.5, base_r × 2, base_r × 3, 9999]

pleasure_multiplier:
  low    = 0.5   → base_r = 4px  (with 8px base unit)
  medium = 1.0   → base_r = 8px
  high   = 1.5   → base_r = 12px
```

**Token naming:**

| Token | Formula | Low Pleasure | Medium Pleasure | High Pleasure |
|---|---|---|---|---|
| `--radius-none` | 0 | 0px | 0px | 0px |
| `--radius-sm` | base_r × 0.5 | 2px | 4px | 6px |
| `--radius-md` | base_r | 4px | 8px | 12px |
| `--radius-lg` | base_r × 1.5 | 6px | 12px | 18px |
| `--radius-xl` | base_r × 2 | 8px | 16px | 24px |
| `--radius-2xl` | base_r × 3 | 12px | 24px | 36px |
| `--radius-full` | 9999px | pill | pill | pill |

## Line Weight System

### Border Weight as Dominance Lever

Line weight operates on the **Dominance** axis — analogous to font weight (see COLOR_GUIDE.md Phase 1 § Font Weight as Independent Emotional Lever). Thicker borders command attention and assert structural authority. Thinner borders recede and defer.

**Source:** WordPress 5.3 accessibility audit (make.wordpress.org, 2019). Documented measurable improvements in element discoverability when borders shifted from `1px solid #ddd` (low contrast, thin) to `1px solid #7e8993` (adequate contrast). The variable is contrast × thickness jointly — a high-contrast 1px border can outweigh a low-contrast 2px border.

| Border Weight | Dominance Level | Perceptual Role | Use |
|---|---|---|---|
| 0px | Lowest | Invisible boundary — relies entirely on spacing/color | Open cards, flush layouts, borderless surfaces |
| 1px | Low | Structural definition without commanding | Default borders, input fields, separators, table rules |
| 2px | Medium | Emphasis — draws attention to boundary | Active/selected states, section breaks, focused inputs |
| 3px | Medium-High | Accent — semantic signal carrier | Callout left-borders, active tab indicators, progress bars |
| 4px+ | High | Maximum structural dominance | Section dividers, hero element boundaries, decorative rules |

### Border Weight × Font Weight Congruence

Line weight and font weight should be congruent on the Dominance axis. Mismatched weight levels create the same perceptual confusion documented for font-color incongruence (Fox et al. 2007, ~22% credibility loss):

| Target Dominance | Font Weight | Border Weight | Curvature | Combined Signal |
|---|---|---|---|---|
| Low (elegant, delicate) | 300–400 | 0–1px | High radius | Approachable, refined, airy |
| Medium (professional) | 400–500 | 1–2px | Medium radius | Balanced, structured, readable |
| High (authoritative) | 600–700 | 2–3px | Low radius | Commanding, institutional, assertive |
| Maximum (impact) | 800–900 | 3–4px | Minimal radius | Bold, urgent, declarative |

### Border Density Budget

**Observation from user research:** Excessive borders ("lines lines lines everywhere") increase cognitive load and decrease pleasure. This parallels the chroma budget concept in COLOR_GUIDE.md Phase 3 (body text C < 0.04) and the cognitive load limits (max 2–3 emphasis colors, max 6–8 categorical colors).

```
borders_per_viewport_section ≤ 4 visible structural lines
```

Beyond approximately 4 visible borders in a single viewport section, perceived density spikes and pleasure drops. Mitigation strategies:
- Use **spacing** (Gestalt proximity) instead of borders when possible
- Use **surface tone changes** (luminance stepping) instead of borders for container definition
- Reserve borders for elements that need explicit boundary definition (inputs, tables, separators)

### Border Contrast Rule

A border's visual weight is contrast × thickness. A 1px border at high contrast (neutral-200 on white = ΔL ~0.04) is less prominent than a 1px border at maximum contrast (neutral-900 on white = ΔL ~0.72) but both are "1px."

```
perceived_border_weight = thickness_px × |L_border − L_background|
```

The agent should compute perceived weight, not just pixel thickness. Token assignment should specify both thickness and color:

| Token | Thickness | Color (Light) | Color (Dark) | Perceived Weight |
|---|---|---|---|---|
| `--border-subtle` | 1px | neutral-200 | neutral-800 | ~0.04 |
| `--border-default` | 1px | neutral-300 | neutral-700 | ~0.10 |
| `--border-emphasis` | 1px | neutral-500 | neutral-500 | ~0.20 |
| `--border-strong` | 2px | neutral-700 | neutral-300 | ~0.72 |
| `--border-accent` | 3px | semantic color | semantic color | Variable (semantic) |

## Surface Hierarchy

### Luminance-Stepped Elevation (Flat Systems)

Without shadows, perceived depth is created exclusively by luminance differences between surface tiers. The agent computes surface luminance values that exceed the perceptual discrimination threshold.

**Perceptual threshold:** The Weber fraction for luminance discrimination is approximately 1–3% for the adapted observer at typical screen luminance (100–300 cd/m²). Surface steps must exceed this threshold to be perceivable.

```
ΔL_minimum = 0.03 (3% Weber fraction — just noticeable)
ΔL_comfortable = 0.04–0.06 (clearly distinct without being jarring)
```

### Surface Tier Formula

Three tiers minimum (page, raised, muted). Each tier's lightness is offset from the page background:

```
Light mode (page L = 1.0):
  surface_raised = L_page − ΔL_step_1        // e.g., 1.0 − 0.04 = 0.96
  surface_muted  = L_page − ΔL_step_1 − ΔL_step_2  // e.g., 0.96 − 0.05 = 0.91

Dark mode (page L = 0.11):
  surface_raised = L_page + ΔL_step_1        // e.g., 0.11 + 0.02 = 0.13
  surface_muted  = L_page + ΔL_step_1 + ΔL_step_2  // e.g., 0.13 + 0.11 = 0.24
```

Dark mode uses smaller initial steps because the Weber fraction increases at low luminance (the visual system is less sensitive to absolute differences in dark ranges). Subsequent steps can be larger.

### Surface Tiers by Brand Dominance

Higher dominance brands use **more contrast between tiers** (bolder surface differentiation). Lower dominance brands use **subtler stepping** (less visual assertiveness):

| Target Dominance | ΔL between tiers (light) | ΔL between tiers (dark) | Emotional Effect |
|---|---|---|---|
| Low | 0.02–0.03 | 0.01–0.02 | Subtle, minimal, premium |
| Medium | 0.04–0.05 | 0.02–0.04 | Clear but not commanding |
| High | 0.06–0.08 | 0.04–0.06 | Bold surface distinction |

### The 60-30-10 Surface Distribution

**Source:** Johannes Itten, *The Art of Color* (1961); applied to UI by Material Design.

The proportion of each surface tier controls visual rhythm and accent impact:

| Proportion | Surface Role | Emotional Effect |
|---|---|---|
| 60% | Page background (dominant surface) | Sets base arousal — low chroma, extreme L = calm |
| 30% | Raised/muted surfaces (secondary) | Creates structure, rhythm, moderate contrast |
| 10% | Accent (semantic color, borders, interactive) | Draws attention — high arousal and dominance |

For content-heavy pages (documentation, articles), use 95/5 — nearly all page background with minimal accent. For diagram-heavy or interactive pages, use 60-30-10. The agent should compute based on content type.

## Proportion System

### Modular Type Scale

**Sources:** Robert Bringhurst, *The Elements of Typographic Style* (2004); Spencer Mortensen's modular scale theory.

A modular scale generates harmonious font sizes from a base size and a ratio. The ratio determines hierarchical contrast — how dramatically headings differ from body text.

```
font_size(step) = base_size × ratio^step
```

**Ratios and their emotional profiles:**

| Ratio | Musical Name | Hierarchy Contrast | Emotional Profile | Best For |
|---|---|---|---|---|
| 1.067 | Minor Second | Minimal | Subtle, dense, bureaucratic | Dense data UIs |
| 1.125 | Major Second | Low | Reserved, professional, understated | Text-heavy apps, documentation |
| 1.200 | Minor Third | Moderate | Balanced, readable, workmanlike | Technical content, body-heavy sites |
| 1.250 | Major Third | Moderate+ | Confident, clear, structured | Docs + marketing hybrid |
| 1.333 | Perfect Fourth | Strong | Authoritative, editorial, dramatic | Magazine layouts, editorial sites |
| 1.414 | Augmented Fourth | Strong+ | Assertive, dynamic, high-contrast | Presentation slides, hero sections |
| 1.500 | Perfect Fifth | High | Bold, declarative, commanding | Marketing landing pages |
| 1.618 | Golden Ratio | Maximum | Monumental, dramatic, display | Display-only typography |

### Scale Ratio × Brand Congruence

The type scale ratio should align with the brand's target PAD profile:

| Target Profile | Congruent Scale | Rationale |
|---|---|---|
| Calm, trust (low A, low D) | 1.125–1.200 | Minimal contrast = low arousal, low dominance |
| Balanced, professional (mid all) | 1.200–1.250 | Moderate contrast = balanced PAD |
| Bold, authoritative (high D) | 1.333–1.500 | Strong contrast = high dominance |
| Playful, energetic (high A, high P) | 1.250–1.333 | Moderate-strong contrast with curvature |

### Font Size Output

Given base_size and ratio, generate the scale:

```
for step in [-2, -1, 0, 1, 2, 3, 4, 5]:
  raw = base_size × ratio^step
  snapped = round(raw)  // integer pixels for sub-pixel avoidance
  line_height = ceil(snapped × lh_ratio / base_unit) × base_unit  // grid snap
```

**Token naming convention:**

| Step | Token | Role |
|---|---|---|
| -2 | `--text-xs` | Fine print, legal, captions |
| -1 | `--text-sm` | Secondary text, metadata |
| 0 | `--text-base` | Body text (base_size) |
| 1 | `--text-lg` | Lead paragraphs, emphasized body |
| 2 | `--text-xl` | h4, subheadings |
| 3 | `--text-2xl` | h3, section headings |
| 4 | `--text-3xl` | h2, major headings |
| 5 | `--text-4xl` | h1, page titles |

### Layout Proportions

**Source:** Interaction Design Foundation, Golden Ratio in design; Kurosu & Kashimura (1995), "Apparent usability vs. inherent usability." *CHI '95*.

The golden ratio (φ = 1.618) and related proportions guide layout division:

```
content_width / sidebar_width ≈ φ  (1.618:1 or ~62%:38%)
```

**The aesthetic-usability effect:** Tractinsky, Katz, & Ikar (2000) replicated Kurosu & Kashimura's finding across cultures — proportionally harmonious layouts are rated as more usable even when functionality is identical. Φ-proportioned layouts benefit from this effect.

**Layout proportion tokens:**

| Ratio | Division | Use |
|---|---|---|
| 1:1 | 50%:50% | Equal-weight comparison layouts |
| φ:1 (1.618:1) | ~62%:38% | Content + sidebar (golden section) |
| 2:1 | ~67%:33% | Content + narrow sidebar |
| 3:1 | 75%:25% | Content-dominant with metadata column |

### Symmetry Strategy

**Source:** Frontiers in Psychology (2016). Comparative eye-tracking study on symmetric pattern perception. Symmetric designs increase fixation duration (longer engagement) and score higher on pleasantness. Asymmetric layouts increase arousal (dynamic tension).

| Target Arousal | Layout Strategy | Effect |
|---|---|---|
| Low (calm, orderly) | Symmetric (centered, equal columns) | High pleasure, low arousal |
| Medium (balanced) | Mostly symmetric with focal asymmetry | Moderate arousal, focused attention |
| High (dynamic, energetic) | Intentional asymmetry (off-center, unequal columns) | High arousal, tension |

**Default:** Symmetric grid. Use asymmetry only for intentional emphasis — e.g., off-center hero text, asymmetric content:sidebar ratios, staggered card layouts.

## Target Size & Interactive Geometry

### Fitts' Law

**Source:** Fitts, P. M. (1954). "The information capacity of the human motor system in controlling the amplitude of movement." *Journal of Experimental Psychology*, 47(6), 381–391.

```
MT = a + b × log₂(2D/W + 1)

MT = movement time (ms)
D  = distance from current pointer position to target center
W  = target width along movement axis
a  = intercept constant (device-dependent, ~50ms for mouse)
b  = slope constant (device-dependent, ~150ms for mouse)
```

The logarithmic relationship means: doubling target size yields diminishing returns. The largest gains come from making small targets bigger. Once targets exceed ~48px, further size increases provide minimal speed improvement.

### Minimum Target Sizes (Converged Standards)

| Standard | Minimum Size | Physical Size | Context |
|---|---|---|---|
| WCAG 2.2 SC 2.5.8 (AA) | 24 × 24 CSS px | ~6.4mm | Absolute minimum for compliance |
| WCAG 2.1 SC 2.5.5 (AAA) | 44 × 44 CSS px | ~11.7mm | Recommended for accessible interfaces |
| Apple iOS HIG | 44 × 44 pt (~59px) | ~11.7mm | Apple ecosystem |
| Android Material | 48 × 48 dp | ~9mm (finger pad) | Android ecosystem |
| NNG recommendation | — | 10 × 10mm | Universal physical size |
| Apple Vision Pro | 60 × 60 pt (~80px) | — | Spatial computing (eye-tracking) |

**Minimum spacing between adjacent targets:** 8px (Android guideline). This prevents adjacent-tap errors and provides visual separation per Gestalt proximity.

### Size Hierarchy Rule

Interactive elements should have a size hierarchy that matches their importance:

```
primary_action_height ≥ secondary_action_height × 1.25
secondary_action_height ≥ tertiary_action_height × 1.15
```

This creates a natural visual weight hierarchy driven by Fitts' law (larger = faster to acquire = more important) without relying on color differentiation.

**Token output:**

| Token | Height | Padding (horizontal) | Use |
|---|---|---|---|
| `--target-sm` | 32px | step 2 (16px) | Tertiary actions, inline buttons, tags |
| `--target-md` | 40px | step 3 (24px) | Secondary actions, form inputs |
| `--target-lg` | 48px | step 4 (32px) | Primary actions, main CTAs |
| `--target-xl` | 56px | step 5 (48px) | Hero CTAs, prominent actions |

### Content Width & Line Length

**Source:** Bringhurst (2004); WCAG SC 1.4.8. See also COLOR_GUIDE.md Phase 3 § Typography Layout and Color Fatigue.

```
Optimal line length: 45–75 characters (66 ideal for Latin script)
Implementation: max-width: 66ch on text containers
CJK: max-width: 40ch (WCAG SC 1.4.8)
```

The `ch` unit is relative to the width of the "0" glyph in the current font. This automatically adapts line length to font choice.

**Color fatigue interaction (from COLOR_GUIDE.md):** High contrast + long lines (>75ch) increases saccade fatigue. If line length exceeds 75ch and cannot be reduced, reduce contrast target from |Lc| 90 to |Lc| 80 for body text.

## Congruence Validation

### Three-Axis Alignment Check

Every design decision should be congruent across all three perceptual axes: color, typography, and spatial geometry. The agent should validate alignment after generating all tokens:

```
For each UI component:
  color_PAD   = PAD vector from color properties (hue, chroma, lightness)
  type_PAD    = PAD vector from typography properties (weight, classification, size)
  spatial_PAD = PAD vector from spatial properties (radius, spacing, border weight, size)

  congruence_check:
    |color_PAD.pleasure − spatial_PAD.pleasure| ≤ 1 tier  // e.g., both "medium" or adjacent
    |type_PAD.dominance − spatial_PAD.dominance| ≤ 1 tier
    |color_PAD.arousal − spatial_PAD.arousal| ≤ 1 tier
```

### Congruence Examples

| Target Emotion | Color | Typography | Spatial | Congruent? |
|---|---|---|---|---|
| Calm Trust | Low chroma, cool hue | 400 weight, humanist sans | 8–12px radius, generous spacing, 1px borders | Yes — all low A, low D, high P |
| Calm Trust | Low chroma, cool hue | 400 weight, humanist sans | 0px radius, tight spacing, 3px borders | **No** — spatial signals high D, high A |
| Urgent Authority | High chroma, warm hue | 700 weight, geometric sans | 0–4px radius, tight spacing, 2–3px borders | Yes — all high A, high D |
| Urgent Authority | High chroma, warm hue | 700 weight, geometric sans | 16px radius, generous spacing, 0px borders | **No** — spatial signals high P, low D |
| Friendly Innovation | Med chroma, cyan/green | 400–500, humanist sans | 12–16px radius, moderate spacing, 1px | Yes — balanced A, high P |
| Technical Precision | Low chroma, neutral | 400, monospace + geometric | 4–6px radius, grid-even spacing, 1px | Yes — low A, med D, med P |
| Premium Elegance | Low chroma, deep hue | 300 weight, didone serif | 0–2px radius, very generous spacing, 0–1px | Yes — low A, low D, high P |

### Incongruence Red Flags

Flag and report these mismatches to the human operator:

- High curvature (pill buttons) + heavy font weight (800+) → spatial says "warm," type says "commanding"
- Generous whitespace + high chroma accent overuse → spatial says "calm," color says "urgent"
- Angular geometry (0px radius) + light font weight (300) → spatial says "institutional," type says "delicate"
- Tight spacing + low information density → arousal signal without content to justify it (wasted tension)
- Multiple surface tiers + minimal content per tier → dominance signal without hierarchy to communicate

## Validation Checklist

For every generated spatial system, verify:

**Spacing:**
- [ ] Spacing scale generated with all steps as integer multiples of base unit
- [ ] All spacing values are whole pixels (no sub-pixel rendering)
- [ ] Within-group spacing < between-group spacing × 0.5 (Gestalt proximity threshold)
- [ ] Component padding and section gaps assigned from appropriate scale steps
- [ ] Vertical rhythm: all line-heights snap to base unit multiples

**Border radius:**
- [ ] Radius scale generated from brand pleasure target
- [ ] Semantic role adjustments applied (error sharper, success rounder)
- [ ] No radius exceeds min(width, height) / 2 for any element
- [ ] Radius tokens named and mapped to component roles

**Line weight:**
- [ ] Border weight range matches brand dominance target
- [ ] Border weight congruent with font weight selection (±1 dominance tier)
- [ ] Border density ≤ 4 structural lines per viewport section
- [ ] All borders have sufficient contrast: perceived_weight > 0.03
- [ ] Border color tokens paired with thickness tokens

**Surfaces:**
- [ ] Luminance step between adjacent tiers ≥ Weber fraction minimum (ΔL ≥ 0.03 light, ≥ 0.01 dark)
- [ ] Surface distribution follows 60-30-10 (or 95-5 for content pages)
- [ ] Dark mode surface values computed (not copied from light mode)
- [ ] No pure black (#000000) backgrounds; no pure white (#ffffff) body text on dark

**Proportions:**
- [ ] Type scale ratio selected and congruent with brand PAD profile
- [ ] Font sizes generated, rounded to integers, with grid-snapped line-heights
- [ ] Layout proportions defined (content:sidebar ratios)
- [ ] Content containers have max-width set (66ch Latin, 40ch CJK)

**Target sizes:**
- [ ] All interactive elements ≥ 24×24 CSS px (WCAG 2.2 AA minimum)
- [ ] Primary actions ≥ 44×44 CSS px (WCAG AAA target)
- [ ] Adjacent interactive elements have ≥ 8px gap
- [ ] Size hierarchy: primary > secondary × 1.25

**Congruence:**
- [ ] Spatial PAD vector within ±1 tier of color PAD vector on all dimensions
- [ ] Spatial PAD vector within ±1 tier of typography PAD vector on all dimensions
- [ ] No red flags from incongruence check
- [ ] Semantic role overrides documented and justified

---

## References

### Shape & Curvature Perception
- **Bar, M., & Neta, M.** — "Humans prefer curved visual objects" (*Psychological Science*, 2006, 17(8), 645–648). Curved stimuli preferred even at 84ms subliminal exposure.
- **Bar, M., & Neta, M.** — "Visual elements of subjective preference modulate amygdala activation" (*Neuropsychologia*, 2007, 45(10), 2191–2200). fMRI: sharp contours activate amygdala bilaterally; curved do not.
- **Gómez-Puerto, G., Munar, E., & Nadal, M.** — "Preference for curvature: A historical and conceptual framework" (*Frontiers in Human Neuroscience*, 2015, 9:712). Comprehensive review of curvature preference across ages, cultures, species.
- **Leder, H., Tinio, P. P., & Bar, M.** — "Emotional valence modulates the preference for curved objects" (*Perception*, 2011, 40(6), 649–655). Curvature preference only significant for positive/neutral valence objects.
- **Silvia, P. J., & Barona, C. M.** — "Do people prefer curved objects? Angularity, expertise, and aesthetic preference" (*Empirical Studies of the Arts*, 2009, 27(1), 25–42). Expertise moderates curvature preference.
- **Bertamini, M., Palumbo, L., Gheorghes, T. N., & Galatsidas, M.** — "Do observers like curvature or do they dislike angularity?" (*British Journal of Psychology*, 2015). Approach/avoidance behavioral measurement of curvature preference.
- **Fantz, R. L., & Miranda, S. B.** — "Newborn infant attention to form of contour" (*Child Development*, 1975). Neonates fixate longer on curved contours.
- **Lundholm, H.** — "The affective tone of lines" (*Psychological Review*, 1921). Curved = gentle/quiet; angular = agitating/hard/furious.
- **Aronoff, J., Barclay, A. M., & Stevenson, L. A.** — "The recognition of threatening facial stimuli" (*Journal of Personality and Social Psychology*, 1992). V-shapes → anger association.
- **Larson, C. L., Aronoff, J., & Stearns, J. J.** — "The shape of threat: Simple geometric forms evoke rapid and sustained capture of attention" (*Emotion*, 2007). Angular → anger; rounded → happiness.
- **Uher, J.** — (1991). On zigzag lines: antagonistic adjectives. On wavy lines: affiliative adjectives.
- **UXPA Journal** — "Rounded aesthetic beauty and warmth" (2024). N=187, between-subjects. Rounded corners → higher aesthetics, warmth, ease of use, satisfaction.
- **Ohio State University** — "Curves or angles: Shapes in businesses affect customer response" (news.osu.edu). Context-dependent shape preference: angular = competence in crowded settings; curved = warmth in uncrowded settings.
- **Frontiers in Psychology** — "The matching effect of consumer power state and shape preference" (2021). High-power consumers prefer angular; low-power prefer rounded.

### Spacing, Grid & Proximity
- **Kubovy, M., & van den Berg, M.** — "The whole is equal to the sum of its parts: A probabilistic model of grouping by proximity and similarity in regular patterns" (*Psychological Review*, 2008). Mathematical model of proximity-based grouping.
- **Springer** — "Objective measurement of Gestalts using Tilt Aftereffect" (*Behavior Research Methods*, 2017). Proximity produces larger TAE (stronger grouping) than color similarity.
- **Wagemans, J., et al.** — "A century of Gestalt psychology in visual perception" (*Psychological Bulletin*, 2012, 138(6), 1172–1217). Comprehensive review of Gestalt principles.
- **Bringhurst, R.** — *The Elements of Typographic Style* (Hartley & Marks, 2004). Modular scales, vertical rhythm, line length (45–75 characters).
- **Gamma UX** — "Types of grids: The evolution toward the 4-point grid system" (2023). 4pt and 8pt grid systems, baseline alignment.
- **Mapletree Studio** — "The Psychology Behind Clean Website Design" (2024). Whitespace increases comprehension up to 20%.
- **Parallel HQ** — "Improving Visual Hierarchy" (2026). Grid-based alignment improves usability ratings.
- **MASTERCAWEB** — "Minimalism versus density in UI and UX" (Université de Strasbourg). Cultural factors: density signals capability in East Asian markets; minimalism signals premium in Western markets.
- **Nielsen Norman Group** — "4 Principles to Reduce Cognitive Load" (2024). Single-column layouts outperform multi-column for form completion.

### Proportion & Visual Balance
- **Kurosu, M., & Kashimura, K.** — "Apparent usability vs. inherent usability" (*CHI '95 Conference Companion*, 1995). Aesthetically proportioned interfaces rated more usable.
- **Tractinsky, N., Katz, A. S., & Ikar, D.** — "What is beautiful is usable" (*Interacting with Computers*, 2000, 13(2), 127–145). Cross-cultural replication of aesthetic-usability effect.
- **Itten, J.** — *The Art of Color* (Reinhold Publishing, 1961). 60-30-10 proportion rule.
- **Frontiers in Psychology** — "Visual perception of symmetric patterns in humans and orangutans" (2016). Eye-tracking: symmetric patterns increase fixation duration.
- **Frontiers in Human Neuroscience** — "Visual saliency and pictorial balance in photographic cropping" (2015). Saliency center-of-mass closer to geometrical center in preferred compositions.

### Target Size & Motor Performance
- **Fitts, P. M.** — "The information capacity of the human motor system in controlling the amplitude of movement" (*Journal of Experimental Psychology*, 1954, 47(6), 381–391). Foundational motor performance model.
- **ISO 9241-411** — Ergonomics of human-system interaction: Evaluation methods for the design of physical input devices.
- **WCAG 2.2 SC 2.5.8** — Target Size (Minimum): 24 × 24 CSS pixels (AA level).
- **WCAG 2.1 SC 2.5.5** — Target Size: 44 × 44 CSS pixels (AAA level).
- **Apple Human Interface Guidelines** — 44 × 44 pt minimum for iOS; 60 × 60 pt for visionOS.
- **Android Material Design** — 48 × 48 dp minimum touch target; 8dp spacing between targets.
- **Nielsen Norman Group** — "Touch targets on touchscreens" (2019). 10 × 10mm recommended physical size.
- **Lindgaard, G., Fernandes, G., Dudek, C., & Brown, J.** — "Attention web designers: You have 50 milliseconds to make a good first impression!" (*Behaviour & Information Technology*, 2006, 25(2), 115–126). First impressions formed in ~50ms, dominated by visual design.
- **Fogg, B. J., et al.** — Stanford Web Credibility Research (2003). N=2,684: design rated more important than any other feature for credibility.

### Visual Weight & Hierarchy
- **Fox, D., Shaikh, A. D., & Chaparro, B. S.** — "Effect of typeface appropriateness on the perception of documents" (2007). 22% credibility loss for incongruent typography. Applicable to shape-emotion congruence.
- **WordPress Core** — "Noteworthy admin CSS changes in WordPress 5.3" (make.wordpress.org, 2019). Border contrast improvements for accessibility.
- **Smashing Magazine** — "Using shadows and blur effects in UI design" (2017). Elevation via shadows for interactive hierarchy.
- **Interaction Design Foundation** — Material Design documentation. Elevation, z-axis, and shadow computation.
- **Kota.co.uk** — "The texture of trust: How visual tactility sells online" (2024). Flat vs. elevated design trust perception.

### Color Emotion (Cross-Referenced from COLOR_GUIDE.md)
- **Wilms, L., & Oberfeld, D.** — "Color and emotion" (*Psychological Research*, 2018). Saturation: dominant arousal lever (η² = .693).
- **Elliot, A. J., & Maier, M. A.** — "Color-in-context theory" (*Advances in Experimental Social Psychology*, 2012). Context modulates color emotion.
- **Valdez, P., & Mehrabian, A.** — "Effects of color on emotions" (*J. Experimental Psychology: General*, 1994). Brightness → pleasure; saturation → arousal.

### Cognitive Load & Information Processing
- **SHIFT eLearning** — Color schemes amplify learning by 55–78%; cognitive overload from too many bright colors degrades comprehension.
- **Nature Scientific Reports** — "Optimizing waiting experience" (2025). Quantitative study: interface element density × animated indicators affect emotional experience and time perception.
