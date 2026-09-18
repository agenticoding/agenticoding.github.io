// Geometry + beat for ConceptCluster (ConceptCluster.tsx stays presentational).
// A .ts module so the figures' models and their tests can share these numbers
// instead of restating them — cf. TokenUnitGeometry / diagramGeometryCore.

/** Distance from an icon's box to its label. */
export const CONCEPT_LABEL_GAP = 8;

/** Icon top → label baseline. Scales with the icon, so one anatomy fits any tile. */
export const conceptLabelBaseline = (iconSize: number) =>
  Math.round(iconSize * 0.66);

/** Room a cell must leave beside its icon for its label: the type is 11px mono, and
 * the longest word the corpus uses ("spec") renders 27.6u wide, so 30 keeps a real
 * gutter instead of touching the next cell's icon. */
export const CONCEPT_LABEL_ROOM = 30;

/** The item beat's per-item step: the cluster answers one kind after another. */
export const CONCEPT_BEAT_STEP_MS = 180;

/** The beat's shape. Its window is an ABSOLUTE duration (not a fraction of the
 * cycle), so a figure can schedule "the cluster answers, then the flow starts" on
 * one clock: the pulse stays 900ms whether the figure loops in 7.4s or 8.8s.
 * `peakAt`/`settleAt` are fractions of that window; the scales are the nudge and
 * its echo, matching every other arrival beat in the book. */
export const CONCEPT_BEAT = {
  windowMs: 900,
  peakAt: 0.25,
  settleAt: 0.56,
  peakScale: 1.07,
  settleScale: 1.015,
} as const;

/** How long the whole cluster's beat lasts: one step per later item, plus one
 * window for the item that starts last. */
export function conceptBeatSpanMs(items: number): number {
  return CONCEPT_BEAT_STEP_MS * Math.max(0, items - 1) + CONCEPT_BEAT.windowMs;
}

/** The beat's keyframes, generated from the window above plus the figure's own
 * cycle. They cannot live in the stylesheet: a fixed window over a figure-defined
 * cycle only becomes percentages once the cycle is known. */
export function conceptBeatCss(name: string, cycleMs: number): string {
  const at = (ms: number) => `${((ms / cycleMs) * 100).toFixed(2)}%`;
  const scale = (value: number) => `transform: scale(${value})`;
  const window = CONCEPT_BEAT.windowMs;
  return [
    `@keyframes ${name} {`,
    `0% { ${scale(1)}; }`,
    `${at(window * CONCEPT_BEAT.peakAt)} { ${scale(CONCEPT_BEAT.peakScale)}; }`,
    `${at(window * CONCEPT_BEAT.settleAt)} { ${scale(
      CONCEPT_BEAT.settleScale
    )}; }`,
    `${at(window)}, 100% { ${scale(1)}; }`,
    `}`,
  ].join('\n');
}
