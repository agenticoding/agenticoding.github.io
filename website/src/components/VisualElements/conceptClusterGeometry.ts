// Geometry for ConceptCluster (ConceptCluster.tsx stays presentational).
// A .ts module so the figures' models and their tests can share these numbers
// instead of restating them — cf. TokenUnitGeometry / diagramGeometryCore.

import { ARRIVAL_BEAT } from './diagramBeat.ts';

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

/** How long the whole cluster's beat lasts: one step per later item, plus one
 * window for the item that starts last. */
export function conceptBeatSpanMs(items: number): number {
  return CONCEPT_BEAT_STEP_MS * Math.max(0, items - 1) + ARRIVAL_BEAT.windowMs;
}
