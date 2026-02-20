---
sidebar_position: 3
sidebar_label: 'Accessibility & i18n'
sidebar_custom_props:
  sectionNumber: 16
title: 'Accessibility & Internationalization'
---

Accessibility and internationalization are architectural constraints on the components from [Lesson 15](/experience-engineering/lesson-15-ui-specs) — structural decisions that affect every component, flow, and state transition. Both are specified up front, not bolted on after implementation, and both are verifiable through `snapshot -ic` — the same tool that validates agent output.

## Accessibility Architecture

Accessibility is architecture, not a checklist. Landmark structure, keyboard model, focus management, and live region strategy are structural decisions that affect every component, flow, and state transition. They are specified up front, not bolted on after implementation.

Five architectural decisions for every UI spec:

| Decision | Question | Example |
|----------|----------|---------|
| Semantic HTML | Can a native element do this? Use it before reaching for ARIA — incorrect ARIA creates *more* errors than no ARIA | `<dialog>` over `<div role="dialog">`, `<button>` over `<div onclick>` |
| Landmarks | What's the page-level navigation map for screen reader users? | `<header>`, `<nav aria-label="Main">`, `<main>`, `<aside>`, `<footer>` — label each `<nav>` distinctly |
| Keyboard model | How does every interactive element respond to keys? | Tab between elements, arrows within composite widgets, Escape closes overlays, focus trapped inside modals |
| Focus management | When the DOM changes, where does focus land? | Modal opens → heading. Modal closes → trigger. Route change → `<h1>`. Item deleted → next sibling |
| Live regions | How are async changes announced without moving focus? | Success → `aria-live="polite"`. Errors → `assertive`. Never `assertive` for routine notifications |

**Focus management is the most commonly broken aspect of component APIs.** When you remove the focused element from the DOM without explicitly moving focus first, it disappears into `<body>` — invisible to keyboard and screen reader users. Define the focus destination for every DOM change in your [flows](/experience-engineering/lesson-15-ui-specs#flows-interaction-traces).

**How agents break accessibility.** Agents default to `<div>` with ARIA roles instead of semantic HTML, add redundant `aria-label` to elements that already have visible text, and generate `tabindex="0"` on elements that are natively focusable. The semantic HTML row in the table above is the primary defense: specify `<button>` not `<div role="button">`, and the agent follows. The constraint IDs (A-001 through A-017+) are agent-readable checkpoints — include them, and the agent inlines them as code comments during implementation.

Automated tools (axe-core, Lighthouse) catch ~30% of WCAG issues. The remaining 70% requires keyboard-only testing and screen reader verification. Browser automation via `snapshot -ic` covers both — the accessibility tree reveals missing landmarks, broken focus order, and absent live regions. For **visual** correctness (layout shifts, color contrast in actual rendering, overlapping elements), complement with visual regression testing (Chromatic, Percy, Playwright's `toHaveScreenshot()`). The spec defines structural correctness; visual regression catches what the accessibility tree cannot.

The [UI spec template](/prompts/specifications/experience-spec-template) has the full table structure for landmarks, keyboard models, focus management triggers, live regions, and constraint indices.

## Internationalization Architecture

Internationalization is architecture, not string replacement. Retrofitting RTL support or pluralization into an existing codebase is an order of magnitude harder than building it in. Like accessibility, these are structural decisions specified up front.

Five architectural decisions:

| Decision | Why Architectural | Key Constraint |
|----------|------------------|----------------|
| Layout direction | RTL flips the entire spatial model — sidebar switches sides, reading order reverses, directional icons mirror | Use CSS logical properties exclusively (`inline-start`/`inline-end`, never `left`/`right`) (L-002) |
| Translation keys | Every hardcoded string is a future extraction task. Extraction cost grows non-linearly with codebase size | All text-bearing components accept keys, never hardcoded strings (L-001) |
| Pluralization | English has 2 plural forms. Arabic has 6. String concatenation and ternary operators can't express this | Use ICU MessageFormat for all pluralized strings (L-003) |
| Formatting | Dates, numbers, currencies format differently per locale (`$1,234.56` vs `1.234,56 €`) | Use `Intl` APIs with active locale, never manual formatting (L-004) |
| Locale routing | URLs must preserve locale for deep links and sharing (`/:locale/dashboard`) | Fallback chain: user preference → browser locale → default |

When LTR content (invoice IDs, emails, URLs) appears inside RTL text, the Unicode bidirectional algorithm handles most cases — but technical identifiers need explicit `dir="ltr"` markers on their containing inline element (L-005).

Agents treat internationalization as string extraction — they'll wrap visible text in `t()` calls but miss: logical CSS properties (using `left`/`right` instead of `inline-start`/`inline-end`), ICU plural forms beyond simple singular/plural, `Intl` API usage for dates and numbers, and bidirectional text markers for embedded LTR content. The constraint IDs (L-001 through L-005) in the spec are agent-readable checkpoints: include them, and the agent inlines them as code comments during implementation.

## Key Takeaways

- **Accessibility is architecture, not a checklist** — landmark structure, keyboard model, focus management, and live region strategy are structural decisions specified up front, not bolted on after implementation.

- **Accessibility is verified by the same tool that validates agent output** — `snapshot -ic` returns the accessibility tree, making verification deterministic and inclusive. One operation, two guarantees.

- **Agents default to `<div>` with ARIA roles** — specify semantic HTML explicitly (`<button>` not `<div role="button">`), and the agent follows. Incorrect ARIA creates more accessibility errors than no ARIA.

- **Focus management is the most commonly broken aspect** — define the focus destination for every DOM change in your flows, or the agent will remove focused elements without moving focus first.

- **Internationalization is architecture, not string replacement** — RTL layout direction, pluralization rules, locale-aware formatting, and bidirectional text handling are structural decisions that affect every component.

- **Constraint IDs are agent-readable checkpoints** — A-001 through A-017+ for accessibility, L-001 through L-005 for internationalization. Include them in the spec and the agent inlines them as code comments. [Lesson 17](/experience-engineering/lesson-17-verification) covers how to verify these constraints with browser automation.
