# Illustration & Diagram Generation Guide for AI Agents

Production illustration generation using shape grammar formalism, parametric curve mathematics, cross-modal psychophysics, Gestalt composition constraints, and computational aesthetic validation. Designed as agent-executable specification — every formula is code-ready. Domain-agnostic: works for any brand category.

This guide is the illustration counterpart to `COLOR_GUIDE.md` (color science, palette engineering, typography accessibility) and `SPATIAL_GUIDE.md` (spacing, curvature, proportions, target sizes). It takes three inputs — a validated color palette, a spatial token system, and a brand emotional profile (target PAD vector) — and produces a complete, validated illustration system: shape vocabulary, construction rules, composition algorithms, and aesthetic quality metrics.

Four phases: **Illustration Strategy** (human-driven shape semantics and conceptual metaphor decisions grounded in perception science), **Shape Engineering** (agent-executable parametric math), **Composition & Layout** (agent-executable arrangement algorithms), and **Aesthetic Validation** (agent verification of complexity, balance, and congruence). The first phase grounds the human operator in shape psychophysics and visual communication research. The remaining phases are fully computable.

**Prerequisite:** Complete `COLOR_GUIDE.md` Phases 1–3 and `SPATIAL_GUIDE.md` Phases 1–2 first. This guide references the PAD emotional model, color token architecture, font-color congruence framework, border radius system, spacing scale, and Gestalt proximity threshold defined there.

---

## Phase 1: Illustration Strategy (Human Judgment)

Before generating shapes or composing diagrams, ground the decisions in shape perception science, conceptual metaphor theory, and multimedia learning research. The agent assists with shape-emotion mapping and constraint validation; the human makes the judgment call on visual vocabulary and metaphor selection.

### Shape Semantics Framework

Geometric shapes carry measurable semantic associations. These associations are cross-culturally robust for basic forms but context-dependent for complex compositions — parallel to color-in-context theory (Elliot & Maier 2012, see `COLOR_GUIDE.md` Phase 1).

**Sources:** Lundholm (1921); Aronoff et al. (1992); Larson et al. (2007); Dehaene et al. (2025), *eLife*.

| Shape | Primary Semantic | Secondary Associations | Cultural Variations |
|---|---|---|---|
| Circle | Unity, wholeness, cycles, protection | Infinity, perfection, continuity | Zen: enlightenment; Chinese: heavens; Universal: sun/moon |
| Triangle (point-up) | Hierarchy, stability, ascent | Direction, dynamism, trinity | Religious trinity; navigation; fire element |
| Triangle (point-down) | Descent, instability, feminine energy | Funnel, concentration | Water element; inverted hierarchy |
| Square | Solidity, order, material world | Dependability, permanence | Chinese: earth; Native American: permanence |
| Hexagon | Balance, equilibrium, structure | Efficiency, tessellation | Beehive/nature; Star of David |
| Star (5-pointed) | Hope, protection, wholeness | Achievement, five elements | Islam: hope; Wicca: protection |
| Arrow | Direction, movement, causality | Progress, force, flow | Universal: path/trajectory; maps to PATH image schema |
| Rounded rectangle | Containment with approachability | Screens, cards, containers | Modern UI convention |

**Neural basis:** Geometric shapes activate intraparietal and inferior temporal regions also involved in mathematical processing, indicating a strong link between geometric intuition and mathematical cognition (Dehaene et al. 2025). Humans encode shapes symbolically via discrete regularities (symmetries, parallelism), distinct from continuous visual processing.

### Conceptual Metaphor Theory

**Source:** Lakoff, G. & Johnson, M. (1980). *Metaphors We Live By*. University of Chicago Press.

Humans understand abstract concepts by mapping them onto concrete spatial experiences. This operates through **image schemas** — recurring pre-conceptual patterns arising from embodied experience. Every diagram implicitly uses these schemas; making them explicit improves communication effectiveness.

| Image Schema | Structure | Visual Representation | Abstract Mapping |
|---|---|---|---|
| CONTAINER | Inside, outside, boundary | Enclosed shapes, bordered regions | Inclusion/exclusion, scope, categories |
| PATH | Source, trajectory, goal | Arrows, lines, flow diagrams | Progress, process, narrative sequence |
| FORCE | Push, pull, resistance | Thickness, weight, directional emphasis | Causality, influence, agency |
| UP-DOWN | Vertical axis | Vertical positioning | GOOD IS UP, MORE IS UP, POWER IS UP |
| LINK | Connection between entities | Lines, connectors | Relationship, dependency |
| BALANCE | Equilibrium point | Symmetry, centering | Fairness, stability |

**Spatial metaphors in design** (Casasanto & Bottini 2022, *Frontiers in Psychology*):
- **GOOD IS UP**: Positive valence associated with upward spatial position — reflected in UI patterns where success states appear above failure states.
- **GOOD IS RIGHT**: Positive emotions linked to right-side space. Products placed on the right are preferred.
- **Mental number line**: Smaller numbers instinctively mapped left, larger numbers right (reversed in right-to-left reading cultures).

**Design implication:** Visual metaphors are not universal — the direction of mental timelines varies across cultures (left-to-right vs. right-to-left). Ignoring cultural variation in spatial metaphors degrades user experience.

### Bouba/Kiki Cross-Modal Correspondences

**Sources:** Kohler (1929), *Gestalt Psychology*; Ramachandran & Hubbard (2001), *J. Consciousness Studies*; Fort et al. (2022), *Scientific Reports*.

Shape properties map systematically to abstract concepts through cross-modal correspondences. The bouba/kiki effect — first observed as "maluma/takete" by Kohler — demonstrates that rounded shapes associate with softness, warmth, and low pitch, while angular shapes associate with sharpness, coldness, and high pitch. Agreement rate: **95–98%** across cultures, replicated in preverbal infants as young as 4 months.

| Shape Property | Abstract Mapping | Direction | Mechanism |
|---|---|---|---|
| Rounded/curvy | Lower pitch, larger size, heavier weight, slower speed | Round = low-frequency, large, heavy | Physical sound-shape correspondence |
| Angular/spiky | Higher pitch, smaller size, lighter weight, faster speed | Sharp = high-frequency, small, light | Abrupt spectral changes map to sharp contours |
| Symmetrical | Stability, order, competence | Regularity = trustworthiness | Processing fluency |
| Asymmetrical | Dynamism, creativity, novelty | Irregularity = energy | Effortful processing → arousal |

**Quantitative findings:**
- Curvature preference meta-analysis: **Hedges' g = 0.39** (medium effect size) across tasks and contexts (Chuquichambi et al., CBS working paper).
- "Balance x Continuity" model predicts bouba/kiki with **mean R² = 0.60** (range 0.26–0.94) from existing datasets (Fort et al. 2022).

**Implication for illustration:** Shape property choices are not arbitrary stylistic decisions — they carry measurable semantic weight. An angular illustration vocabulary signals precision/urgency; a rounded vocabulary signals warmth/approachability. These map directly onto the PAD model (see `SPATIAL_GUIDE.md` Phase 1 § Geometric Personality Framework).

### Shape-Emotion PAD Mapping

Extending `SPATIAL_GUIDE.md` Phase 1 with quantitative data from shape psychophysics:

| Shape Property | Primary PAD Axis | Direction | Effect Size | Key Source |
|---|---|---|---|---|
| Curvature | Pleasure | Curved ↑ | g = 0.39 | Chuquichambi et al. (meta-analysis) |
| Angularity | Arousal + Dominance | Angular ↑ | Amygdala bilateral activation | Bar & Neta 2007 |
| Symmetry | Pleasure | Symmetric ↑ | Longer fixation, higher ratings | Frontiers in Psychology 2016 |
| Complexity (D) | Arousal | Mid-range ↑ | D = 1.3–1.5 sweet spot | Taylor et al. 2011 |
| Size | Dominance | Larger ↑ | Fitts' law, cross-domain | Fitts 1954 |
| Regularity | Pleasure + Dominance | Regular ↑ | Shorter description length | Feldman 2003 |
| Organic noise | Arousal (low) + Pleasure | Organic ↑ | 60% stress reduction at D ~1.4 | Taylor (Oregon lab) |

**Critical moderator** (Leder et al. 2011, *Perception*): Curvature preference disappears when the object carries negative semantic valence. Applying high curvature to error states, destructive actions, or danger signals is incongruent and may reduce perceived severity. See `SPATIAL_GUIDE.md` Phase 2 § Curvature by Semantic Role.

### Diagram Effectiveness Principles

**Source:** Mayer, R. E. (2009). *Multimedia Learning* (2nd ed.). Cambridge University Press; Mayer & Fiorella (2014), *Cambridge Handbook of Multimedia Learning*.

Mayer's Cognitive Theory of Multimedia Learning rests on three assumptions: dual-channel processing (visual + auditory), limited capacity per channel, and active processing (select, organize, integrate). These produce measurable design principles with replicated effect sizes:

| Principle | Description | Studies Supporting | Median Effect Size (d) |
|---|---|---|---|
| Spatial Contiguity | Place words and pictures near each other | 22/22 | **1.10** |
| Temporal Contiguity | Present corresponding words and pictures simultaneously | 9/9 | **1.22** |
| Coherence | Exclude extraneous material | 23/23 | **0.86** |
| Redundancy | Graphics + narration > graphics + narration + text | 16/16 | **0.86** |
| Signaling | Add cues to highlight organization | 24/28 | **0.41** |
| Segmenting | Break complex information into user-paced segments | — | Moderate |
| Pre-training | Teach component names before processes | — | Moderate |

**Application to illustration:**
- **Spatial contiguity (d = 1.10)** is the strongest effect. Labels must be placed directly adjacent to the element they describe — never in a separate legend when space permits.
- **Coherence (d = 0.86)** means decorative elements that do not support the message actively harm learning. Every shape must serve a communicative purpose.
- **Signaling (d = 0.41)** supports the use of visual hierarchy (weight, size, color) to guide attention through the diagram.

### Icon and Pictogram Design Constraints

**Source:** FHWA-RD-03-065 (2003), *Symbol Signs: Icon Design Guidelines*. Federal Highway Administration.

The FHWA research defines mathematical constraints for recognizable symbols, grounded in Gestalt psychology:

| Constraint | Specification |
|---|---|
| Design grid | 20 x 20 units |
| Minimum feature size | No significant detail smaller than 1 grid unit (5% of symbol area) |
| Minimum visual angle (detail) | 3 degrees for significant details |
| Minimum visual angle (stroke) | 2 degrees for line thickness |
| Detail budget rule | Only details whose removal would reduce recognition should be included |

**Gestalt-based symbol principles (FHWA):**
1. **Figure/ground**: Clear, stable, solid relationship between symbol elements and background.
2. **Figure edges**: Solid shapes preferred over thin/dotted lines (except for depicting motion).
3. **Closure**: Closed figures without discontinuous lines or disjointed elements.
4. **Simplicity**: Include only necessary detail. Removing any essential detail should significantly reduce recognition.
5. **Unity**: All parts enclosed within a single boundary.

### Decision Framework

Score each candidate shape vocabulary against the brand's target PAD vector and communication goals:

| Dimension | Weight | What to Evaluate |
|---|---|---|
| Semantic Clarity | High | Does each shape carry a clear, unambiguous meaning for the target audience? |
| PAD Congruence | High | Does the shape vocabulary's PAD profile match the brand's target? (See Shape-Emotion PAD Mapping) |
| Cross-Modal Fit | Medium | Do shapes align with bouba/kiki correspondences for intended concepts? |
| Diagram Effectiveness | Medium | Does the vocabulary support spatial contiguity (d = 1.10) and coherence (d = 0.86)? |
| Construction Feasibility | Medium | Can shapes be generated from parametric primitives? (See Phase 2) |
| Color System Fit | Medium | Does the shape vocabulary compose well with semantic color tokens? (See `COLOR_GUIDE.md`) |
| Cultural Safety | Low | Are shapes free of unintended cultural associations for the target audience? |
| Complexity Budget | Low | Is the total number of distinct shape types within cognitive load limits (6–8 categories max)? |

The human operator evaluates these qualitatively against brand intent. The agent can compute PAD congruence checks and construction feasibility. Once the shape vocabulary is chosen, everything below is math.

---

## Phase 2: Shape Engineering (Agent Math)

From this point forward, the agent generates shape primitives autonomously. The human provides perceptual feedback during validation.

**IMPORTANT: The agent MUST write code to run the math then execute it, NEVER attempt to compute values directly. Strict mathematical adherence!**

## Shape Primitive Vocabulary

All illustration primitives are parametric functions that emit SVG path data. An agent specifies shapes by parameter vectors — not by drawing pixels.

### Superellipse (Lame Curve)

The superellipse generalizes the ellipse into a family of curves controlled by an exponent parameter. It is the mathematical basis for "squircle" corners used in Apple's design language and the emerging CSS `corner-shape: superellipse()` specification.

**Source:** Lame, G. (1818). *Examen des differentes methodes employees pour resoudre les problemes de geometrie*. Popularized by Piet Hein (1965) for urban design.

**Implicit equation:**

```
|x/a|^n + |y/b|^n = 1
```

**Parametric equations** (for SVG path generation, `0 <= t < 2*pi`):

```
x(t) = a * |cos(t)|^(2/n) * sgn(cos(t))
y(t) = b * |sin(t)|^(2/n) * sgn(sin(t))
```

where `a`, `b` are semi-axes and `n` controls curvature.

**Shape behavior by exponent:**

| n | Shape | Emotional Signal |
|---|---|---|
| 0 < n < 1 | Four-armed star (concave sides) | Sharp, aggressive, high arousal |
| n = 1 | Rhombus (diamond) | Angular, directional |
| 1 < n < 2 | Rounded rhombus (convex sides) | Transitional |
| n = 2 | Ellipse (circle when a = b) | Neutral, balanced |
| n > 2 | Rounded rectangle (squircle territory) | Soft, approachable |
| n = 4 | Squircle (a = b) | Maximum approachability |

**CSS superellipse mapping** (emerging specification):

```
CSS corner-shape: superellipse(k)  -->  Lame exponent n = 2^k

k = 0  -->  n = 1  (bevel)
k = 1  -->  n = 2  (circular arc, standard border-radius)
k = 2  -->  n = 4  (squircle)
```

**SVG implementation:** Sample `t` at 64–128 points, compute `(x, y)` pairs, emit as SVG `<path>` using `M` and `L` commands, or fit cubic Bezier curves for smoother output.

### Gielis Superformula

A polar-coordinate generalization of the superellipse that can describe an enormous variety of natural and abstract forms with a single equation.

**Source:** Gielis, J. (2003). "A generic geometric transformation that unifies a wide range of natural and abstract shapes." *American Journal of Botany*, 90(3), 333–338.

**Polar equation:**

```
r(phi) = ( |cos(m * phi / 4) / a|^n2 + |sin(m * phi / 4) / b|^n3 )^(-1/n1)
```

**Cartesian conversion:**

```
x = r(phi) * cos(phi)
y = r(phi) * sin(phi)
```

**Parameters:**

| Parameter | Role | Typical Range |
|---|---|---|
| `a`, `b` | Scaling factors | Often 1.0 |
| `m` | Rotational symmetry (integer m gives m-fold) | 1–12 |
| `n1` | Overall roundness | 0.1–10.0 |
| `n2`, `n3` | Shape exponents (pinching, sharpness) | 0.1–10.0 |

**Special cases:**

```
m=4, n1=n2=n3=2, a=b=1  -->  circle
m=4, n1=2, n2=n3=2, a!=b  -->  ellipse
m=0                         -->  circle (no angular modulation)
Varying n1, n2, n3: starfish, flowers, leaves, diatoms, seed shapes
```

### Cubic Bezier Curves (SVG Standard)

The workhorse of SVG path data, font outlines, and UI animation easing functions.

**Source:** Bezier, P. (1968). French Patent 1,475,841.

**General Bezier curve of degree n** with control points `P_0, ..., P_n`:

```
B(t) = SUM_{i=0}^{n} C(n,i) * (1-t)^(n-i) * t^i * P_i,    0 <= t <= 1
```

where `C(n,i)` is the binomial coefficient.

**Cubic Bezier** (4 control points, the SVG `C` command):

```
B(t) = (1-t)^3 * P0 + 3*(1-t)^2 * t * P1 + 3*(1-t) * t^2 * P2 + t^3 * P3
```

- `P0`, `P3` are endpoints (on-curve).
- `P1`, `P2` are control handles (off-curve), defining tangent direction and magnitude.

### Decorative Curves

Parametric curves for borders, backgrounds, and ornamental elements. All emit `(x, y)` pairs for SVG path generation.

| Curve | Parametric Equations | Key Parameters | Visual Character |
|---|---|---|---|
| Rose (Rhodonea) | `x = a * cos(k*t) * cos(t)`, `y = a * cos(k*t) * sin(t)` | `a` (amplitude), `k` (petals: odd k → k petals, even k → 2k petals) | Floral, radial symmetry |
| Lissajous | `x = A * sin(a*t + delta)`, `y = B * sin(b*t)` | `a/b` ratio (lobe count), `delta` (rotation) | Oscilloscope, harmonic |
| Hypotrochoid (Spirograph) | `x = (R-r)*cos(t) + d*cos((R-r)/r * t)`, `y = (R-r)*sin(t) - d*sin((R-r)/r * t)` | `R` (fixed circle), `r` (rolling), `d` (tracing distance) | Geometric, mandala-like |
| Epitrochoid | `x = (R+r)*cos(t) - d*cos((R+r)/r * t)`, `y = (R+r)*sin(t) - d*sin((R+r)/r * t)` | Same as hypotrochoid | Outer-rolling variant |

**SVG implementation:** Iterate `t` from `0` to `2*pi * lcm(R, r) / R` (for spirograph) or `0` to `2*pi` (for rose/Lissajous with integer ratios). Emit polyline or fit Bezier curves.

## Shape Grammar Formalism

Shape grammars provide the formal framework for constructing complex illustrations from primitive shapes through rule-based transformations.

**Sources:** Stiny, G. & Gips, J. (1972). "Shape Grammars and the Generative Specification of Painting and Sculpture." *Information Processing 71*; Knight, T. (2003). "Computing with ambiguity." *Environment and Planning B*.

### Formal Definition

A shape grammar is a 4-tuple:

```
SG = (S, L, R, I)
```

where:
- `S` — a finite set of shapes drawn from a shape algebra
- `L` — a finite set of labels (markers/tags) controlling rule application
- `R` — a finite set of production rules of the form `a -> b` (LHS -> RHS)
- `I` — an initial shape (axiom/start symbol)

### Rule Application

Given a current working shape `s` and a rule `a -> b`, the transformation produces a new shape `t`:

```
t = (s - a) + b
```

where `s - a` removes the matched subshape and `+ b` adds the replacement.

### Embedding Relation

A rule `a -> b` can only apply if `a` is a **part** (subshape) of `s`:

```
s . a = a   (the product of s and a equals a)
```

This **embedding relation** is the most powerful aspect of shape grammars — it allows rules to match against any recognizable subshape, not just shapes explicitly placed by prior rules. This enables **emergence**: recognition of shapes that arise from spatial relationships of existing elements.

### Weighted (Augmented) Shapes

Shapes carry non-geometric attributes via tuple notation:

```
w_s = (s, a_s^1, a_s^2, a_s^3, ...)
```

where `s` is the geometric shape and `a_s^i` are attributes (color token, semantic role, weight, etc.). Operations (union, product, difference) apply separately across each component.

### Agent-Executable Encoding

A shape grammar encodes as a rule engine:
1. **Shape representation**: shapes as sets of line segments or parametric primitives, each with carrier and boundary
2. **Pattern matching**: detect subshapes via the embedding relation
3. **Rule selection**: when multiple rules match, choose stochastically, by priority, or exhaustively
4. **Transformation**: apply Euclidean transformations (translation, rotation, reflection, scaling) to embed the RHS

## Construction Constraints

Inspired by the IBM Design Language illustration system, which has one of the most rigorously formalized corporate illustration grammars.

**Source:** IBM Design Language (ibm.com/design/language/illustration).

### Grid Alignment

```
All anchor points snap to the spatial grid defined in SPATIAL_GUIDE.md.
Minimum shape dimension = base_unit (8px default).
Minimum negative space between shapes = base_unit.
Layered shapes require base_unit safe area.
```

### Shape Primitives

Illustrations are constructed from:
- Squares, circles, rectangles, triangles (geometric foundation)
- Superellipses (controlled curvature)
- Cubic Bezier curves (organic forms built on geometric scaffolding)

### Angle Constraints

```
Preferred angles: 15, 30, 45, 60, 75, 90 degrees
Other angles: permitted but require justification
```

### Radii Rules

```
Nested curved lines must maintain equal spacing with increasing radius.
No mixed corner radii within a nested design.
Border radius tokens from SPATIAL_GUIDE.md apply to all illustration containers.
```

## Noise and Organic Deformation

For illustrations requiring natural, organic character (biology diagrams, nature scenes, terrain), apply noise-based deformation to geometric primitives.

### Perlin Noise

**Sources:** Perlin, K. (1985). "An Image Synthesizer." *ACM SIGGRAPH*, 19(3), 287–296; Perlin, K. (2002). "Improving Noise." *ACM Trans. Graphics*, 21(3), 681–682.

**Improved fade function** (5th-degree smoothstep with zero first and second derivatives at endpoints):

```
fade(t) = t^3 * (t * (t * 6 - 15) + 10)
```

**2D Perlin noise algorithm:**
1. Divide space into unit cells. Assign pseudorandom unit gradient vector `g` at each grid vertex.
2. For point `(x, y)`: identify four surrounding grid corners. Compute offset vectors from each corner.
3. Dot products: for each corner `i`, compute `dot(g_i, offset_i)`.
4. Interpolation: bilinear interpolation using faded fractional coordinates:

```
u = fade(x - floor(x))
v = fade(y - floor(y))
result = lerp(v,
    lerp(u, dot00, dot10),
    lerp(u, dot01, dot11)
)
```

Output range: approximately `[-1, 1]`.

### Fractal Brownian Motion (fBm)

Layering multiple octaves of noise for richer, more natural-looking results:

```
fBm(x, y) = SUM_{i=0}^{octaves-1} amplitude_i * noise(frequency_i * x, frequency_i * y)

where:
  frequency_i = lacunarity^i        (commonly lacunarity = 2.0)
  amplitude_i = persistence^i       (commonly persistence = 0.5)
```

**Normalization:**

```
fBm_normalized = fBm / SUM_{i=0}^{octaves-1} persistence^i
```

**Typical parameters:** `octaves` = 4–8, `lacunarity` = 2.0, `persistence` = 0.5.

### SVG Path Deformation

Apply noise-based displacement to any SVG path:

```
x_deformed = x_original + amplitude * noise(x_original * freq, y_original * freq)
y_deformed = y_original + amplitude * noise(x_original * freq + 1000, y_original * freq + 1000)
```

The offset (`+1000`) ensures x and y displacements use different noise values. `amplitude` controls distortion magnitude; `freq` controls granularity.

## Recursive Systems (Reference)

For fractal and plant-like illustration elements. These are reference formulas — the agent selects from them based on the illustration concept.

### L-Systems (Lindenmayer Systems)

**Source:** Prusinkiewicz, P. & Lindenmayer, A. (1990). *The Algorithmic Beauty of Plants*. Springer-Verlag.

String-rewriting system with turtle graphics interpretation:
- `F` → move forward and draw
- `+` → turn left by angle
- `-` → turn right by angle
- `[` → push state (branch start)
- `]` → pop state (branch end)

| Fractal | Axiom | Rules | Angle |
|---|---|---|---|
| Koch curve | `F` | `F -> F+F-F-F+F` | 90° |
| Sierpinski triangle | `A` | `A -> B-A-B`, `B -> A+B+A` | 60° |
| Dragon curve | `F` | `F -> F+G`, `G -> F-G` | 90° |
| Fractal plant | `X` | `X -> F+[[X]-X]-F[-FX]+X`, `F -> FF` | 25° |

### Iterated Function Systems (IFS)

**Source:** Barnsley, M. F. (1988). *Fractals Everywhere*. Academic Press.

Contractive affine transformations applied iteratively:

```
f_i(x, y) = (a_i*x + b_i*y + e_i, c_i*x + d_i*y + f_i)
```

**Barnsley Fern coefficients:**

| i | a | b | c | d | e | f | p |
|---|---|---|---|---|---|---|---|
| 1 | 0.00 | 0.00 | 0.00 | 0.16 | 0.00 | 0.00 | 0.01 |
| 2 | 0.85 | 0.04 | -0.04 | 0.85 | 0.00 | 1.60 | 0.85 |
| 3 | 0.20 | -0.26 | 0.23 | 0.22 | 0.00 | 1.60 | 0.07 |
| 4 | -0.15 | 0.28 | 0.26 | 0.24 | 0.00 | 0.44 | 0.07 |

**Chaos Game algorithm:** Pick random point; iteratively select transformation `f_i` with probability `p_i`; apply to current point; plot. Repeat for 10,000–1,000,000+ iterations.

---

## Phase 3: Composition & Layout (Agent Math)

From this point forward, the agent composes shapes into diagrams and illustrations autonomously. The human provides perceptual feedback during validation.

**IMPORTANT: The agent MUST write code to run the math then execute it, NEVER attempt to compute values directly. Strict mathematical adherence!**

## Visual Balance Computation

### Deviation of Center of Mass (DCM)

The most rigorously validated measure of visual balance. Treats pixel luminance (or saliency) as physical mass and computes how far the composition's center of gravity deviates from its geometric center.

**Source:** Hubner, R. & Fillinger, M. G. (2016). "Comparison of Objective Measures for Predicting Perceptual Balance and Visual Aesthetic Preference." *Frontiers in Psychology*, 7, 335.

**Formula:**

For an image where each pixel `(i, j)` has mass `m(i, j)` (luminance, saliency, or binary occupancy):

```
b_x = SUM(i * m(i,j)) / N       (mass-weighted horizontal centroid)
b_y = SUM(j * m(i,j)) / N       (mass-weighted vertical centroid)

where N = SUM(m(i,j))           (total mass)
```

Normalized location: `b'_x = b_x / width` (ranges 0 to 1; geometric center = 0.5)

Deviation: `d_x = 0.5 - b'_x`, `d_y = 0.5 - b'_y`

Final DCM (as percentage):

```
DCM = 100 * sqrt(d_x^2 + d_y^2)
```

Lower DCM = higher balance.

**Empirical validation:** N = 16 participants, 130 stimuli. DCM correlated with subjective balance ratings: r = -0.822, p < 0.001, **R² = 0.675**. DCM outperformed all other objective measures tested.

### APB Symmetry Decomposition

**Source:** Wilson, A. & Chatterjee, A. (2005). "The assessment of preference for balance." *Empirical Studies of the Arts*, 23(2), 165–180.

Decomposes an image into symmetry measures across four axes (horizontal, vertical, main diagonal, anti-diagonal), each computed in two ways (halves and inner-outer):

```
Divide image into four vertical strips A1-A4.
h     = (|[f(A1) + f(A2)] - [f(A3) + f(A4)]| / N) * 100
h_io  = (|[f(A1) + f(A4)] - [f(A2) + f(A3)]| / N) * 100
```

Analogous measures for vertical (`v`, `v_io`), main diagonal (`md`, `md_io`), anti-diagonal (`ad`, `ad_io`). The APB score is the mean of all eight partial measures. Lower = more balanced.

**Empirical validation:** Multiple regression R² = 0.751, F(8,121) = 45.5, p < 0.001. Horizontal component had the largest standardized beta.

### Arnheim's Visual Weight Factors

**Source:** Arnheim, R. (1974). *Art and Visual Perception*. University of California Press.

Qualitative factors affecting visual weight, applicable to computing element-level mass for DCM:

```
visual_weight(element) = f(area, luminance_inverse, saturation, warmth, regularity, distance_from_center)
```

- Larger area = heavier
- Darker value = heavier
- Higher saturation = heavier
- Warm colors (red, orange) = heavier than cool (blue, green)
- Regular shapes = heavier than irregular
- Distance from center acts as lever arm (moment = weight × distance)

## Gestalt Proximity Formalization

**Sources:** Kubovy, M. & Wagemans, J. (1995), *Psychological Science*; Kubovy, M., Holcombe, A. O., & Wagemans, J. (1998), *Cognitive Psychology*; Kubovy, M. & van den Berg, M. (2008), *Psychological Review*.

### The Pure Distance Law

The probability of perceiving grouping along a given orientation is a distance-decay function:

```
log(p_k / p_base) = -alpha * (d_k / d_base - 1)
```

where `d_k` is the center-to-center distance between elements along orientation `k`, `d_base` is the shortest inter-element distance, and `alpha` is the empirically fitted attraction constant.

**Key finding:** Grouping strength depends only on the **ratio** of local distances, not absolute distances.

**Extension with similarity** (Kubovy & van den Berg, 2008):

```
log(p_k / p_base) = -alpha * (d_k / d_base - 1) + beta * delta_L
```

where `delta_L` is the luminance difference supporting grouping and `beta` is the similarity weight.

**Application:** This formalizes the Gestalt proximity threshold from `SPATIAL_GUIDE.md` Phase 2 § Gestalt Proximity Threshold (`within_group_spacing < between_group_spacing * 0.5`) as a special case of the pure distance law.

### Continuity as Curvature Minimization

The visual system prefers contours that minimize total curvature:

```
minimize: INTEGRAL(kappa(s)^2 ds)
```

where `kappa(s)` is the curvature at arc-length parameter `s`. This is equivalent to the Euler elastica problem — connecting elements with smooth, low-curvature paths produces stronger perceived continuity.

**Source:** Ullman, S. (1976). "Filling-in the gaps." *Biological Cybernetics*.

## Constraint-Based Layout

Inspired by the Penrose system (CMU), which provides a fully declarative, constraint-based diagram generation approach.

**Source:** Penrose System (penrose.cs.cmu.edu); Ye et al. (2020), *SIGGRAPH 2020*.

### Constraint Catalog

Spatial relationship constraints an agent can declare and solve:

| Category | Constraints | Purpose |
|---|---|---|
| Containment | `contains(outer, inner)`, `containsWithPadding(outer, inner, pad)` | Nesting, grouping |
| Overlap | `overlapping(a, b)`, `disjoint(a, b)` | Venn diagrams, exclusion |
| Proximity | `near(a, b, dist)`, `notTooClose(a, b, min)`, `touching(a, b)` | Gestalt grouping |
| Direction | `above(a, b)`, `below(a, b)`, `leftOf(a, b)`, `rightOf(a, b)` | Spatial metaphors |
| Distribution | `distributeHorizontally(elements, gap)`, `distributeVertically(elements, gap)` | Even spacing |
| Geometry | `perpendicular(l1, l2)`, `collinear(a, b, c)`, `isRegular(polygon)` | Structural alignment |
| Comparison | `equal(a.width, b.width)`, `lessThan(a.height, maxH)` | Size coordination |

### Solving Approach

Constraints are satisfied via numerical optimization (gradient descent on a differentiable energy function) or constraint propagation (Cassowary linear solver for layout constraints).

**Cassowary constraint format** (for linear constraints):

```
a_1*x_1 + a_2*x_2 + ... + a_n*x_n  {=, <=, >=}  c    [strength: required|strong|medium|weak]
```

**Source:** Badros, G. J., Borning, A. & Stuckey, P. J. (2001). "The Cassowary Linear Arithmetic Constraint Solving Algorithm." *ACM TOPLAS*, 23(4), 462–513.

## Proportion Systems

### Golden Ratio

```
phi = (1 + sqrt(5)) / 2 ~= 1.6180339887
```

**Golden section division:** Place the primary focal element at approximately 61.8% / 38.2% of the composition frame, rather than at the midpoint.

**Empirical caveat:** The claim that phi is universally preferred is contested. Fechner (1876) found slight preference for golden rectangles, but effect sizes were small and subsequent replications mixed. Modern meta-analyses suggest the preference is real but modest and culturally modulated. Treat as a default to deviate from intentionally, not a law.

**Source:** Livio, M. (2002). *The Golden Ratio*. Broadway Books.

### Rule of Thirds

Divide the composition into a 3x3 grid. Place key elements at the four intersection points.

**Formalization** (Bhattacharya et al. 2010):

```
F = (1 / (H * W)) * [||x_0 - s_1||, ||x_0 - s_2||, ||x_0 - s_3||, ||x_0 - s_4||]
```

where `x_0` is the saliency center of mass and `s_i` are the four rule-of-thirds points at `(W/3, H/3)`, `(2W/3, H/3)`, `(W/3, 2H/3)`, `(2W/3, 2H/3)`.

**Relationship to golden ratio:** Golden ratio divides at ~38.2%/61.8%; rule of thirds at 33.3%/66.7%. Close but not identical. They emerged independently.

## Layout Algorithms

The agent selects algorithm based on data structure:

| Algorithm | Input Structure | Output | Best For |
|---|---|---|---|
| Force-directed | Graph (nodes + edges) | Node positions | Relationship diagrams, networks |
| Treemap | Hierarchical (tree + values) | Nested rectangles | Space-filling, proportion visualization |
| Circle packing | Hierarchical (tree + values) | Nested circles | Organic hierarchy, set containment |
| Voronoi tessellation | Seed points | Cell partitions | Territory, proximity-based regions |
| Constraint solver | Constraints | Element positions | Structured diagrams, labeled layouts |

### Force-Directed Layout

**Sources:** Fruchterman, T. M. J. & Reingold, E. M. (1991), *Software: Practice and Experience*; Kamada, T. & Kawai, S. (1989), *Information Processing Letters*.

**Fruchterman-Reingold model:**

```
f_rep(d) = -k^2 / d        (repulsive: between all node pairs)
f_att(d) = d^2 / k          (attractive: between connected nodes)

where k = C * sqrt(area / |V|)    (ideal edge length)
```

**Kamada-Kawai stress minimization:**

```
E = SUM_{i<j} k_ij * (|p_i - p_j| - l_ij)^2
```

where `l_ij` is the ideal distance (proportional to graph-theoretic distance) and `k_ij = K / l_ij^2`.

### Treemap Layout

**Source:** Bruls, M., Huizing, K. & van Wijk, J. J. (2000). "Squarified Treemaps." *Joint Eurographics / IEEE TCVG Symposium*.

Squarified treemap algorithm minimizes worst aspect ratio:

```
worst_ratio = max(max(w^2 * r_i / s^2, s^2 / (w^2 * r_i)))   for all i in row
```

where `s = SUM(r_i)` and `w` is the row width.

### Circle Packing

Hierarchical circle packing places child circles within parent circles. Recursive application with iterative relaxation minimizes wasted space. The front-chain algorithm maintains a frontier of placed circles and greedily places each new circle tangent to two frontier circles.

**Source:** Wang, W. et al. (2006). "Visualization of large hierarchical data by circle packing." *CHI 2006*.

---

## Phase 4: Aesthetic Validation (Agent Verification)

Phase 2 produces shape primitives. Phase 3 composes them into illustrations. Phase 4 verifies that the result meets quantitative aesthetic thresholds and is congruent with the color and spatial systems.

**IMPORTANT: The agent MUST write code to run the math then execute it, NEVER attempt to compute values directly. Strict mathematical adherence!**

## Complexity Metrics

### Fractal Dimension (Box-Counting)

**Sources:** Taylor, R. P. et al. (1999), *Nature*; Spehar, B. et al. (2003), *Computers & Graphics*; Taylor et al. (2011), *Frontiers in Human Neuroscience*.

```
D = lim(epsilon->0) [log(N(epsilon)) / log(1/epsilon)]
```

Overlay the image with boxes of side length `epsilon`. Count boxes `N(epsilon)` containing part of the pattern. Plot `log(N)` vs. `log(1/epsilon)`; the slope is D.

**Preferred fractal dimension:**

| Pattern Type | Preferred D Range | Notes |
|---|---|---|
| Statistical fractals (nature) | **1.3–1.5** | Most prevalent in nature and species-rich habitats |
| Exact fractals (geometric) | Higher D preferred | Precise repetition shifts optimum upward |
| Human eye search pattern | D = 1.5 | Intrinsic eye movement traces fractal at D ~1.5 |

**Stress reduction:** Viewing natural fractal patterns (D = 1.3–1.5) reduces physiological stress by up to 60% (Taylor, University of Oregon lab).

**"Fractal fluency" hypothesis:** The visual system is tuned to efficiently process fractal complexities found in nature, producing both aesthetic pleasure and restorative outcomes when D matches the eye's intrinsic search pattern of approximately 1.5.

**Validation threshold:**

```
For illustrations targeting aesthetic pleasure:
  assert 1.2 <= D <= 1.6
For geometric/technical diagrams:
  D constraint relaxed (structure clarity takes priority over fractal fluency)
```

### Machado-Cardoso Aesthetic Measure

**Source:** Machado, P. & Cardoso, A. (1998). "Computing aesthetics." *Proc. 14th Brazilian Symposium on AI*; Machado et al. (2015), *Acta Psychologica*.

```
AM = IC / PC
```

where:
- **IC** (Image Complexity) — estimated via JPEG compression ratio: `IC = compressed_size / raw_size`. Higher ratio = lower complexity.
- **PC** (Processing Complexity) — estimated via compression ratio of the edge-detected image. Edge detection → compression approximates structural processing complexity.

Images with high IC but low PC (rich visual content that is easy to parse structurally) score highest — matching the Berlyne model: complex but comprehensible.

### Shannon Entropy

**Source:** Shannon, C. E. (1948). *Bell System Technical Journal*.

```
H = -SUM(p_i * log2(p_i))
```

where `p_i` is the probability of intensity level `i` (for tonal complexity) or orientation bin `i` (for edge-orientation entropy).

**Application:** Edge-orientation entropy — measuring how evenly luminance edges distribute across orientations — predicts aesthetic ratings for man-made images (Redies et al. 2018, *Frontiers in Neuroscience*).

### Berlyne's Inverted-U Curve

**Source:** Berlyne, D. E. (1971). *Aesthetics and Psychobiology*. Appleton-Century-Crofts.

Aesthetic appreciation follows an inverted-U relationship with complexity:

```
Too simple (low D, low H)  -->  boring, trivial
Optimal middle range        -->  maximum aesthetic pleasure
Too complex (high D, high H) -->  overwhelming, incomprehensible
```

This applies across visual art, music, and cinema. The optimal range corresponds to fractal dimension D = 1.3–1.5 and moderate entropy.

## Balance Validation

```
For every composed illustration:
  compute DCM
  assert DCM < 10.0   (highly balanced)
  warn if DCM > 15.0  (noticeable imbalance)

  For intentionally asymmetric compositions:
    DCM threshold relaxed
    but document the asymmetry rationale
```

## Diagram Effectiveness Checklist

For every instructional diagram, verify these principles are satisfied:

```
Spatial Contiguity (d = 1.10):
  Labels placed directly adjacent to elements they describe.
  No separate legend when labels can be integrated.

Coherence (d = 0.86):
  Every visual element serves a communicative purpose.
  No decorative elements that do not support the message.

Signaling (d = 0.41):
  Visual hierarchy guides attention through the diagram.
  Key elements distinguished by size, weight, or semantic color.

Redundant Encoding (WCAG 1.4.1):
  Every color signal paired with a non-color indicator (shape, label, pattern).
  See COLOR_GUIDE.md Phase 3 § Color-Only Information.
```

## Congruence Check

Verify alignment with the color and spatial token systems:

```
For each illustration element:
  color_PAD   = PAD vector from color properties (from COLOR_GUIDE.md)
  spatial_PAD = PAD vector from spatial properties (from SPATIAL_GUIDE.md)
  shape_PAD   = PAD vector from shape properties (this guide)

  congruence_check:
    |color_PAD.pleasure - shape_PAD.pleasure| <= 1 tier
    |spatial_PAD.dominance - shape_PAD.dominance| <= 1 tier
    |color_PAD.arousal - shape_PAD.arousal| <= 1 tier

  Incongruence red flags:
    Angular shapes + high-curvature spatial tokens → shape says "threat," space says "warm"
    Organic noise + geometric spatial grid → shape says "natural," layout says "rigid"
    High-complexity illustration + minimal color palette → visual density mismatch
    Rounded shapes + error semantic color → shape says "safe," color says "danger"
```

## Extended Validation Checklist

For every generated illustration, verify:

**Shape Primitives:**
- [ ] All shapes generated from parametric formulas (superellipse, Bezier, superformula)
- [ ] Shape exponents/parameters documented for reproducibility
- [ ] Shapes snap to spatial grid (`--space-*` tokens from `SPATIAL_GUIDE.md`)
- [ ] Preferred angles used (15°, 30°, 45°, 60°, 75°, 90°) or deviations justified
- [ ] Minimum feature size ≥ 1 grid unit (FHWA symbol constraint)

**Composition:**
- [ ] DCM < 10.0 (or intentional asymmetry documented)
- [ ] Gestalt proximity threshold met: within-group spacing < between-group spacing × 0.5
- [ ] Layout algorithm appropriate for data structure (force-directed for graphs, treemap for hierarchies)
- [ ] Spatial contiguity: labels adjacent to elements (Mayer, d = 1.10)
- [ ] Coherence: no decorative elements without communicative purpose (Mayer, d = 0.86)

**Aesthetic Quality:**
- [ ] Fractal dimension D in range 1.2–1.6 (for organic illustrations)
- [ ] Berlyne complexity in optimal range (not too simple, not too complex)
- [ ] Shannon entropy computed and within expected range for illustration type
- [ ] Machado-Cardoso AM > threshold (high image complexity, low processing complexity)

**Color and Spatial Congruence:**
- [ ] All colors from semantic token system (`--visual-*` tokens from `DESIGN_SYSTEM.md`)
- [ ] Shape PAD vector within ±1 tier of color PAD vector on all dimensions
- [ ] Shape PAD vector within ±1 tier of spatial PAD vector on all dimensions
- [ ] No incongruence red flags (see Congruence Check above)

**Accessibility:**
- [ ] Every color signal has redundant encoding (WCAG 1.4.1)
- [ ] Minimum contrast for text within illustrations meets APCA thresholds (see `COLOR_GUIDE.md` Phase 3)
- [ ] Illustrations function in both light and dark mode
- [ ] No seizure-risk content (no large-area saturated red transitions, no flashing > 3 Hz)
- [ ] `prefers-reduced-motion` respected for animated illustrations

**Technical Output:**
- [ ] SVG output is valid and well-formed
- [ ] All path data uses standard commands (M, L, C, A, Z)
- [ ] No hardcoded color values — all colors reference CSS custom properties
- [ ] File size within budget (< 50 KB for icons, < 200 KB for full illustrations)

---

## References

### Shape Perception & Psychophysics
- **Bar, M. & Neta, M.** — "Humans prefer curved visual objects" (*Psychological Science*, 2006, 17(8), 645–648). Curvature preference at 84ms subliminal exposure.
- **Bar, M. & Neta, M.** — "Visual elements of subjective preference modulate amygdala activation" (*Neuropsychologia*, 2007, 45(10), 2191–2200). fMRI: sharp contours activate amygdala bilaterally.
- **Leder, H., Tinio, P. P. & Bar, M.** — "Emotional valence modulates the preference for curved objects" (*Perception*, 2011, 40(6), 649–655). Curvature preference only significant for positive/neutral valence.
- **Ramachandran, V. S. & Hubbard, E. M.** — "Synaesthesia — A window into perception, thought and language" (*J. Consciousness Studies*, 2001, 8(12), 3–34). Bouba/kiki effect formalization.
- **Kohler, W.** — *Gestalt Psychology* (Liveright, 1929). Original maluma/takete observation.
- **Fort, M., Schwartz, J.-L. & Boulle, G.** — "Resolving the bouba-kiki effect enigma by rooting iconic sound symbolism in physical properties of round and spiky objects" (*Scientific Reports*, 2022, 12, 19172). Balance x Continuity model, R² = 0.60.
- **Chuquichambi, E. G., Palumbo, L., Rey, G. D. & Munar, E.** — "How universal is preference for visual curvature?" (CBS working paper). Meta-analysis: Hedges' g = 0.39.
- **Dehaene, S. et al.** — "Neural mechanisms of geometric shape perception" (*eLife*, 2025, reviewed preprint 106464). Geometric intuition linked to mathematical cognition.
- **Lundholm, H.** — "The affective tone of lines" (*Psychological Review*, 1921). Curved = gentle/quiet; angular = agitating/hard/furious.
- **Aronoff, J., Barclay, A. M. & Stevenson, L. A.** — "The recognition of threatening facial stimuli" (*J. Personality and Social Psychology*, 1992). V-shapes → anger association.
- **Larson, C. L., Aronoff, J. & Stearns, J. J.** — "The shape of threat" (*Emotion*, 2007). Angular → anger; rounded → happiness.

### Conceptual Metaphor & Spatial Cognition
- **Lakoff, G. & Johnson, M.** — *Metaphors We Live By* (University of Chicago Press, 1980). Conceptual Metaphor Theory and image schemas.
- **Casasanto, D. & Bottini, R.** — "Spatial metaphors in design and everyday objects" (*Frontiers in Psychology*, 2022). GOOD IS UP, GOOD IS RIGHT, mental number line.

### Multimedia Learning
- **Mayer, R. E.** — *Multimedia Learning* (2nd ed., Cambridge University Press, 2009). Dual-channel, limited-capacity, active-processing model.
- **Mayer, R. E. & Fiorella, L.** — "Principles for reducing extraneous processing in multimedia learning" (*Cambridge Handbook of Multimedia Learning*, 2nd ed., 2014). Effect sizes: spatial contiguity d = 1.10, coherence d = 0.86.

### Iconography & Symbol Design
- **FHWA-RD-03-065** — Chapter 4: Icon design guidelines (Federal Highway Administration, 2003). 20x20 grid, minimum feature size, Gestalt-based symbol principles.

### Shape Grammars & Formal Systems
- **Stiny, G. & Gips, J.** — "Shape Grammars and the Generative Specification of Painting and Sculpture" (*Information Processing 71*, 1972, pp. 1460–1465). Foundational shape grammar paper.
- **Stiny, G.** — "Introduction to Shape and Shape Grammars" (*Environment and Planning B*, 1980, 7(3), 343–351). Shape algebra formalization.
- **Knight, T.** — "Computing with ambiguity" (*Environment and Planning B*, 2003, 30(2), 165–180). Emergence in shape computation.
- **Krishnamurti, R.** — "The construction of shapes" (*Environment and Planning B*, 1981, 8(1), 5–40). First interpreter with full embedding relation.

### Parametric Curves & Procedural Generation
- **Lame, G.** — *Examen des differentes methodes employees pour resoudre les problemes de geometrie* (1818). Superellipse formulation.
- **Gielis, J.** — "A generic geometric transformation that unifies a wide range of natural and abstract shapes" (*American Journal of Botany*, 2003, 90(3), 333–338). Superformula.
- **Bezier, P.** — "Procede de definition numerique des courbes et surfaces non mathematiques" (French Patent 1,475,841, 1968). Bezier curves.
- **Perlin, K.** — "An Image Synthesizer" (*ACM SIGGRAPH*, 1985, 19(3), 287–296). Perlin noise.
- **Perlin, K.** — "Improving Noise" (*ACM Trans. Graphics*, 2002, 21(3), 681–682). Improved fade function.
- **Prusinkiewicz, P. & Lindenmayer, A.** — *The Algorithmic Beauty of Plants* (Springer-Verlag, 1990). L-systems.
- **Barnsley, M. F.** — *Fractals Everywhere* (Academic Press, 1988). IFS and Barnsley Fern.

### Visual Balance & Composition
- **Hubner, R. & Fillinger, M. G.** — "Comparison of Objective Measures for Predicting Perceptual Balance and Visual Aesthetic Preference" (*Frontiers in Psychology*, 2016, 7, 335). DCM: r = -0.822, R² = 0.675.
- **Wilson, A. & Chatterjee, A.** — "The assessment of preference for balance" (*Empirical Studies of the Arts*, 2005, 23(2), 165–180). APB score.
- **Arnheim, R.** — *Art and Visual Perception: A Psychology of the Creative Eye* (revised ed., University of California Press, 1974). Structural skeleton, visual weight factors.
- **Bhattacharya, S., Sukthankar, R. & Shah, M.** — "A framework for photo-quality assessment and enhancement based on visual aesthetics" (*Proc. ACM Multimedia*, 2010, 271–280). Rule of thirds formalization.
- **Livio, M.** — *The Golden Ratio: The Story of Phi* (Broadway Books, 2002).

### Gestalt Formalization
- **Kubovy, M. & Wagemans, J.** — "Grouping by proximity and multistability in dot lattices" (*Psychological Science*, 1995, 6(4), 225–234). Pure distance law.
- **Kubovy, M., Holcombe, A. O. & Wagemans, J.** — "On the lawfulness of grouping by proximity" (*Cognitive Psychology*, 1998, 35(1), 71–98).
- **Kubovy, M. & van den Berg, M.** — "The whole is equal to the sum of its parts" (*Psychological Review*, 2008, 115(1), 131–154). Proximity + similarity additivity.
- **Ullman, S.** — "Filling-in the gaps" (*Biological Cybernetics*, 1976). Continuity as curvature minimization.
- **Feldman, J.** — "Perceptual grouping by selection of a logically minimal model" (*Int. J. Computer Vision*, 2003, 55(1), 5–25). Closure as MDL.

### Computational Aesthetics
- **Taylor, R. P., Micolich, A. P. & Jonas, D.** — "Fractal analysis of Pollock's drip paintings" (*Nature*, 1999, 399, 422).
- **Spehar, B., Clifford, C. W. G., Newell, B. R. & Taylor, R. P.** — "Universal aesthetic of fractals" (*Computers & Graphics*, 2003, 27(5), 813–820).
- **Taylor, R. P., Spehar, B., Van Donkelaar, P. & Hagerhall, C. M.** — "Perceptual and physiological responses to Jackson Pollock's fractals" (*Frontiers in Human Neuroscience*, 2011, 5, 60). D = 1.3–1.5 sweet spot.
- **Berlyne, D. E.** — *Aesthetics and Psychobiology* (Appleton-Century-Crofts, 1971). Inverted-U curve.
- **Machado, P. & Cardoso, A.** — "Computing aesthetics" (*Proc. 14th Brazilian Symposium on AI*, 1998, 219–228). AM = IC/PC.
- **Machado, P. et al.** — "Computerized measures of visual complexity" (*Acta Psychologica*, 2015, 160, 43–57).
- **Birkhoff, G. D.** — *Aesthetic Measure* (Harvard University Press, 1933). M = O/C.
- **Shannon, C. E.** — "A mathematical theory of communication" (*Bell System Technical Journal*, 1948, 27(3), 379–423).
- **Redies, C., Brachmann, A. & Hayn-Leichsenring, G. U.** — "Edge-orientation entropy predicts preference for diverse types of man-made images" (*Frontiers in Neuroscience*, 2018, 12, 678).
- **Hasler, D. & Suesstrunk, S. E.** — "Measuring colorfulness in natural images" (*Proc. SPIE*, 2003, 5007, 87–95). Colorfulness formula.

### Layout Algorithms
- **Fruchterman, T. M. J. & Reingold, E. M.** — "Graph drawing by force-directed placement" (*Software: Practice and Experience*, 1991, 21(11), 1129–1164).
- **Kamada, T. & Kawai, S.** — "An algorithm for drawing general undirected graphs" (*Information Processing Letters*, 1989, 31(1), 7–15).
- **Badros, G. J., Borning, A. & Stuckey, P. J.** — "The Cassowary Linear Arithmetic Constraint Solving Algorithm" (*ACM TOPLAS*, 2001, 23(4), 462–513).
- **Bruls, M., Huizing, K. & van Wijk, J. J.** — "Squarified Treemaps" (*Joint Eurographics / IEEE TCVG Symposium on Visualization*, 2000, 33–42).
- **Wang, W. et al.** — "Visualization of large hierarchical data by circle packing" (*CHI 2006*, 517–520).

### Industry Systems
- **IBM Design Language** — Illustration system (ibm.com/design/language/illustration). 8px grid, shape primitives, angle constraints, radii rules.
- **Penrose System** — Constraint-based mathematical diagram generation (penrose.cs.cmu.edu). Domain/Substance/Style DSL. Ye et al. (2020), *SIGGRAPH 2020*.
- **Bertin, J.** — *Semiologie Graphique* (1967). Visual encoding channels.
- **Munzner, T.** — *Visualization Analysis and Design* (CRC Press, 2014). Channel effectiveness ranking.

### Data Visualization
- **Wilkinson, L.** — *The Grammar of Graphics* (Springer, 2005). Formal framework for data-to-visual mapping.
- **Okabe, M. & Ito, K.** — "Color Universal Design" (2002). CVD-safe categorical palette. (See `COLOR_GUIDE.md` Phase 3.)
