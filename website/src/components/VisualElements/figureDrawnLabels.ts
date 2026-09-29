/**
 * Words a diagram draws inside its own artwork, by component name.
 *
 * A sighted reader can see them; a listener cannot. Audio that names one (see
 * `src/audiobook/drawnLabels.ts`) is reading the drawing aloud instead of voicing the
 * idea it carries — the defect class that shipped in `llm-reliability-limits`.
 *
 * This map is the single source of truth for drawn text: an entry must appear
 * verbatim, case-insensitively, in the component named by its key, and
 * `figureDrawnLabels.test.ts` fails when that stops holding. So renaming or deleting
 * drawn text must come back here — a stale entry over-protects the guard, a missing
 * one silently weakens it, and only the test makes either visible.
 *
 * List only what is actually painted on the page, in the component that paints it.
 */
export const figureDrawnLabels: Record<string, readonly string[]> = {
  ProbabilityIsNotLogicDiagram: [
    'premises',
    'entailed',
    'probable continuation',
  ],
  ErrorReasonComparisonDiagram: [
    'error funnel',
    'causal story',
    'targeted review',
    'flawless analysis',
    'wrong prediction',
    'random distribution',
    'statistical fluctuation',
  ],
  LocalChoicesGlobalCoherenceDiagram: [
    'trust earned',
    'surprise fee',
    'cart abandoned',
  ],
};
