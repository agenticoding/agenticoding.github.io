# Animation System Generation Guide for AI Agents

Production animation system generation using perceptual timing research, easing curve psychophysics, spring mechanics, PAD-mapped motion personality, and meaningful storytelling idle composition. Designed as agent-executable specification — every formula is code-ready. Calibrated for this project's specific design system, illustration vocabulary, and emotional targets.

**Project authority:** `DESIGN_SYSTEM.md` is authoritative for Agentic Coding visual rules. This guide supplies motion rationale and generated values; any generic guidance here is overridden by the design system's hierarchy, shape, color, and static-completeness guardrails.

This guide is the motion counterpart to `COLOR_GUIDE.md` (color science, palette engineering), `SPATIAL_GUIDE.md` (spacing, curvature, proportions), and `ILLUSTRATION_GUIDE.md` (shape grammar, diagram construction). It takes three inputs — the validated color palette, spatial token system, and brand PAD emotional profile — and produces a complete, validated animation system: duration tokens, easing curves, spring presets, stagger algorithms, reveal sequences, semantic idle loops, and legacy scroll-exception rules.

Two phases: **Motion Strategy** (human-driven brand personality decisions grounded in perception science) and **Motion Engineering** (agent-executable math producing token values). The first phase establishes the kinetic personality of the brand. The second phase computes every token from that personality.

**Prerequisite:** Complete `COLOR_GUIDE.md` Phases 1–3, `SPATIAL_GUIDE.md` Phases 1–2, and `ILLUSTRATION_GUIDE.md` Phases 1–4 first. This guide references the PAD emotional model, shape vocabulary, spatial token architecture, and semantic hue roles defined there.

**IMPORTANT: The agent MUST write code to run the math then execute it, NEVER attempt to compute values directly. Strict mathematical adherence!**

---

## Perceptual Timing Theory

The foundation for all animation token values. These thresholds are the most empirically robust numbers in HCI — grounded in two landmark papers (Miller 1968; Card, Robertson & Mackinlay 1991) and replicated across five decades of usability research.

### Human Perception Time Constants

| Threshold                     | Value                 | Perceptual Meaning                                                                      | Source                                    |
| ----------------------------- | --------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| Motion perception floor       | ~40 ms                | Below this, motion registers as a jump cut. No transition perceived.                    | Physiological: rod photoreceptor response |
| Instantaneous perception      | ≤ 100 ms              | System feels like a direct extension of user action. Causal link preserved.             | Miller (1968); Nielsen (1993)             |
| Action–feedback causal window | 100 ms                | Any animation triggered by user action **must begin** within 100 ms or causality breaks | Miller (1968) via NNGroup                 |
| Human visual perception cycle | ~230 ms               | Model Human Processor average perceptual cycle. Below this, sequential events merge.    | Card, Moran & Newell (1983)               |
| Animation fatigue onset       | ≥ 500 ms              | Anything longer than 400–500 ms is a net negative for user-triggered UI motion          | NNGroup usability observations            |
| Flow-of-thought disruption    | > 1,000 ms            | User feels "waited on." Mental task model breaks. Progress indicator required.          | Miller (1968); Nielsen (1993)             |
| Frame rate ceiling            | 60 Hz (16.7 ms/frame) | Humans cannot reliably perceive differences above 60 fps                                | Physiological: flicker fusion             |

**Critical insight:** The 100 ms threshold applies to when animation _begins_, not when it ends. An animation with a `200ms animation-delay` before it starts creates a 200 ms blank gap that reads as system latency, not intentional design. The first frame of motion must appear within 100 ms of the triggering event.

### Enter vs. Exit Asymmetry

NNGroup documents a consistent directional asymmetry: elements entering the screen should animate ~25% longer than elements exiting. The asymmetry reflects the user's mental state:

- **Enter (25% longer):** The user is waiting for content to appear. A slightly longer entrance feels considered.
- **Exit (25% shorter):** The user has already acted to dismiss. A fast exit feels responsive.

```
exit_duration = round(enter_duration × 0.75)
```

This rule applies to all enter/exit pairs: modals, drawers, dropdowns, tooltips, and scroll-reveal elements.

### Perceived Performance Effects

**Study (Nebraska-Lincoln, cited by NNGroup):** Users who saw a continuous moving progress bar were willing to wait **3× longer** than users who saw nothing. Satisfaction was higher even when objective wait time was identical.

**NNGroup slideshow case study:** A widget that took 8 seconds to download received only **1%** of eye-tracking attention when users waited. Users who saw the completed version immediately spent **20%** of their time in that area. Conclusion: animation that substitutes for content is severely penalized. Animation that accompanies content arrival is beneficial.

**Operative rule:** Reveal animations are beneficial to perceived performance only when they begin _as content arrives_ (paint-time), not after it. Stagger sequences must complete within the first paint window (< 500 ms from first paint).

---

## Phase 1: Motion Strategy (Human Judgment)

Before computing animation tokens, ground the motion decisions in PAD-congruent personality. The agent assists with PAD alignment checks; the human makes the judgment call on brand kinetic personality.

### Kinetic Personality Framework

Animation operates on all three PAD axes simultaneously:

| Motion Property     | Primary PAD Axis | Direction                                                       | Research Basis                               |
| ------------------- | ---------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Duration (speed)    | Arousal          | Faster ↑ Arousal; Slower ↓ Arousal                              | NNGroup timing research; Card et al. 1983    |
| Easing curve type   | Pleasure         | Expressive (bouncy) ↑ Pleasure; Productive (precise) ↓ Pleasure | IBM Carbon expressive/productive distinction |
| Translate distance  | Arousal          | Larger offset ↑ Arousal                                         | Practitioner convergence (Valhead, Comeau)   |
| Spring bounce       | Pleasure         | Higher bounce ↑ Pleasure                                        | Apple WWDC 2023 spring animation principles  |
| Stagger spread      | Arousal          | Tighter stagger ↑ Arousal (compressed reveal)                   | Card/Moran/Newell perception cycle threshold |
| Animation direction | —                | Semantic only — matches spatial content model                   | NNGroup directionality research              |
| Scale amplitude     | Arousal          | Larger scale range ↑ Arousal                                    | Practitioner observation                     |

### Motion Style: Productive vs. Expressive

IBM Carbon (the most precisely specified open design system) formalizes two motion styles. The distinction maps directly to brand PAD target:

| Style          | Easing Character               | Duration Bias       | PAD Target     | Appropriate For                          |
| -------------- | ------------------------------ | ------------------- | -------------- | ---------------------------------------- |
| **Productive** | Sharp ease-out, precise settle | Shorter (50–300 ms) | Low A, Med D   | Task UIs, technical tools, documentation |
| **Expressive** | Broader arc, more dramatic     | Longer (200–500 ms) | High P, High A | Marketing, onboarding, consumer apps     |

**Design rule:** Select one style as the system default. Use the other sparingly — at most 1–2 "expressive moments" per page (hero entrance, primary CTA activation). Mixing styles without a hierarchy creates visual incoherence.

### Kinetic Personality by Brand PAD Profile

| Target PAD                            | Duration Bias         | Stagger   | Easing                 | Spring Bounce | Translate |
| ------------------------------------- | --------------------- | --------- | ---------------------- | ------------- | --------- |
| Low A, Low D, High P (calm, warm)     | Longer (200–350 ms)   | 80–100 ms | Expressive entrance    | 0.10–0.15     | 8–12px    |
| Low A, Med D (technical, precise)     | Moderate (150–250 ms) | 60–80 ms  | Productive entrance    | 0.0           | 8px       |
| Med A, Med D (balanced, professional) | Moderate (200–300 ms) | 70–90 ms  | Productive standard    | 0.0–0.10      | 8–12px    |
| High A, High D (energetic, urgent)    | Shorter (100–200 ms)  | 40–60 ms  | Productive exit-biased | 0.0           | 4–8px     |

### Input: Brand Motion Profile

The only human judgment calls. Everything downstream is computable math.

| Parameter             | Value                              | Rationale                               |
| --------------------- | ---------------------------------- | --------------------------------------- |
| Target Pleasure       | Low / Medium / High                | From brand PAD profile                  |
| Target Arousal        | Low / Medium / High                | From brand PAD profile                  |
| Target Dominance      | Low / Medium / High                | From brand PAD profile                  |
| Motion style          | Productive / Expressive / Hybrid   | From brand context (task vs. marketing) |
| Default entrance type | Fade-translate / Fade-only / Scale | From content type and diagram density   |

---

## Phase 2: Motion Engineering (Agent Math)

From this point forward, the agent generates the animation token system autonomously. The human provides perceptual feedback during validation.

**IMPORTANT: The agent MUST write code to run the math then execute it, NEVER attempt to compute values directly. Strict mathematical adherence!**

### Duration Token Generation

#### Base Duration Formula

```python
def compute_duration_tokens(arousal_level: str) -> dict:
    """
    Generate duration tokens from brand arousal target.

    arousal_level: 'low' | 'medium' | 'high'

    Anchored to IBM Carbon's duration system (fast-01 through slow-02)
    with arousal-based scaling.

    Research basis:
    - 70ms floor: IBM Carbon fast-01 (toggle/button state)
    - 400ms ceiling: NNGroup animation ceiling for user-triggered transitions
    - 700ms ambient: IBM Carbon slow-02 (background overlay only)
    """

    # Base values from IBM Carbon, validated against NNGroup thresholds
    BASE_TOKENS = {
        'instant':    70,   # toggle, checkbox, button state — at perception floor
        'fast':      110,   # opacity/color — no spatial displacement
        'subtle':    150,   # small spatial move (<= 16px), icon swap
        'moderate':  240,   # modal, drawer, dropdown, notification
        'deliberate': 400,  # large panel, hero entrance, full-section reveal
        'ambient':   700,   # background overlay, dimming — not user-triggered
    }

    # Arousal scaling: lower arousal = slightly longer (more deliberate)
    # Upper-bounded so we never exceed 500ms for user-triggered actions
    AROUSAL_SCALE = {
        'low':    1.15,  # calm, deliberate — extend by 15%
        'medium': 1.00,  # balanced — no adjustment
        'high':   0.85,  # energetic — compress by 15%
    }

    scale = AROUSAL_SCALE[arousal_level]
    tokens = {}

    for name, base_ms in BASE_TOKENS.items():
        if name == 'ambient':
            # Ambient is always fixed — not user-triggered
            tokens[name] = base_ms
        else:
            raw = base_ms * scale
            # Round to nearest 10ms for legibility
            tokens[name] = round(raw / 10) * 10
            # Enforce perception floor: never below 40ms
            tokens[name] = max(40, tokens[name])
            # Enforce user-trigger ceiling: never above 500ms
            if name != 'deliberate':
                tokens[name] = min(500, tokens[name])

    # Compute exit variants (75% of enter duration per NNGroup asymmetry rule)
    for name in list(tokens.keys()):
        if name not in ('instant', 'ambient'):
            exit_ms = round(tokens[name] * 0.75 / 10) * 10
            tokens[f'{name}_exit'] = max(40, exit_ms)

    return tokens

# Example execution for medium arousal (technical documentation brand):
# tokens = compute_duration_tokens('medium')
# Output:
# instant: 70ms (exit: n/a — state changes have no exit)
# fast: 110ms (exit: 80ms)
# subtle: 150ms (exit: 110ms)
# moderate: 240ms (exit: 180ms)
# deliberate: 400ms (exit: 300ms)
# ambient: 700ms (exit: n/a — ambient is always fade, no exit)
```

#### Duration Token CSS Output

```css
/* Animation duration tokens
   Generated from: compute_duration_tokens(arousal_level)
   Research: IBM Carbon duration scale; NNGroup 100–500ms window; Miller (1968) */

--duration-instant: 70ms; /* toggle, checkbox, button state */
--duration-fast: 110ms; /* opacity/color, badge update */
--duration-subtle: 150ms; /* small spatial move, icon swap */
--duration-moderate: 240ms; /* modal, drawer, dropdown */
--duration-deliberate: 400ms; /* large panel, hero, section reveal */
--duration-ambient: 700ms; /* background overlay only — not user-triggered */

/* Exit variants — 75% of enter (NNGroup asymmetry rule) */
--duration-fast-exit: 80ms;
--duration-subtle-exit: 110ms;
--duration-moderate-exit: 180ms;
--duration-deliberate-exit: 300ms;
```

---

### Easing Curve Generation

#### Easing Semantics

All design system authorities converge on three mandatory custom curves. The CSS default `ease` keyword must NOT be used — it is tuned for neither enter nor exit and produces a sluggish feeling. Use `cubic-bezier()` always.

| Direction                    | Curve Behavior          | Semantic Role                                               |
| ---------------------------- | ----------------------- | ----------------------------------------------------------- |
| **Enter (ease-out)**         | Fast start, slow finish | Elements arriving — decelerate to rest naturally            |
| **Exit (ease-in)**           | Slow start, fast finish | Elements departing — accelerate, feel intentionally leaving |
| **Reposition (ease-in-out)** | Slow–fast–slow          | Elements traversing from visible A to visible B             |
| **Linear**                   | Constant velocity       | Spinners, progress bars, video scrubbing only               |

**Polaris (Shopify) principle:** "A snappy animation starts rapidly and slows down toward the end." This describes ease-out as the default for most UI motion — content decelerates into its final position so it becomes readable as quickly as possible.

#### Easing Curve Formula

```python
def compute_easing_tokens(motion_style: str, pleasure_level: str) -> dict:
    """
    Generate cubic-bezier easing tokens.

    motion_style: 'productive' | 'expressive'
    pleasure_level: 'low' | 'medium' | 'high'

    Productive curves: sharper arcs, tighter control points — task focus
    Expressive curves: broader arcs, more dramatic deceleration — emotional moments

    Source: IBM Carbon easing system; validated against Material Design M3 easing
    """

    CURVES = {
        'productive': {
            # IBM Carbon productive style
            'enter':     (0.00, 0.00, 0.38, 0.9),  # steep entry, long ease-out tail
            'exit':      (0.20, 0.00, 1.00, 0.9),  # slow start, sharp acceleration out
            'standard':  (0.20, 0.00, 0.38, 0.9),  # within-viewport repositioning
        },
        'expressive': {
            # IBM Carbon expressive style — broader arc, more dramatic
            'enter':     (0.00, 0.00, 0.30, 1.0),  # very fast entry, long ease-out
            'exit':      (0.40, 0.14, 1.00, 1.0),  # slow start, high-energy exit
            'standard':  (0.40, 0.14, 0.30, 1.0),  # dramatic repositioning
        }
    }

    # Pleasure interpolation: high pleasure → blend toward expressive even in productive systems
    # This adds subtle warmth to the productive curves without full expressive adoption
    curves = CURVES[motion_style].copy()

    if motion_style == 'productive' and pleasure_level == 'high':
        # Soften the productive enter curve slightly toward expressive
        curves['enter'] = (0.00, 0.00, 0.32, 0.95)

    # Material Design M3 equivalents for reference validation
    # enter (ease-out):      cubic-bezier(0.05, 0.7, 0.1, 1.0)  ← M3 standard
    # exit (ease-in):        cubic-bezier(0.3, 0.0, 1.0, 1.0)   ← M3 standard
    # symmetric (ease-in-out): cubic-bezier(0.2, 0.0, 0.0, 1.0) ← M3 standard

    return {
        'enter': f'cubic-bezier{curves["enter"]}',
        'exit':  f'cubic-bezier{curves["exit"]}',
        'standard': f'cubic-bezier{curves["standard"]}',
        'linear': 'linear',
    }

# For productive motion style (technical documentation, medium pleasure):
# enter:    cubic-bezier(0.00, 0.00, 0.38, 0.9)
# exit:     cubic-bezier(0.20, 0.00, 1.00, 0.9)
# standard: cubic-bezier(0.20, 0.00, 0.38, 0.9)
# linear:   linear
```

#### Easing Token CSS Output

```css
/* Easing curve tokens
   Generated from: compute_easing_tokens(motion_style, pleasure_level)
   Research: IBM Carbon productive/expressive system; Shopify Polaris "snappy" principle */

--ease-enter: cubic-bezier(0, 0, 0.38, 0.9); /* entrance: decelerate to rest */
--ease-exit: cubic-bezier(0.2, 0, 1, 0.9); /* exit: accelerate away */
--ease-standard: cubic-bezier(
  0.2,
  0,
  0.38,
  0.9
); /* reposition within viewport */
--ease-linear: linear; /* spinners, progress, video only */
```

---

### Spring Preset Generation

Springs are for gesture-continuation and physics-based interactions only. They maintain velocity continuity: if a user releases a drag at speed, a spring correctly inherits that velocity and continues from it. A `cubic-bezier` animation cannot do this — it always starts from zero velocity.

#### When to Use Springs vs. Cubic-Bezier

| Trigger                              | Use          | Rationale                                          |
| ------------------------------------ | ------------ | -------------------------------------------------- |
| User gesture release (swipe, drag)   | Spring       | Velocity continuity is required                    |
| Button click / toggle / keyboard     | Cubic-bezier | Zero initial velocity; spring adds no value        |
| Multi-property animation via gesture | Spring       | Each property settles naturally at different rates |
| Modal open (no gesture velocity)     | Cubic-bezier | Simpler; predictable duration                      |
| Pull-to-refresh, card flick          | Spring       | Physical continuation of gesture                   |
| Page-load reveal                     | Cubic-bezier | No user velocity to continue                       |

#### Spring Parameter Formula

```python
import math

def compute_spring_presets(pleasure_level: str, arousal_level: str) -> dict:
    """
    Generate spring animation presets from PAD targets.

    Returns parameters for both:
    - Framer Motion / react-spring (stiffness, damping, mass)
    - Apple SwiftUI perceptual model (duration, bounce)

    Research basis:
    - Apple WWDC 2023: bounce=0.0 (critically damped) for standard UI
    - Apple: bounce=0.1-0.2 only for gesture-driven physical continuation
    - Framer Motion snappy: stiffness 300, damping 25 (designer docs)

    Critical damping coefficient: ζ = damping / (2 × sqrt(stiffness × mass))
    ζ = 1.0 → no overshoot (critically damped)
    ζ < 1.0 → underdamped (bouncy)
    ζ > 1.0 → overdamped (sluggish)
    """

    # Apple perceptual bounce by pleasure level
    # bounce=0 = critically damped (pleasure-neutral, precise)
    # bounce>0 = underdamped (warm, playful)
    BOUNCE_BY_PLEASURE = {
        'low':    0.00,   # no overshoot — clinical, precise
        'medium': 0.05,   # barely perceptible tail — hint of warmth
        'high':   0.15,   # gentle follow-through — approachable
    }

    # Duration modifier by arousal (perceptual duration, not hard TTL)
    DURATION_BY_AROUSAL = {
        'low':    350,   # deliberate, calm
        'medium': 280,   # balanced
        'high':   200,   # snappy
    }

    bounce = BOUNCE_BY_PLEASURE[pleasure_level]
    perceptual_duration = DURATION_BY_AROUSAL[arousal_level]

    # Convert to Framer Motion physics parameters
    # stiffness = (2π / period)² × mass, simplified for UI:
    # period ≈ perceptual_duration / 1000 (in seconds)
    # stiffness ≈ (2π / (period * 0.9))² * mass
    mass = 1.0
    period = perceptual_duration / 1000.0 * 0.9  # 0.9 factor: spring settles faster than full period
    stiffness = round((2 * math.pi / period) ** 2 * mass)

    # Damping from bounce level:
    # ζ = 1 - bounce (roughly; Apple's model)
    # damping = 2 × ζ × sqrt(stiffness × mass)
    zeta = max(0.5, 1.0 - bounce)  # floor at 0.5 — never oscillate more than half-cycle in UI
    damping = round(2 * zeta * math.sqrt(stiffness * mass))

    return {
        # Standard spring: no overshoot — for non-gesture UI elements
        'ui': {
            'stiffness': stiffness,
            'damping': damping,
            'mass': mass,
            'apple_duration': perceptual_duration,
            'apple_bounce': bounce,
        },
        # Gesture spring: slight follow-through — for drag-release
        'gesture': {
            'stiffness': round(stiffness * 0.65),  # softer = more travel after release
            'damping': round(damping * 0.48),      # less damping = more oscillation
            'mass': mass,
            'apple_duration': round(perceptual_duration * 1.1),
            'apple_bounce': min(bounce + 0.15, 0.30),  # add follow-through; cap at 0.30
        },
        # Snappy spring: for toggles and confirmations that need physicality
        'snappy': {
            'stiffness': round(stiffness * 1.5),   # stiffer = faster
            'damping': round(damping * 1.1),        # slightly overdamped = no bounce
            'mass': mass,
            'apple_duration': round(perceptual_duration * 0.7),
            'apple_bounce': 0.00,
        },
    }

# Validate critical damping ratio for each preset:
def validate_damping_ratio(stiffness: float, damping: float, mass: float) -> float:
    """Returns ζ — should be >= 1.0 for standard UI, >= 0.7 for gesture springs."""
    return damping / (2 * math.sqrt(stiffness * mass))
```

---

### Stagger Algorithm

#### Cognitive Basis for Stagger

Stagger forces sequential visual scanning by exploiting rod photoreceptor motion sensitivity: each newly appearing element captures attention briefly before the next appears. This creates a directed reading path that would not exist if all elements appeared simultaneously.

**Critical constraint:** The stagger must complete within the human visual perception cycle (230 ms) multiplied by a manageable count. If the total stagger duration exceeds 400–500 ms, the sequence reads as slow loading rather than intentional choreography.

```python
def compute_stagger_parameters(
    item_count: int,
    arousal_level: str,
    total_budget_ms: int = 400
) -> dict:
    """
    Compute stagger delay per item and validate sequence budget.

    item_count: number of items to stagger
    arousal_level: 'low' | 'medium' | 'high'
    total_budget_ms: max total sequence time (default 400ms)

    Research basis:
    - 230ms: Model Human Processor visual perception cycle (Card/Moran/Newell)
    - < 50ms per step: stagger collapses — reads as simultaneous
    - > 100ms per step: reads as loading, not choreography
    - Total cap: 400ms — beyond this, sequence reads as slow

    From perception cycle: if steps > 230ms apart, each reads as fully independent event.
    Sweet spot for readable sequencing: 60–100ms per step.
    """

    # Base delay range by arousal
    DELAY_RANGE = {
        'low':    (80, 100),   # deliberate stagger — reading is part of the experience
        'medium': (60, 80),    # balanced
        'high':   (40, 60),    # compressed — snappy reveal
    }

    min_delay, max_delay = DELAY_RANGE[arousal_level]

    # Budget-constrained delay: scale down if n × delay > budget
    # Use item_count - 1 because first item has delay 0
    effective_count = max(1, item_count - 1)
    budget_per_step = total_budget_ms / effective_count if effective_count > 0 else max_delay

    # Select delay: use max_delay if budget allows, else constrain
    delay = min(max_delay, budget_per_step)
    # Enforce minimum (below 40ms stagger collapses perceptually)
    delay = max(40, delay)
    # Round to nearest 10ms for clean CSS values
    delay = round(delay / 10) * 10

    total_duration = delay * effective_count

    return {
        'delay_per_item': delay,
        'total_sequence_ms': total_duration,
        'within_budget': total_duration <= total_budget_ms,
        # CSS: animation-delay = index × delay_per_item
        'css_pattern': f'animation-delay: calc(var(--stagger-index) * {delay}ms)',
    }

# Practical output table (medium arousal, 400ms budget):
# 2 items: delay = 80ms, total = 80ms  ✓
# 3 items: delay = 80ms, total = 160ms ✓
# 4 items: delay = 80ms, total = 240ms ✓
# 5 items: delay = 80ms, total = 320ms ✓
# 6 items: delay = 80ms, total = 400ms ✓ (at budget)
# 7 items: delay = 70ms, total = 420ms (compressed to fit)
# 10 items: delay = 40ms, total = 360ms (compressed to 40ms floor)
```

#### Stagger CSS Custom Properties Pattern

```css
/* Stagger pattern: set --stagger-index on each child via JS or nth-child */
.stagger-parent > * {
  --stagger-index: 0; /* override per child */
  animation-delay: calc(var(--stagger-index) * var(--motion-stagger));
}

/* Duration tokens (medium arousal, 400ms budget) */
--motion-stagger-sm: 60ms; /* 5+ items */
--motion-stagger-md: 80ms; /* 3–4 items */
--motion-stagger-lg: 100ms; /* 2 items */
```

---

## Reveal Animation System (Page Load)

### Entrance Type Selection

Three canonical entrance patterns, ordered by cognitive overhead:

| Type                               | CSS Properties                       | Cognitive Load | Best For                                                 |
| ---------------------------------- | ------------------------------------ | -------------- | -------------------------------------------------------- |
| **Fade + translate** (recommended) | `opacity`, `transform: translateY()` | Lowest         | All page-load stagger, list reveals, section entrances   |
| **Fade only**                      | `opacity`                            | Lowest         | Content-heavy pages; when spatial context is unambiguous |
| **Scale + fade**                   | `opacity`, `transform: scale()`      | Highest        | Modal/dialog only; single focal element; never for lists |

**Research basis:** Fade + small translate achieves the highest practitioner consensus for page-load context because:

1. The translate provides a subtle directional cue (spatial context) without imposing navigational meaning
2. 8–12px is below the threshold where the brain assigns "this came from outside the viewport"
3. The fade prevents a "pop" artifact that would read as a rendering glitch

**Scale-in at page load:** Never use for lists or sequential stagger. Scaling multiple elements simultaneously reads as chaotic. Reserved for single focal elements (hero, dialog).

### Entrance Motion Formulas

```python
def compute_entrance_motion(
    context: str,         # 'page_load' | 'scroll_reveal' | 'modal' | 'navigation_forward' | 'navigation_back'
    arousal_level: str,   # 'low' | 'medium' | 'high'
) -> dict:
    """
    Compute entrance animation properties by context and brand arousal.

    Direction rules (NNGroup spatial cognition research):
    - page_load: top-to-bottom (elements settle downward — matches F-pattern reading)
    - scroll_reveal: upward translate (elements rise from below — matches scroll direction)
    - modal: scale from center (no spatial origin in reading flow)
    - navigation_forward: left-to-right entry (spatial convention: forward = right)
    - navigation_back: right-to-left entry (spatial convention: back = left)

    Research: Arrows on the right preferred for "forward" (Casasanto & Bottini 2022).
    NNGroup: direction encodes spatial contract — breaking it causes user error.
    """

    # Translate distance by arousal (larger = more energetic, more attention)
    # Practitioner consensus: 8–12px for page-load; 12–16px for scroll-reveal
    # Cap: beyond 20px reads as theatrical / outside-viewport origin
    TRANSLATE_BY_AROUSAL = {
        'low':    12,   # deliberate settle
        'medium':  8,   # standard
        'high':    6,   # minimal — snappy appearance
    }

    translate_px = TRANSLATE_BY_AROUSAL[arousal_level]

    CONTEXTS = {
        'page_load': {
            # Elements settle downward from above: translateY(-px → 0)
            # This is OPPOSITE of scroll reveal (which rises upward)
            # Rationale: page load starts at top, reading order is downward
            'from': f'opacity: 0; transform: translateY(-{translate_px}px)',
            'to':   'opacity: 1; transform: translateY(0)',
            'easing': '--ease-enter',
        },
        'scroll_reveal': {
            # Elements rise upward into viewport: translateY(px → 0)
            # Matches scroll direction — content rises as user scrolls down
            'from': f'opacity: 0; transform: translateY({translate_px + 4}px)',
            'to':   'opacity: 1; transform: translateY(0)',
            'easing': '--ease-enter',
        },
        'modal': {
            # Scale from center — no directional origin
            # 0.96 scale: subtle enough to not feel theatrical
            'from': 'opacity: 0; transform: scale(0.96)',
            'to':   'opacity: 1; transform: scale(1)',
            'easing': '--ease-enter',
        },
        'navigation_forward': {
            # Enter from left (left → right = forward in LTR reading cultures)
            'from': f'opacity: 0; transform: translateX(-{translate_px + 8}px)',
            'to':   'opacity: 1; transform: translateX(0)',
            'easing': '--ease-enter',
        },
        'navigation_back': {
            # Enter from right (right → left = backward)
            'from': f'opacity: 0; transform: translateX({translate_px + 8}px)',
            'to':   'opacity: 1; transform: translateX(0)',
            'easing': '--ease-enter',
        },
    }

    return CONTEXTS[context]
```

### Page Load Reveal: Sequencing Rules

```python
def plan_page_reveal_sequence(sections: list[dict]) -> list[dict]:
    """
    Plan the stagger sequence for a page load reveal.

    Stagger order must encode information hierarchy (NNGroup progressive disclosure):
    "If stagger order does not match information priority, it actively misdirects attention."

    Rules:
    1. First element has delay=0 (no gap between paint and motion start)
    2. Hero/heading animates before body content
    3. Navigation/chrome animates simultaneously with or before hero
    4. Secondary content (sidebar, related links) animates last
    5. Decorative elements (dividers, background shapes) use fastest duration, last delay

    sections: list of dicts with 'role': 'nav' | 'hero' | 'body' | 'secondary' | 'decorative'
    Returns same list with added 'delay_ms' and 'duration_token' fields.
    """

    PRIORITY_ORDER = ['nav', 'hero', 'body', 'secondary', 'decorative']
    STAGGER_MS = 80  # medium arousal default

    # Sort by priority, preserving relative order within same priority
    sorted_sections = sorted(sections, key=lambda s: PRIORITY_ORDER.index(s.get('role', 'body')))

    delay = 0
    for section in sorted_sections:
        section['delay_ms'] = delay
        section['duration_token'] = '--duration-moderate' if section.get('role') == 'hero' else '--duration-subtle'
        delay += STAGGER_MS

    # Validate total sequence is within budget
    total_ms = sorted_sections[-1]['delay_ms'] + 240  # last delay + moderate duration
    assert total_ms <= 800, f"Reveal sequence too long: {total_ms}ms. Compress stagger."

    return sorted_sections
```

### Reveal CSS Keyframe Template

```css
/* Page load reveal — hero entrance */
@keyframes reveal-from-top {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scroll-driven reveal — content rises into view */
@keyframes reveal-from-bottom {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal entrance — scale from center */
@keyframes reveal-modal {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Shared reveal class */
.reveal {
  animation-fill-mode: both; /* hold from-state before start, to-state after end */
  animation-timing-function: var(--ease-enter);
  animation-duration: var(--duration-subtle);
}

.reveal-hero {
  animation-name: reveal-from-top;
  animation-duration: var(--duration-moderate);
}

.reveal-content {
  animation-name: reveal-from-bottom;
  animation-duration: var(--duration-subtle);
}

/* Stagger via custom property */
.stagger-item {
  animation-delay: calc(
    var(--stagger-index, 0) * var(--motion-stagger-md, 80ms)
  );
}
```

---

## Scroll-Driven Animation System

### Scroll Reveal: When to Animate

**Operational rule:** Animate scroll-revealed content only when it is below the fold on first paint. Never animate content that is already visible on page load — this creates the appearance of elements "jumping" after the user has already read them.

**Performance constraint:** Use the CSS `@scroll-timeline` API or `IntersectionObserver` — never `scroll` event listeners, which block the main thread and cause jank.

```python
def compute_scroll_reveal_threshold(
    element_height_px: int,
    viewport_height_px: int = 900,
) -> dict:
    """
    Compute IntersectionObserver threshold for scroll-reveal timing.

    Optimal reveal point: when 20% of the element is visible.
    This gives the animation time to complete before the element
    is fully in view — content is readable at animation end.

    If element is taller than viewport (e.g., full-screen sections),
    reveal on first pixel entering viewport (threshold = 0).
    """

    if element_height_px >= viewport_height_px:
        # Tall element: reveal on first pixel
        threshold = 0.0
        rootMargin = '0px 0px -50px 0px'  # 50px early trigger
    else:
        # Standard element: reveal when 20% is in view
        threshold = 0.1  # 10% visible = trigger (conservative for fast scrollers)
        rootMargin = '0px 0px -80px 0px'  # 80px above bottom = reveal early

    return {
        'threshold': threshold,
        'rootMargin': rootMargin,
        'note': 'Apply reveal-content class on intersection; remove on disconnect for repeat reveals',
    }
```

### Scroll Direction Awareness

Elements that appear on scroll should animate in the direction consistent with scroll motion:

| Scroll Direction  | Element Enters From | Transform Start                       |
| ----------------- | ------------------- | ------------------------------------- |
| Scrolling down    | Below viewport      | `translateY(12px)` → `translateY(0)`  |
| Scrolling up      | Above viewport      | `translateY(-12px)` → `translateY(0)` |
| Horizontal scroll | Right side          | `translateX(12px)` → `translateX(0)`  |

**Research basis:** NNGroup directionality research — direction encodes a spatial contract. An element "rising to meet you" as you scroll down is spatially coherent. An element sliding down-to-up would imply the user is scrolling upward.

### Parallax and Scroll-Linked Motion

Parallax (where elements move at different rates from the scroll) is a high-arousal, high-attention-demand technique. Apply the following constraints:

```python
def compute_parallax_parameters(
    element_role: str,      # 'hero_bg' | 'decorative' | 'content'
    brand_arousal: str,     # 'low' | 'medium' | 'high'
) -> dict:
    """
    Compute parallax scroll rate multiplier.

    Parallax triggers vestibular sensitivity in ~10M Americans (vestibular.org).
    WCAG 2.1 SC 2.3.3 requires prefers-reduced-motion compliance.

    Safe parallax range: 0.05–0.15× scroll rate.
    Beyond 0.20×: motion sickness risk increases substantially.
    Never apply to: content text, interactive elements.
    Only apply to: decorative backgrounds, illustration elements.
    """

    if element_role == 'content':
        # NEVER parallax content — it disrupts reading
        return {'multiplier': 0.0, 'warning': 'Content elements must not use parallax'}

    MAX_MULTIPLIER = {
        'low':    0.05,  # barely perceptible — calm brand
        'medium': 0.10,  # gentle depth — balanced brand
        'high':   0.15,  # noticeable depth — energetic brand (ceiling)
    }

    multiplier = MAX_MULTIPLIER[brand_arousal]

    return {
        'multiplier': multiplier,
        'css': f'transform: translateY(calc(var(--scroll-y) * {multiplier}px))',
        'warning': 'Requires prefers-reduced-motion: reduce override → multiplier: 0',
    }
```

---

## Diagram Animation System

This section specifies how SVG diagram components are animated in this codebase. It consumes the motion tokens defined above; read it in tandem with `DESIGN_SYSTEM.md §Visual Elements`.

### Figure Coherence Principles

Three principles govern all animated figures. Every figure must satisfy all three before any animation is added.

**1. Static Completeness (design target)**
The complete still figure is the primary design artifact. Animation does not reveal the concept and does not create meaning. A reader who disables animation, prints the page, or lands mid-page must still understand the figure. If motion is required for comprehension, the static design has failed.

**2. Semantic Idle Storytelling (default motion model)**
Animation represents an ongoing process inside the complete figure: authoring, inference, retrieval, serialization, tool execution, data flow, validation, or readiness. The loop must answer: what is active, what is flowing, what is transforming, or what is waiting?

**3. Motion Restraint (no dummy loops)**
Idle motion is not liveliness. Delete any loop whose only job is visual energy. Prefer slow, low-amplitude semantic roles that read as one coherent process story.

### Storytelling Idle Animation Contract

Meaningful storytelling idle animation replaces scroll-driven reveal as the default diagram contract.

```
static-complete figure
    │
    ▼
semantic process map → choose coherent idle roles
    │
    ├── active process     → loop while the process is conceptually active
    ├── state change       → optional `ping-once`
    └── reduced motion     → remove loops; keep complete static figure
```

Required motion spec before implementation:

| Field            | Required answer                                                            |
| ---------------- | -------------------------------------------------------------------------- |
| Story loop       | What ongoing process repeats in the concept?                               |
| Semantic meaning | What does each moving element mean?                                        |
| Reader benefit   | What does the motion teach, orient, or confirm?                            |
| Static fallback  | Is the figure complete with all animation disabled?                        |
| Loop coherence   | How do simultaneous idle roles map to process steps and read as one story? |
| Rejection test   | Why is this not decoration?                                                |

If the motion spec cannot be answered in one or two concrete sentences per field, do not animate.

### Legacy ScrollDrivenFigure Exception

`ScrollDrivenFigure`, `useAnimationPhase()`, phase thresholds, act-gated reveal, connector draw-on, and scroll-scrubbed artifact travel are legacy/exception mechanisms. Do not use them as the default for new figures.

Allowed only when:

- the figure specifically teaches scroll, viewport position, or document timeline behavior;
- the same idea cannot be taught with a static-complete figure plus semantic idle loop;
- `prefers-reduced-motion: reduce` renders the canonical static figure immediately;
- an implementation comment names why the scroll exception exists.

For existing legacy figures, keep the accessibility contract: `phase=1` under reduced motion, no concept hidden behind scroll position, and no direct scroll listeners outside the approved wrapper.

### Semantic Loop Selection

Select loops by the process being taught, not by visual preference.

| Process state                | Preferred loop                             | Meaning                                       |
| ---------------------------- | ------------------------------------------ | --------------------------------------------- |
| Human authoring              | `.idle-cursor-blink`, `.idle-arm-rock`     | Intent is being written or operated           |
| LLM inference                | `.idle-inference-cycle`, `.idle-gear-spin` | Context is being transformed into next tokens |
| Retrieval / inspection       | `.idle-eye-read`                           | The system is reading/searching evidence      |
| Context serialization        | `.idle-text-line`, `.idle-flow-drift`      | Observations become next-call context         |
| Tool/model operation pending | `.idle-status-pulse`                       | Work is active but not complete               |
| Data flow                    | `.idle-flow-drift`                         | Information moves through a channel           |
| Validation / completion      | `.ping-once`                               | A state changed or check completed            |
| Ready / waiting              | `.idle-ready-breathe`                      | The system is available for the next input    |

### Figure Entrance: Exception Parameters

`OperatorNode` and `AgentNode` at equivalent size roles use the **same entrance keyframe** with parameters scaled by size role:

| Node type      | Size | Role                   | Duration | Translate              | Easing              |
| -------------- | ---- | ---------------------- | -------- | ---------------------- | ------------------- |
| `OperatorNode` | S=40 | Primary (human)        | 300ms    | `translateY(12px → 0)` | `var(--ease-enter)` |
| `AgentNode`    | S=40 | Primary (orchestrator) | 300ms    | `translateY(12px → 0)` | `var(--ease-enter)` |
| `AgentNode`    | S=32 | Secondary (worker)     | 250ms    | `translateY(8px → 0)`  | `var(--ease-enter)` |
| `OperatorNode` | S=32 | Secondary              | 250ms    | `translateY(8px → 0)`  | `var(--ease-enter)` |

**Semantic symmetry rule:** `OperatorNode` and `AgentNode` at equivalent size roles animate identically. Color (neutral vs. violet) carries the semantic distinction; motion does not layer on additional differentiation.

Canonical keyframe (reuse in every diagram module CSS — do not redeclare with different values):

```css
@keyframes actEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Base/entered pattern:

```css
.actorNode {
  opacity: 0;
  transform: translateY(12px);
} /* hidden until act */
.actorNode.entered {
  animation: actEnter 300ms var(--ease-enter) both;
}
```

### Idle State: idle-ready-breathe

The global `idle-ready-breathe` class (defined in `custom.css`) signals that an agent node is active and waiting for input. Parameters: `4000ms ease-in-out infinite; scale(1 → 1.02)`.

Apply via `isCurrentAct()`:

```tsx
className={clsx(styles.actorNode, wasReached('orchestrator') && styles.entered,
                isCurrentAct('orchestrator') && 'idle-ready-breathe')}
```

**Rule:** Apply to `AgentNode` only, never `OperatorNode`. Apply only to the node whose semantic role is "waiting for the next input" — typically the orchestrator during the phase between receiving a prompt and dispatching workers. Remove (by transitioning away from the current act) when the node dispatches or completes.

### Ghost Placeholder Pattern

Ghost placeholders provide visual mass for nodes that are anticipated but not yet revealed, preventing the diagram from feeling unbalanced before dispatch.

Geometry: match the target node's expected visual mass without adding a settled-node container. Use sharp placeholder bounds unless the placeholder represents true circular anatomy.

Three CSS states — apply via mount guard + dispatch state:

```css
.ghostWorker {
  opacity: 0;
}
.ghostWorkerShown {
  opacity: 0.15;
  transition: opacity 300ms var(--ease-enter);
}
.ghostWorkerHidden {
  opacity: 0;
  transition: opacity 200ms var(--ease-exit);
}
```

Fade-out on dispatch (200ms) must complete before worker entrance (first worker delay: 200ms). Ghost workers are hidden in `prefers-reduced-motion: reduce` (`opacity: 0 !important`).

### SVG Path Animation: Legacy Exception Modes

Do not use connector draw-on as the default storytelling model. A static connector with a semantic idle pulse/flow usually teaches better than a path hidden until scroll reaches a threshold.

**Mode A — One-shot state change:**

```
mount: dasharray = dashoffset = getTotalLength()
explicit state reached → add .arcDraw class → CSS plays drawPath once
```

Use only when the path appearing is itself the event being taught. Duration: 500ms `var(--ease-enter)`.

**Mode B — Scroll-driven continuous:**

```
legacy exception only: useEffect([phase]) → dashoffset = length * (1 - t)
```

Use only for approved scroll exceptions. Do not make the reader scrub a connector to understand ordinary data flow; show the complete connector and apply a semantic flow loop instead.

### Artifact Travel: PromptIcon vs TravelingPromptCard

Two distinct approaches; choice depends on trigger type:

| Component             | Animation mechanism                                              | Trigger                                        | Easing                         |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------ |
| `PromptIcon`          | Parent `transform: translate(pt.x, pt.y)` via `getPointAtLength` | Scroll phase (continuous)                      | Follows path geometry          |
| `TravelingPromptCard` | SMIL `<animateMotion>` with `begin="indefinite"`                 | Imperative: `motionRef.current.beginElement()` | `keySplines="0.20 0 0.38 0.9"` |

**Use `PromptIcon` for scroll-driven diagrams.** The parent reads phase, queries the invisible `<defs>` path via `getPointAtLength(t * totalLength)`, and applies a `translate` transform.

**Use `TravelingPromptCard` for trigger-based diagrams** (fixed-timeline or hover-activated). SMIL `animateMotion` does not work in `<img>`-embedded SVG — only in inline React SVG.

Opacity fade at arc end (prevents visual collision with destination node):

```ts
const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
// Artifact is fully visible for first 70% of arc travel, fades over final 30%
```

Invisible `<defs>` path pattern:

```tsx
<defs>
  <path id="ihTravelPath" ref={travelPathRef} d={TRAVEL_D} />
  {/* no stroke, no fill — pure geometry reference */}
</defs>
```

### Mount Guard (SSR Hydration Safety)

Any element whose initial CSS class depends on a phase value (which cannot be computed server-side) needs a mount guard to prevent hydration mismatch:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

// In JSX:
className={clsx(
  styles.ghostWorker,
  mounted && !dispatched && styles.ghostWorkerShown,
  dispatched && styles.ghostWorkerHidden,
)}
```

Without this, the server renders `mounted=false` (hidden), hydration matches, then the immediate `mounted=true` flip on client produces a one-frame flash. Apply to: ghost workers, idea lightbulb, any pre-phase element with a conditional show class.

### CSS Module Scoping and Static Fallback Card

Each diagram gets its own `.module.css`. Keyframes are module-scoped — do not import or reuse keyframe names from other modules (they'll be renamed by the bundler).

**Static fallback card** (required for any diagram with traveling or scroll-driven animated elements):

```css
.staticCard {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .staticCard {
    display: block;
  } /* static prompt shape at semantic midpoint of arc */
  .promptIcon {
    display: none;
  } /* hides the animated version */
}
```

Placement rule: position the static card at the **semantic midpoint** of the main arc (where the concept is clearest), not at start or end state. Use dimmed opacity (0.35) for guide arcs in reduced-motion to preserve their "guide" semantic without implying motion.

---

## Stagger Order and Information Hierarchy

**Critical principle from NNGroup progressive disclosure research:** Animation-driven stagger creates a directed reading path by exploiting motion-attention capture. This benefit inverts to harm if the stagger order contradicts information hierarchy.

### Stagger Order Rules

| Content Type                          | Stagger Order Rule                                    |
| ------------------------------------- | ----------------------------------------------------- |
| List items (sequential, ordered)      | Top-to-bottom, left-to-right — matches reading order  |
| Grid items (parallel, equal priority) | Simultaneous fade — stagger imposes false hierarchy   |
| Form fields                           | Top-to-bottom — mirrors completion sequence           |
| Navigation items                      | Simultaneously or as a unit — they are parallel       |
| Diagram nodes                         | Animate in data-flow order (source first, sinks last) |
| Hero → body → secondary               | Hero first; stagger each section as a unit            |

**Parallel content rule:** For content that is spatially parallel and equal-priority (e.g., a 3-column feature grid where all columns are equivalent), stagger imposes a false hierarchy. Use simultaneous fade. Reserve stagger for genuinely sequential content (steps, timelines, bullet points).

```python
def select_stagger_strategy(
    content_structure: str,  # 'sequential' | 'parallel' | 'hierarchical'
    item_count: int,
) -> str:
    """
    Returns: 'stagger' | 'simultaneous' | 'grouped'
    """
    if content_structure == 'parallel' and item_count <= 4:
        # Equal-weight items: no stagger (would impose false hierarchy)
        return 'simultaneous'
    elif content_structure == 'sequential':
        # Steps, bullet points, timelines: stagger in reading order
        return 'stagger'
    elif content_structure == 'hierarchical':
        # Groups: animate each group as a unit, stagger between groups
        return 'grouped'
    elif item_count > 8:
        # Too many individual staggers: group into buckets of 3–4
        return 'grouped'
    else:
        return 'stagger'
```

---

## Shape Vocabulary and Animation Congruence

Illustration shape vocabulary must be congruent with animation character. Generic shape families below are background; for Agentic Coding, `DESIGN_SYSTEM.md` overrides them with sharp containers and semantic curves only.

### Shape × Easing Congruence Table

| Shape Family                                                        | Easing Style                          | Spring Bounce | Duration Bias          |
| ------------------------------------------------------------------- | ------------------------------------- | ------------- | ---------------------- |
| **Curved semantic geometry** (circles, ellipses, Bezier connectors) | Expressive entrance, gradual ease-out | 0.05–0.15     | Standard to deliberate |
| **Terminal Geometry** (diamonds, sharp rects, angular paths)        | Productive, fast snap                 | 0.00          | Instant to subtle      |
| **Positive valence** (success, AI, system, knowledge)               | Ease-out with gentle tail             | 0.05–0.10     | Standard               |
| **High-arousal** (error, warning, code structure)                   | Near-linear or ease-in                | 0.00          | Instant to fast        |

**Congruence rule:** An error dialog that bounces into view (spring bounce > 0) is semantically incoherent — it applies warm, playful motion to a negative-valence semantic state. Apply Terminal Geometry animation character to all error and warning elements: snap in, no overshoot, fast duration.

```python
def get_animation_for_semantic(semantic_role: str) -> dict:
    """
    Returns animation parameters congruent with semantic hue role.

    Maps semantic role → PAD axis emphasis → animation character.
    Error and Warning use Terminal Geometry animation character regardless of brand default.
    """

    SEMANTIC_ANIMATION = {
        'error':    {'duration': '--duration-fast',     'easing': '--ease-standard', 'bounce': 0.00, 'translate': '4px'},
        'warning':  {'duration': '--duration-fast',     'easing': '--ease-standard', 'bounce': 0.00, 'translate': '4px'},
        'success':  {'duration': '--duration-subtle',   'easing': '--ease-enter',    'bounce': 0.05, 'translate': '8px'},
        'info':     {'duration': '--duration-subtle',   'easing': '--ease-enter',    'bounce': 0.00, 'translate': '8px'},
        'neutral':  {'duration': '--duration-subtle',   'easing': '--ease-enter',    'bounce': 0.00, 'translate': '8px'},
        'ai':       {'duration': '--duration-moderate', 'easing': '--ease-enter',    'bounce': 0.05, 'translate': '8px'},
        'system':   {'duration': '--duration-subtle',   'easing': '--ease-standard', 'bounce': 0.00, 'translate': '6px'},
    }

    return SEMANTIC_ANIMATION.get(semantic_role, SEMANTIC_ANIMATION['neutral'])
```

---

## Brand-Specific Application: Agentic Coding

This section applies the above system to the Agentic Coding design system specifically.

### Brand PAD Profile

| Axis      | Level      | Rationale                                                                  |
| --------- | ---------- | -------------------------------------------------------------------------- |
| Pleasure  | Medium     | Professional, clean, not cold. Sharp containers with semantic curves only. |
| Arousal   | Low–Medium | Technical reference for focused work. Calm and efficient.                  |
| Dominance | Medium     | Authoritative reference; not passive, not commanding.                      |

**Motion style:** Productive. Technical reference documentation prioritizes task speed over emotional engagement. Expressive curves reserved for diagram reveals only.

### Token Values for This Brand

Execute these scripts to produce the final token set:

```python
# Run to generate final token values for Agentic Coding brand
tokens = compute_duration_tokens(arousal_level='medium')
easing = compute_easing_tokens(motion_style='productive', pleasure_level='medium')
springs = compute_spring_presets(pleasure_level='medium', arousal_level='low')

# Stagger for typical 4-item list
stagger_4 = compute_stagger_parameters(item_count=4, arousal_level='medium')
# → delay_per_item: 80ms, total: 240ms ✓

# Stagger for 8-item list
stagger_8 = compute_stagger_parameters(item_count=8, arousal_level='medium')
# → delay_per_item: 60ms (budget-compressed), total: 420ms → compress further to 50ms → 350ms ✓
```

### Computed Token CSS for This Brand

```css
/* ============================================================
   MOTION TOKENS — Agentic Coding Design System
   Generated from: Motion Engineering Phase 2
   Brand: Productive style, medium arousal, medium pleasure
   ============================================================ */

/* Duration */
--duration-instant: 70ms;
--duration-fast: 110ms;
--duration-subtle: 150ms;
--duration-moderate: 240ms;
--duration-deliberate: 400ms;
--duration-ambient: 700ms;

/* Exit variants (×0.75) */
--duration-fast-exit: 80ms;
--duration-subtle-exit: 110ms;
--duration-moderate-exit: 180ms;
--duration-deliberate-exit: 300ms;

/* Easing — productive style */
--ease-enter: cubic-bezier(0, 0, 0.38, 0.9);
--ease-exit: cubic-bezier(0.2, 0, 1, 0.9);
--ease-standard: cubic-bezier(0.2, 0, 0.38, 0.9);
--ease-linear: linear;

/* Stagger */
--motion-stagger-sm: 60ms; /* 5–8 items */
--motion-stagger-md: 80ms; /* 3–4 items */
--motion-stagger-lg: 100ms; /* 2 items */

/* Reveal offsets */
--motion-reveal-y-load: -8px; /* page load: elements settle downward into position */
--motion-reveal-y-scroll: 12px; /* scroll reveal: elements rise upward into viewport */
--motion-reveal-x-forward: -16px; /* navigation forward: slide right */
--motion-reveal-x-back: 16px; /* navigation back: slide left */
--motion-reveal-scale: 0.96; /* modal/dialog only */
```

### Diagram Animation Rules

> See [§ Diagram Animation System](#diagram-animation-system) for the complete specification.

---

## Accessibility

### prefers-reduced-motion

**Reduced-motion renders the canonical representation.** The complete static figure is the primary design artifact — storytelling idle animation is an enhancement layer, not the content itself. When `prefers-reduced-motion: reduce` is active, idle loops stop and legacy `ScrollDrivenFigure` exceptions set `phase=1` immediately. This is not a degradation path; it is the baseline design. Animation is a progressive enhancement for users who prefer it.

WCAG 2.1 SC 2.3.3 (Level AAA) and SC 2.3.1 (Level A) cover motion sensitivity. Vestibular disorders affect approximately 10 million Americans. Large-scale motion can trigger nausea, headaches, and symptoms requiring bed rest. This is not aesthetic preference — ignoring it can cause physical harm.

**Implementation requirement:** Every animation property must be neutralized by the following media query. This is not optional.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }

  /* Preserve opacity transitions for content that uses them for show/hide logic */
  .reveal,
  .stagger-item {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

**Do NOT use `animation-duration: 0` (zero):** Some browsers and screen readers interpret zero-duration animations differently from no animation. Use `0.01ms` — effectively instantaneous but technically animated.

### State Change Without Motion

When `prefers-reduced-motion: reduce` is active:

- Content appears instantly (no fade, no translate)
- Stagger is eliminated — all elements appear simultaneously
- Storytelling idle loops stop
- Legacy scroll-driven reveals render immediately in their complete static state
- Progress indicators use color change only (no spinning, no sweeping)
- Diagrams remain fully readable with no draw-on or looped motion

### Minimum Animation Duration for Screen Readers

Some screen reader users rely on transition events for navigation cues. Never set `animation-duration` below 40ms (even before reduced-motion override) — below 40ms, the browser may not fire `animationend` events reliably.

---

## Validation Checklist

For every generated animation sequence, verify:

**Timing:**

- [ ] All user-triggered animations begin within 100 ms of trigger (Miller 1968)
- [ ] No user-triggered animation exceeds 500 ms duration
- [ ] Exit animations are ≤ 75% of corresponding enter duration
- [ ] No `animation-delay` on first element in any sequence

**Easing:**

- [ ] No CSS `ease` keyword used — only custom `cubic-bezier()` or named tokens
- [ ] `linear` easing used only for spinners, progress bars, and video
- [ ] Entrance uses ease-out (decelerating); exit uses ease-in (accelerating)
- [ ] Repositioning uses ease-in-out; not ease-out (ease-out implies arrival, not transit)

**Stagger:**

- [ ] Total stagger sequence ≤ 400 ms (compress per-item delay if needed)
- [ ] Stagger per step ≥ 40 ms (below this collapses to simultaneous)
- [ ] Stagger order matches information hierarchy
- [ ] Parallel equal-priority items use simultaneous fade, not stagger

**Storytelling idle motion:**

- [ ] Static figure communicates the concept with all animation disabled
- [ ] Motion spec answers story loop, semantic meaning, reader benefit, static fallback, loop coherence, rejection test
- [ ] Every loop maps to a real process state: authoring, inference, retrieval, serialization, tool execution, data flow, validation, or readiness
- [ ] Coordinated idle roles read as one coherent story and support the surrounding text
- [ ] No loop exists only for liveliness or decoration

**Reveal (page load and legacy exceptions):**

- [ ] Page-load elements use `translateY(-8px → 0)` (settle downward, not rise)
- [ ] Scroll-reveal is legacy/exception only and has a written justification
- [ ] Scale-in (`scale(0.96)`) used only for modals/dialogs — never lists
- [ ] Navigation forward: enter from left; navigation back: enter from right
- [ ] `animation-fill-mode: both` set on all reveal animations

**Springs:**

- [ ] Springs used only for gesture-continuation (drag release, pull-to-refresh)
- [ ] `bounce: 0.0` (critically damped) for all non-gesture UI elements
- [ ] No spring bounce on error, warning, or danger elements

**Shape × Easing congruence:**

- [ ] Error and warning elements use fast, snap-in animation (no bounce, no deliberate)
- [ ] Success and positive-valence elements may use subtle bounce (≤ 0.10)
- [ ] Diagram connectors draw after nodes (data-flow order maintained)

**Accessibility:**

- [ ] `@media (prefers-reduced-motion: reduce)` block present in CSS
- [ ] All animations use `0.01ms !important` in reduced-motion block (not 0)
- [ ] Reveal classes reset to final state (`opacity: 1`, `transform: none`) in reduced-motion
- [ ] No `animation-duration` below 40ms anywhere (browser event reliability)
- [ ] Parallax multiplier set to `0` in reduced-motion override

**Performance:**

- [ ] All animated properties are `opacity` and `transform` only — no `width`, `height`, `left`, `top`, `margin`, `padding`
- [ ] No new scroll event listeners for storytelling animation
- [ ] `will-change: transform, opacity` applied only to actively animating elements (remove after animation ends)
- [ ] Reusable idle keyframes live in global vocabulary unless a component-local exception is justified

**Diagram figures:**

- [ ] Figure is static-complete before motion is added
- [ ] `var(--ease-enter)` used, not `ease-out` keyword
- [ ] Semantic idle class chosen by process meaning, not visual preference
- [ ] `idle-ready-breathe` applied only to a system/agent that is waiting for input
- [ ] Flow direction matches causal direction; equal-priority items do not stagger into false hierarchy
- [ ] Legacy `ScrollDrivenFigure` / scroll-scrubbed travel has an explicit exception comment
- [ ] Legacy scroll exceptions render final static state in reduced motion
- [ ] Static fallback is complete and placed at the semantic steady state

---

## References

### Perceptual Timing

- **Miller, G. A.** — "The magical number seven, plus or minus two" (_Psychological Review_, 1956). Foundation for the 1,000 ms flow threshold.
- **Miller, R. B.** — "Response time in man-computer conversational transactions" (_AFIPS Fall Joint Computer Conference_, 1968). Three response time thresholds: 100 ms, 1,000 ms, 10,000 ms.
- **Card, S. K., Moran, T. P., & Newell, A.** — _The Psychology of Human-Computer Interaction_ (Lawrence Erlbaum, 1983). Model Human Processor: 230 ms visual perception cycle.
- **Card, S. K., Robertson, G. G., & Mackinlay, J. D.** — "The information visualizer" (_CHI '91_, 1991). Applied Miller thresholds to workstation interface timing.
- **Nielsen, J.** — "Response Times: The 3 Important Limits" (NNGroup, 1993; based on Miller 1968). 100 / 1,000 / 10,000 ms practitioner synthesis.
- **Nielsen Norman Group** — "The Ideal Duration and Easing for UI Animations" (2015, updated 2023). Practitioner synthesis of animation duration research.

### Duration & Easing Systems

- **IBM Carbon Design System** — "Motion" documentation. Six-tier duration scale (fast-01 70 ms → slow-02 700 ms); productive vs. expressive easing curves. Published under Apache 2.0.
- **Apple Inc.** — WWDC 2023: "Wind down with SwiftUI animations." Spring animation perceptual model: `duration` + `bounce` parameters; bounce: 0.0 = critically damped; recommended 0.0–0.20 for UI.
- **Shopify Polaris** — "Motion" design system documentation. "Snappy" principle: fast start, slow end (ease-out default).
- **Material Design 3 (Google)** — "Motion" specification. Easing tokens: `cubic-bezier(0.05, 0.7, 0.1, 1.0)` standard ease-out.
- **MUI (Material UI)** — `theme.transitions` documentation. 225 ms entering, 195 ms leaving defaults.

### Cognitive Effects of Animation

- **Pratt, J., et al.** — "Visual sudden-onset in peripheral vision triggers orienting" (_Psychological Science_, 2010, 21(12), 1724–1730). Motion anywhere in visual field triggers automatic attention reorientation.
- **Nielsen Norman Group** — "Animation for Attention and Comprehension" (2020). Animation directing attention to critical state changes; change blindness prevention.
- **Nielsen Norman Group** — "Skeleton Screens 101" (Mejtoft, Långström & Söderström 2018, referenced). Skeleton screens create "illusion of progress," reducing perceived loading time.
- **Nebraska-Lincoln study** (cited by NNGroup) — Users with animated progress bars tolerate **3× longer** wait vs. static/no indicator. Identical objective wait time.
- **Thomas, F., & Johnston, O.** — _The Illusion of Life: Disney Animation_ (Hyperion, 1981). 12 principles of animation; timing, ease-in/ease-out, staging, follow-through operationalized by Carbon, Apple.

### Perceived Performance

- **Nielsen Norman Group** — "Response Times: The 3 Important Limits." Slideshow case study: 1% vs. 20% eye-tracking attention differential.
- **WCAG 2.1 Success Criterion 2.3.3** — "Animation from Interactions" (Level AAA). Required: provide mechanism to disable motion.
- **vestibular.org** — Vestibular Disorders Association. ~10 million Americans affected by vestibular disorders; screen motion can trigger symptoms.

### Spatial Cognition and Direction

- **Casasanto, D., & Bottini, R.** — "Mirror Reading Can Reverse the Flow of Time" and spatial metaphor research (_Frontiers in Psychology_, 2022). GOOD IS RIGHT; mental number line; cultural variation.
- **Nielsen Norman Group** — "Animation in UX: The Science of Motion and Spatial Cognition" (2022). Directionality encodes navigational contracts; zoom in = deeper, zoom out = broader.
- **Pratt et al. (2010)** — Peripheral motion capture (see above). Foundation for directional attention signaling.

### Stagger and Progressive Disclosure

- **Card, S. K., Moran, T. P., & Newell, A.** — _The Psychology of Human-Computer Interaction_ (1983). 230 ms perception cycle — interval below which sequential items merge perceptually.
- **Nielsen Norman Group** — "Progressive Disclosure" (2006, updated 2021). Sequential disclosure improves comprehension by forcing prioritization; working memory alignment.
- **Miller, G. A.** (1956) — 7 ± 2 chunks; modern revision: 4 ± 1 for complex information. Informs stagger item count limits.
- **Framer Motion documentation** — `stagger(0.3)` default for `whileInView` variants. 300 ms / item is starting point to override, not design recommendation.
- **Josh W. Comeau** — "Action-driven motion" (joshwcomeau.com). ~125 ms entrance for hover micro-interactions. Sequential item stagger practitioner reference.

### Accessibility

- **WCAG 2.1 SC 2.3.3** — Animation from Interactions. Provides mechanism to disable motion triggered by interaction (Level AAA).
- **WCAG 2.1 SC 2.3.1** — Three Flashes or Below Threshold (Level A). No content flashes more than 3× per second.
- **MDN Web Docs** — `prefers-reduced-motion` media query. Implementation guidance.
