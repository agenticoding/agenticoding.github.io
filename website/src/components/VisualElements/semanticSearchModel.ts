// Geometry, query-match content and the step schedule for SemanticSearchDiagram
// ("query time: match one question against the index the embedding figure built").
// The figure renders EmbeddingIndexDiagram's own tiles and graph through
// EmbeddingTiles, so this model owns only what is genuinely new: where the query
// enters, which stored vectors answer, and when each beat happens. The vector
// space itself (SCATTER_DOTS/GRAPH_EDGES) is imported, never redefined — querying
// an index does not rebuild it.

import {
  DOT_ENTRY_MS,
  FADE_OUT_MS,
  GEAR_TURN_MS,
  MOBILE_HOP_CLEARANCE,
  SCATTER_DOTS,
  TRAIN_LANE_INSET,
  TRAVEL_MS,
  distance,
  dotAt,
  flowPath,
  flowPathV,
  lanePath,
  lanePathV,
  scatterRegion,
  type Region,
} from './embeddingIndexModel.ts';
import { tokenTrainBeginOffsetMs } from './TokenTrainTiming.ts';

// --- Canvas (same framing as EmbeddingIndexDiagram) ------------------------
// Same canvas, same tile sizes and same flow line as the build figure: the
// corpus tile is swapped for the query chip, so the two figures read as one
// pipeline at two moments. The index tile is where the vector space lives.
export const DESKTOP = {
  canvas: { width: 900, height: 328 },
  queryChip: { x: 24, y: 144, width: 160, height: 72 },
  model: { x: 288, y: 112, width: 160, height: 136 },
  index: { x: 552, y: 24, width: 320, height: 272 },
  flowY: 180,
} as const;

export const MOBILE = {
  canvas: { width: 340, height: 734 },
  // The chip holds the question and nothing else, so it stands shorter than the
  // build figure's corpus tile.
  queryChip: { x: 52, y: 24, width: 236, height: 88 },
  model: { x: 76, y: 218, width: 188, height: 136 },
  // Wider than the build figure's corpus tile: at 236 the long passage labels
  // ("on-call pay") run past the tile edge, so the query figure gives the graph
  // the full width it needs. The HEIGHT is the build figure's (see its MOBILE.index,
  // which owns the floor): both figures draw the same index tile, at one size.
  index: { x: 20, y: 478, width: 300, height: 240 },
  flowX: 170,
} as const;

// --- Trains ----------------------------------------------------------------
// Two hops, exactly as the build figure: the question's tokens ride into the
// model, then the model's output rides into the index. Both are the shared
// train specs, so pacing and the reduced-motion parked layout match the book.
// Both mobile hops hold only the train they carry: 106u for 4 query chips and 88u for
// the single vector. The vector hop leaves the model tile
// MOBILE_HOP_CLEARANCE.annotation below its edge, exactly as the build figure does,
// so the chip never rides the "query → vector" annotation that labels it.
export type QueryTrainSpec = { tokens: number; spacing: number };

export const QUERY_TRAIN: QueryTrainSpec = { tokens: 4, spacing: 24 };
export const QUERY_VECTOR_TRAIN: QueryTrainSpec = { tokens: 1, spacing: 28 };

export type QueryHop = 'query' | 'vector';

/** The connector and the inset lane each train rides, per layout. */
export function trainPaths(
  hop: QueryHop,
  layout: 'desktop' | 'mobile'
): { d: string; lane: string } {
  if (layout === 'desktop') {
    const [from, to] =
      hop === 'query'
        ? [DESKTOP.queryChip, DESKTOP.model]
        : [DESKTOP.model, DESKTOP.index];
    return {
      d: flowPath(from, to, DESKTOP.flowY),
      lane: lanePath(from, to, DESKTOP.flowY),
    };
  }
  const [fromY, toY] =
    hop === 'query'
      ? [MOBILE.queryChip.y + MOBILE.queryChip.height, MOBILE.model.y]
      : [
          MOBILE.model.y +
            MOBILE.model.height +
            MOBILE_HOP_CLEARANCE.annotation,
          MOBILE.index.y,
        ];
  return {
    d: flowPathV(MOBILE.flowX, fromY, toY),
    lane: lanePathV(MOBILE.flowX, fromY, toY),
  };
}

// Lane lengths per hop, sized on whichever layout's gap is longer: one shared
// schedule drives both canvases, so no beat can finish later on the slower one.
const HOP_LENGTH = {
  desktop: {
    query: DESKTOP.model.x - (DESKTOP.queryChip.x + DESKTOP.queryChip.width),
    vector: DESKTOP.index.x - (DESKTOP.model.x + DESKTOP.model.width),
  },
  mobile: {
    query: MOBILE.model.y - (MOBILE.queryChip.y + MOBILE.queryChip.height),
    vector:
      MOBILE.index.y -
      (MOBILE.model.y + MOBILE.model.height + MOBILE_HOP_CLEARANCE.annotation),
  },
} as const;

export const LANE_LENGTH: Record<QueryHop, number> = {
  query:
    Math.max(HOP_LENGTH.desktop.query, HOP_LENGTH.mobile.query) -
    2 * TRAIN_LANE_INSET,
  vector:
    Math.max(HOP_LENGTH.desktop.vector, HOP_LENGTH.mobile.vector) -
    2 * TRAIN_LANE_INSET,
};

function staggerFor(train: QueryTrainSpec) {
  return { mode: 'pathSpacing' as const, spacingPx: train.spacing };
}

/** When a train is fully in: the moment its beat ends. */
export function trainArrivalMs(hop: QueryHop, train: QueryTrainSpec): number {
  const last = tokenTrainBeginOffsetMs(
    train.tokens - 1,
    LANE_LENGTH[hop],
    staggerFor(train),
    TRAVEL_MS
  );
  return last + TRAVEL_MS;
}

export function queryFlowTiming(startDelayMs: number) {
  return {
    cycleMs: SEARCH_LOOP_MS,
    travelMs: TRAVEL_MS,
    fadeMs: 400,
    repeat: 'loop',
    startDelayMs,
  } as const;
}

// --- Query match -----------------------------------------------------------
// The one question the figure asks and the stored vectors that answer. Labels
// are the query figure's own contents — same geometry as the build figure, so the
// reader recognises the space: a question about clinician pay lands on pay-related
// passages and stays far from an unrelated one.
export type QueryMatch = {
  /** The query vector's position in the scatter region, normalized 0..1. */
  point: { nx: number; ny: number };
  /** Stored-vector ids that answer, nearest first. */
  nearest: readonly string[];
  /** Display labels for this figure's vectors; ids not listed keep their build label. */
  labels: Readonly<Record<string, string>>;
  /** The query's similarity to its nearest vectors, drawn on each match line. */
  similarity: string;
};

export const QUERY_MATCH: QueryMatch = {
  point: { nx: 0.6, ny: 0.35 },
  nearest: ['cat', 'feline'],
  labels: {
    cat: 'physician salary',
    feline: 'on-call pay',
    rocket: 'recipe',
  },
  similarity: '0.91',
};

/** The point the query vector lands on inside a layout's scatter region. */
export function queryLandsAt(
  region: Region,
  match: QueryMatch = QUERY_MATCH
): { x: number; y: number } {
  return {
    x: region.x + match.point.nx * region.width,
    y: region.y + match.point.ny * region.height,
  };
}

/** The nearest stored vectors to a query point, measured in the real scatter
 * region: the model's own answer key, asserted in the tests so the drawn match
 * can never contradict the geometry. */
export function nearestDotIds(
  point: { nx: number; ny: number },
  count = 2,
  region: Region = scatterRegion(DESKTOP.index, false)
): string[] {
  const at = {
    x: region.x + point.nx * region.width,
    y: region.y + point.ny * region.height,
  };
  return [...SCATTER_DOTS]
    .sort(
      (a, b) => distance(dotAt(a, region), at) - distance(dotAt(b, region), at)
    )
    .slice(0, count)
    .map((dot) => dot.id);
}

// --- Step schedule ---------------------------------------------------------
// One clock, one cycle, strict causal order, and each beat begins only when the
// one before it has ENDED:
//   the chip states the question → the question's tokens ride into the model →
//   the gear turns (the embedding pass) → the model's vector rides into the index
//   → the query vector fades in inside the vector space → its nearest links trace
//   and their rings answer → the finished match holds → the overlay rolls back at
//   the wrap so the query can replay over a still index.
// Nothing is hand-tuned: each start IS the previous arrival, and the tail follows
// the book's hold-then-roll-back convention.
export const QUERY_BEAT_MS = 400; // the chip states the question
export const QUERY_TRAIN_START_MS = QUERY_BEAT_MS;
export const QUERY_TRAIN_ARRIVAL_MS =
  QUERY_TRAIN_START_MS + trainArrivalMs('query', QUERY_TRAIN);
export const GEAR_START_MS = QUERY_TRAIN_ARRIVAL_MS;
export const GEAR_END_MS = GEAR_START_MS + GEAR_TURN_MS;
export const VECTOR_TRAIN_START_MS = GEAR_END_MS;
export const VECTOR_TRAIN_ARRIVAL_MS =
  VECTOR_TRAIN_START_MS + trainArrivalMs('vector', QUERY_VECTOR_TRAIN);
// The delivered vector then appears in the space and settles before it can match.
export const QUERY_VECTOR_IN_MS = VECTOR_TRAIN_ARRIVAL_MS;
export const MATCH_MS = QUERY_VECTOR_IN_MS + DOT_ENTRY_MS;
export const MATCH_STAGGER_MS = 260; // one nearest link waits for the one before it
export const MATCH_DRAW_MS = 350;
export const MATCH_END_MS =
  MATCH_MS +
  MATCH_STAGGER_MS * (QUERY_MATCH.nearest.length - 1) +
  MATCH_DRAW_MS;
export const END_HOLD_MS = 2000;
export const FADE_OUT_START_MS = MATCH_END_MS + END_HOLD_MS;
export const SEARCH_LOOP_MS = FADE_OUT_START_MS + FADE_OUT_MS;

/** The gear owns the embedding beat: exactly one revolution between the query
 * train arriving and the vector train departing, so its orientation is identical
 * at every loop boundary. */
export const GEAR_BEAT = {
  startMs: GEAR_START_MS,
  turnMs: GEAR_TURN_MS,
  turns: 1,
  loopMs: SEARCH_LOOP_MS,
} as const;
