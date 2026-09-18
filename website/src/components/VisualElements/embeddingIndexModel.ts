// Pure content, geometry, scatter, and step-schedule model for
// EmbeddingIndexDiagram ("Embeddings: meaning becomes distance"). The component
// maps the normalized layouts here onto concrete SVG tiles via scatterRegion +
// toRegion; the tests assert the storytelling invariants (cat/feline CLOSE,
// rocket FAR, dots spread and in-bounds, the proximity graph the
// 1-nearest-neighbour graph, the corpus cluster naming kinds rather than chunks,
// the loop adding one dot per delivered vector and resetting cleanly, one stage
// at a time on one shared clock for both canvases).

// Runtime imports need the explicit extension: tests run under node --test.
import {
  CONCEPT_LABEL_GAP,
  conceptBeatSpanMs,
} from './conceptClusterGeometry.ts';
import { DIAGRAM_TOKEN_SIZE } from './diagramScale.ts';
import { EMOJI, emojiDisplaySize, type EmojiAsset } from './emojiAssets.ts';
import {
  tokenTrainBeginOffsetMs,
  type TokenTrainStagger,
} from './TokenTrainTiming.ts';

export type Region = { x: number; y: number; width: number; height: number };
export type Pt = { x: number; y: number };

// --- Canvas tiles (desktop 900×328, mobile portrait 340×828) --------------
// The merged vector-space/index tile replaces the old separate VECTOR SPACE
// and VECTOR INDEX tiles, so the index *is* the space it indexes.
// Mobile is a single column of tile → gap → tile. Each gap must be long
// enough that a resting token train (spacingPx * (tokens-1)) fits between the
// two borders instead of clamping onto a tile edge, and long enough for the
// annotation that names the hop.
export const DESKTOP = {
  canvas: { width: 900, height: 328 },
  // The tile is sized to its cluster (see CORPUS_CLUSTER: header + two rows + pad)
  // and centred on the flow line, so a 2×2 cluster fills it edge to edge instead of
  // floating in a tile that was built for the retired four-row list.
  corpus: { x: 24, y: 108, width: 160, height: 144 },
  // The two connectors carry equal weight, so the row is spaced evenly between
  // the tiles (104px each): an unbalanced pair reads as a loose figure, and equal
  // hops also keep the two canvases' arrival times within a few ms of each other.
  model: { x: 288, y: 112, width: 160, height: 136 },
  // The merged tile is the row's hero: it rises above its neighbours (it holds
  // the graph) but shares their baseline. Its horizontal padding (16) matches the
  // framing's own, so the graph and the titles share one margin; the vertical
  // spacing is the composition's own (see scatterRegion).
  index: { x: 552, y: 24, width: 320, height: 272 },
  flowY: 180,
} as const;
export const MOBILE = {
  canvas: { width: 340, height: 760 },
  // The column starts right under the mobile frame label, at the canvas top: the 88u
  // band the tile used to leave above itself was a blind scroll no element used.
  // The corpus is the ONE tile that differs from the desktop composition: four kinds
  // side by side need 4×(24 icon + 8 gap + CONCEPT_LABEL_ROOM) + 32 pad = 288u, which
  // the 340u canvas has but the 160u desktop tile does not. One row of four (see
  // CORPUS_CLUSTER) then stands 60 header + 24 icon + 16 pad = 100u tall — 44u shorter
  // than the desktop tile's two rows, for the same four labels at full label room.
  corpus: { x: 26, y: 24, width: 288, height: 100 },
  model: { x: 76, y: 244, width: 188, height: 136 },
  // The index tile is 240u: the compact scatter region is tile.height − 136 (see
  // scatterRegion), and 104u is the smallest region whose vertical room keeps the
  // outlier >1.9× the close pair apart — the distance story's own margin. Shorter,
  // and that ratio drops below 1.9. The retired 264u floor came from the outlier's
  // label hanging UNDER its dot, where it met the caption at the tile's foot; the
  // label now sits to the right of its dot (see EmbeddingTiles.dotLabel).
  index: { x: 52, y: 504, width: 236, height: 240 },
  flowX: 170,
} as const;

export function flowPath(from: Region, to: Region, y: number): string {
  return `M ${from.x + from.width} ${y} L ${to.x} ${y}`;
}

export function flowPathV(x: number, fromY: number, toY: number): string {
  return `M ${x} ${fromY} L ${x} ${toY}`;
}

/** A train rides INSIDE the gap, never across a tile border: an item's centre
 * rides the lane, so the lane is inset at both ends by half the widest item a
 * lane carries plus a gutter. That item is an emoji — its rendered box is the
 * wider display box (`emojiDisplaySize`), not its nominal size. */
export const TRAIN_LANE_INSET = Math.ceil(
  Math.max(DIAGRAM_TOKEN_SIZE.flow, emojiDisplaySize(DIAGRAM_TOKEN_SIZE.flow)) /
    2 +
    4
);

/** The lane a train travels: the same connector, pulled clear of both tiles. */
export function lanePath(from: Region, to: Region, y: number): string {
  return `M ${from.x + from.width + TRAIN_LANE_INSET} ${y} L ${
    to.x - TRAIN_LANE_INSET
  } ${y}`;
}

export function lanePathV(x: number, fromY: number, toY: number): string {
  return `M ${x} ${fromY + TRAIN_LANE_INSET} L ${x} ${toY - TRAIN_LANE_INSET}`;
}

// Lane lengths per layout, keyed by the hop a train rides: the connector gap
// minus the lane's inset at both ends. One shared schedule drives BOTH canvases,
// so every beat is sized on whichever layout is slower: otherwise a dot could pop
// in before its own glyph had landed on the other canvas.
export const DESKTOP_HOP = {
  chunk: DESKTOP.model.x - (DESKTOP.corpus.x + DESKTOP.corpus.width),
  vector: DESKTOP.index.x - (DESKTOP.model.x + DESKTOP.model.width),
} as const;

/** Vertical clearance a mobile hop keeps between the tile it leaves and the lane
 * its train rides: `tile` for air below the tile, `annotation` for the hop's own
 * label — the model tile draws its annotation 20u under itself, ON the lane, so a
 * lane that starts at the tile edge would run its chips across the text. Shared by
 * both pipelines, so the build and query figures start their lanes together. */
export const MOBILE_HOP_CLEARANCE = { tile: 16, annotation: 36 } as const;

// Vertical hops between the stacked mobile tiles: `start` is the y where the
// train begins (clear of the tile above and of the hop's annotation), `end` is
// the next tile's top edge. The trains themselves are the shared specs below.
// With these clearances the two lanes land on the trains' own minimum — 72u for
// 4 chunk chips, 56u for 3 vector glyphs — so nothing rests in the corridor.
export const MOBILE_HOP = {
  chunk: {
    start: MOBILE.corpus.y + MOBILE.corpus.height + MOBILE_HOP_CLEARANCE.tile,
    end: MOBILE.model.y,
  },
  vector: {
    start:
      MOBILE.model.y + MOBILE.model.height + MOBILE_HOP_CLEARANCE.annotation,
    end: MOBILE.index.y,
  },
} as const;

export type Hop = 'chunk' | 'vector';

export const LANE_LENGTH: Record<Hop, { desktop: number; mobile: number }> = {
  chunk: {
    desktop: DESKTOP_HOP.chunk - 2 * TRAIN_LANE_INSET,
    mobile:
      MOBILE_HOP.chunk.end - MOBILE_HOP.chunk.start - 2 * TRAIN_LANE_INSET,
  },
  vector: {
    desktop: DESKTOP_HOP.vector - 2 * TRAIN_LANE_INSET,
    mobile:
      MOBILE_HOP.vector.end - MOBILE_HOP.vector.start - 2 * TRAIN_LANE_INSET,
  },
};

// --- Corpus ---------------------------------------------------------------
// The corpus is an abstract knowledge base: the KINDS of text this pipeline
// indexes, drawn as concept nodes — a bare OpenMoji plus one lowercase word —
// never as sample files. Naming categories is what keeps the figure's smallest
// tile readable at a glance; the chunking itself is carried by the train, so the
// tile has no reason to itemise chunks.
export const CORPUS_CONCEPTS: readonly { label: string; icon: EmojiAsset }[] = [
  { label: 'code', icon: EMOJI.laptop },
  { label: 'docs', icon: EMOJI.books },
  { label: 'web', icon: EMOJI.globe },
  { label: 'spec', icon: EMOJI.receipt },
];

/** The corpus tile's cluster: icon + word rows that FILL the tile's content box,
 * with as many rows as its height allows and as many columns as that needs. The
 * desktop tile (160×144) takes two columns of two; the wide mobile tile (264×100)
 * fits all four in one row. `rowGap` is the minimum gap a row needs — the pitch
 * itself is whatever fills the box, so the cluster never floats in padding (the
 * wide, short sources tile in GroundingDistillationDiagram is the same object). */
export const CORPUS_CLUSTER = {
  pad: 16,
  rowGap: 20,
  contentTop: 60, // below the eyebrow (24) and the note (44)
  bottomPad: 16, // matches the tile's own padding
} as const;

/** Icon boxes for the corpus cluster, in tile coordinates (SVG user units). */
export function corpusCluster(tile: Region, iconSize: number): readonly Pt[] {
  const height =
    tile.height - CORPUS_CLUSTER.contentTop - CORPUS_CLUSTER.bottomPad;
  const rows = Math.max(
    1,
    Math.min(
      CORPUS_CONCEPTS.length,
      Math.floor(
        (height + CORPUS_CLUSTER.rowGap) / (iconSize + CORPUS_CLUSTER.rowGap)
      )
    )
  );
  const columns = Math.ceil(CORPUS_CONCEPTS.length / rows);
  const columnWidth = (tile.width - 2 * CORPUS_CLUSTER.pad) / columns;
  const pitch = rows > 1 ? (height - iconSize) / (rows - 1) : 0;
  // Reading order is the sibling tile's: left to right, then down.
  return CORPUS_CONCEPTS.map((_, index) => ({
    x: tile.x + CORPUS_CLUSTER.pad + columnWidth * (index % columns),
    y: tile.y + CORPUS_CLUSTER.contentTop + Math.floor(index / columns) * pitch,
  }));
}

/** The room a corpus cell gives its label beside its icon. */
export function corpusLabelRoom(tile: Region, iconSize: number): number {
  const height =
    tile.height - CORPUS_CLUSTER.contentTop - CORPUS_CLUSTER.bottomPad;
  const rows = Math.max(
    1,
    Math.min(
      CORPUS_CONCEPTS.length,
      Math.floor(
        (height + CORPUS_CLUSTER.rowGap) / (iconSize + CORPUS_CLUSTER.rowGap)
      )
    )
  );
  const columns = Math.ceil(CORPUS_CONCEPTS.length / rows);
  return (
    (tile.width - 2 * CORPUS_CLUSTER.pad) / columns -
    iconSize -
    CONCEPT_LABEL_GAP
  );
}

// --- Trains ---------------------------------------------------------------
// One spec per train, shared by both layouts, so pacing and the reduced-motion
// parked layout match. `spacing` must both spread the whole train inside the
// shortest connector it rides (see the hop tests) without clamping AND clear the
// item's own width by a gutter, or the chips fuse into one ribbon.
export type TrainSpec = { tokens: number; spacing: number };

// `spacing = size + 4` is the book's train convention (GroundingDistillationDiagram
// uses this exact 24 for the same 20u token). The chunk lane is only 72u, so that
// spacing fits exactly 4 chips; the six we shipped before sat 12u apart and
// overlapped into one ribbon.
export const CHUNK_TRAIN = { tokens: 4, spacing: 24 } as const;
export const VECTOR_GLYPHS = { tokens: 3, spacing: 28 } as const;

export function trainStagger(train: TrainSpec): TokenTrainStagger {
  return { mode: 'pathSpacing', spacingPx: train.spacing };
}

// --- Step schedule --------------------------------------------------------
// One shared cycle drives every animated role. Stages run in strict process
// order and CHAIN: the gear starts turning the moment the chunk train has
// landed, and the vector train departs the moment the gear has finished its
// revolution. There is no pause bracketing a train — the only plateaus left are
// the ones the reader needs (the finished graph, then the roll-back). Nothing is
// hand-tuned: a train's clear time is derived from its own stagger on the slower
// canvas, the gear owns the beat between them, and LOOP_MS is the sum of all
// beats plus the tail. The CSS keyframes are generated from these same numbers
// (EmbeddingIndexDiagram's TimingStyles), so no timing value is written twice.

export const TRAVEL_MS = 700; // one item crossing its connector
export const GEAR_TURN_MS = 1400; // the embedding pass, one beat
export const DOT_ENTRY_MS = 240; // a landed vector's dot popping into the graph

/** A staggered train keeps its connector until its last item arrives. */
export function trainClearMs(train: TrainSpec, pathLength: number): number {
  const lastBegin = tokenTrainBeginOffsetMs(
    train.tokens - 1,
    pathLength,
    trainStagger(train),
    TRAVEL_MS
  );
  return lastBegin + TRAVEL_MS;
}

/** When item `index` of a train is in, on the slower of the two canvases. */
export function itemArrivalMs(
  train: TrainSpec,
  hop: Hop,
  index: number
): number {
  const slowest = Math.max(
    ...Object.values(LANE_LENGTH[hop]).map((length) =>
      tokenTrainBeginOffsetMs(index, length, trainStagger(train), TRAVEL_MS)
    )
  );
  return slowest + TRAVEL_MS;
}

/** When a train is fully in: the moment its beat ends. */
export function trainArrivalMs(train: TrainSpec, hop: Hop): number {
  return itemArrivalMs(train, hop, train.tokens - 1);
}

// The corpus answers FIRST: its kinds light up one after another, and only when the
// last of them has answered do the chunk tokens leave for the model. The beat's
// window is absolute (see conceptClusterGeometry), so this stage is a sum of known
// durations rather than a fraction of the very loop it is part of.
export const CORPUS_BEAT_MS = conceptBeatSpanMs(CORPUS_CONCEPTS.length);

const CHUNK_CLEAR_MS = CORPUS_BEAT_MS + trainArrivalMs(CHUNK_TRAIN, 'chunk');
const GEAR_START_MS = CHUNK_CLEAR_MS;
const GEAR_END_MS = GEAR_START_MS + GEAR_TURN_MS;
const VECTOR_START_MS = GEAR_END_MS;

export const FLOW_START_MS = {
  corpus: CORPUS_BEAT_MS,
  vector: VECTOR_START_MS,
} as const;

/** When the vectors are all in: the write beat and the settle breath. */
export const LANDING_MS =
  VECTOR_START_MS + trainArrivalMs(VECTOR_GLYPHS, 'vector');

// The tail of the cycle. Aligned with the repo's other loops that roll back to
// their initial state (CompactionLineDiagram: the end state holds, then the
// restore runs INTO the loop wrap over RESTORE_MS): the finished graph holds
// END_HOLD_MS, the roll-back takes FADE_OUT_MS, and the roll-back ends exactly
// at the wrap — so the cycle's last frame equals its first, and the reader gets
// a long look at what the loop just built instead of a flash of it.
export const CONNECT_BUDGET_MS = 900; // every link lands inside this window
export const END_HOLD_MS = 2000; // how long the finished graph holds
export const FADE_OUT_MS = 600; // the roll-back into the initial state
export const FADE_OUT_START_MS = LANDING_MS + CONNECT_BUDGET_MS + END_HOLD_MS;

export const LOOP_MS = FADE_OUT_START_MS + FADE_OUT_MS;

// --- Entry beat -----------------------------------------------------------
// The index is a living structure: it already holds vectors (the standing dots
// and links) and each cycle ADDS the vectors this chunk produced, then the reset
// removes exactly those again so the write can be replayed. One arriving vector
// becomes one labelled dot at the instant its own glyph lands, and connects as
// it lands. Arrivals come from the vector train's stagger on the slower canvas;
// the last arrival IS LANDING_MS, which is why the write pulse and the settle
// breath need no retiming.
export const ENTRY_DOTS = ['cat', 'rocket', 'feline'] as const;
export type EntryDotId = (typeof ENTRY_DOTS)[number];

export const ENTRY_ARRIVAL_MS: readonly number[] = ENTRY_DOTS.map(
  (_id, index) =>
    VECTOR_START_MS + itemArrivalMs(VECTOR_GLYPHS, 'vector', index)
);

/** The arriving dot's pop-in slot; throws for a standing vector. */
export function entryIndex(id: string): number {
  const index = ENTRY_DOTS.indexOf(id as EntryDotId);
  if (index < 0) throw new Error(`dot never enters the graph: ${id}`);
  return index;
}

export function isEnteringDot(id: string): boolean {
  return ENTRY_DOTS.includes(id as EntryDotId);
}

/** When a dot is in the graph: a standing vector is already indexed (0). */
export function dotArrivalMs(id: string): number {
  dotById(id);
  return isEnteringDot(id) ? ENTRY_ARRIVAL_MS[entryIndex(id)] : 0;
}

// The gear owns the middle beat: exactly one revolution between the chunk train
// clearing and the vector train departing. One revolution (not a fraction)
// keeps the gear's orientation identical at every loop boundary, so the loop
// never jumps. The component animates it with the site's standard LLM-gear
// curve (custom.css `.inference-llm-cycle`).
export const GEAR_BEAT = {
  startMs: GEAR_START_MS,
  turnMs: GEAR_TURN_MS,
  turns: 1,
} as const;

/** Lead-in/hold-out window shared by the settle breath. */
export const LANDING_BEAT = { leadMs: 300, holdMs: 700 } as const;

/** The write rings rise AFTER their vector lands, so a ring never floats around
 * an empty spot: the vector pops in, then the ring answers it. */
export const PULSE_BEAT = { riseMs: 140, holdMs: 640 } as const;

export function flowTiming(startDelayMs: number) {
  return {
    cycleMs: LOOP_MS,
    travelMs: TRAVEL_MS,
    fadeMs: 400,
    repeat: 'loop',
    startDelayMs,
  } as const;
}

export function arrivesAt(startDelayMs: number): number {
  return startDelayMs + TRAVEL_MS;
}

// --- Vector space scatter (the HNSW proximity graph) ---------------------
export type ScatterRole = 'neighbour' | 'far' | 'filler';
export type ScatterDot = {
  id: string;
  label?: string;
  nx: number;
  ny: number;
  role: ScatterRole;
};

// Normalized scatter (0..1 of the scatter region). The composition is fixed: it is
// the graph the reader approved, translated so its bounding box is centred in the
// region (nx spans 0.15..0.85). Only a TRANSLATION is allowed here — re-normalizing
// it to "fill" the region pushes the top row onto the framing text, and stretching
// it sideways weakens the close pair. The vertical margins are deliberately not
// symmetric: the top must clear the framing and the bottom must leave room for the
// caption.
export const SCATTER_DOTS: readonly ScatterDot[] = [
  { id: 'cat', label: 'cat', nx: 0.5, ny: 0.38, role: 'neighbour' },
  { id: 'feline', label: 'feline', nx: 0.73, ny: 0.3, role: 'neighbour' },
  { id: 'rocket', label: 'rocket', nx: 0.15, ny: 0.92, role: 'far' },
  { id: 'a', nx: 0.29, ny: 0.12, role: 'filler' },
  { id: 'b', nx: 0.85, ny: 0.58, role: 'filler' },
  { id: 'c', nx: 0.21, ny: 0.66, role: 'filler' },
  { id: 'd', nx: 0.63, ny: 0.8, role: 'filler' },
];

/** The graph's own horizontal span, as a fraction of the region: the figure
 * centres this box rather than the raw 0..1 box, which no node reaches. */
export const SCATTER_SPAN_NX = {
  min: Math.min(...SCATTER_DOTS.map((dot) => dot.nx)),
  max: Math.max(...SCATTER_DOTS.map((dot) => dot.nx)),
} as const;

export const NEIGHBOUR_PAIR = ['cat', 'feline'] as const;
export const FAR_PAIR = ['cat', 'rocket'] as const;
export const NEIGHBOUR_SIMILARITY = '0.91';
export const FAR_SIMILARITY = '0.06';

/** The two labelled similarity lines: annotations of the arriving vectors'
 * relationship, drawn over the graph's own links. `tone` picks the colour and
 * the side its label is pushed to, so no pair is hardcoded in the figure. */
export type SimilarityLink = {
  pair: readonly [string, string];
  value: string;
  tone: 'near' | 'far';
};

export const SIMILARITY_LINKS: readonly SimilarityLink[] = [
  { pair: NEIGHBOUR_PAIR, value: NEIGHBOUR_SIMILARITY, tone: 'near' },
  { pair: FAR_PAIR, value: FAR_SIMILARITY, tone: 'far' },
];

// A graph node is drawn as the same bracketed vector glyph the train carries, so
// the reader never has to translate "abstract dot" into "stored vector". Sized
// to keep the bracket and its component bars legible at 1×, not to be a dot.
export const SCATTER_GLYPH_SIZE = { desktop: 18, compact: 15 } as const;

// The HNSW index IS this scatter: every node is a stored vector and every edge
// links it to its nearest neighbour. These edges are exactly the
// 1-nearest-neighbour graph of SCATTER_DOTS (asserted in the tests), which is
// what a proximity index approximates. Rocket keeps a single far link — the
// outlier the graph can still reach, never a cluster member.
export const GRAPH_EDGES: readonly (readonly [string, string])[] = [
  ['a', 'cat'],
  ['cat', 'feline'],
  ['feline', 'b'],
  ['b', 'd'],
  ['d', 'c'],
  ['c', 'rocket'],
  ['c', 'a'],
];

function samePair(
  pair: readonly [string, string],
  from: string,
  to: string
): boolean {
  return (
    (pair[0] === from && pair[1] === to) || (pair[0] === to && pair[1] === from)
  );
}

/** The labelled similarity line for a pair, if the loop draws one. */
export function similarityOf(
  from: string,
  to: string
): SimilarityLink | undefined {
  return SIMILARITY_LINKS.find(({ pair }) => samePair(pair, from, to));
}

// The vector the loop writes into the graph each cycle: the last vector to
// arrive, so the landing pulse fires exactly when the index write completes and
// the "near = related meaning" settle breath reads as one event.
export const LANDING_DOT_ID = ENTRY_DOTS[ENTRY_DOTS.length - 1];

// --- Write beat -----------------------------------------------------------
// The write rings BOTH vectors of the close pair, not just the last arrival: the
// pair is what carries the meaning relation, so marking only one of them reads as
// an arbitrary highlight. The last arrival takes the primary ring (the write
// itself, sharp and full size); its partner takes a secondary, softer, smaller
// ring a beat later, which reads as the relation completing rather than a second
// event. Both windows sit inside the landing beat, long before the roll-back.
export const SECONDARY_PULSE_DELAY_MS = 180;

export type StoryPulse = {
  /** The indexed vector the ring marks. */
  id: string;
  /** When the ring peaks. */
  atMs: number;
  radius: { desktop: number; compact: number };
  /** Peak ring opacity — the secondary marks are quieter versions. */
  opacity: number;
};

export const PULSES: readonly StoryPulse[] = [
  {
    id: LANDING_DOT_ID,
    atMs: LANDING_MS,
    radius: { desktop: 14, compact: 13 },
    opacity: 0.9,
  },
  {
    // The other highlighted vector: the pair's first arrival.
    id: NEIGHBOUR_PAIR.find((id) => id !== LANDING_DOT_ID) ?? LANDING_DOT_ID,
    atMs: LANDING_MS + SECONDARY_PULSE_DELAY_MS,
    radius: { desktop: 11, compact: 11 },
    opacity: 0.5,
  },
];

// --- Link beat ------------------------------------------------------------
// A link can only exist once BOTH endpoints are in the graph: the standing
// edges are already there, and a drawn link appears at the later of its two
// arrivals — so a vector connects the moment it lands. DRAWN_LINKS is the SSOT
// for the trace schedule; links that share an arrival moment get one gap each,
// so simultaneous traces still read as separate events.
export type DrawnLink = {
  from: string;
  to: string;
  /** The later arrival: the moment the link can exist. */
  availableMs: number;
  /** When its trace begins. */
  beginMs: number;
};

export const CONNECT_DRAW_MS = 350; // one link tracing to its neighbour
export const CONNECT_SLACK_MS = 200; // room left after the last trace lands

/** Graph links already in the index: both endpoints are standing vectors. */
export const STANDING_EDGES: readonly (readonly [string, string])[] =
  GRAPH_EDGES.filter(
    ([from, to]) => !isEnteringDot(from) && !isEnteringDot(to)
  );

/** The links this loop draws, in draw order. */
export const DRAWN_LINKS: readonly DrawnLink[] = scheduleDrawnLinks();

export function linkKey(from: string, to: string): string {
  return `${from}_${to}`;
}

/** When a drawn link starts tracing; throws for a link the loop never draws. */
export function linkBeginMs(from: string, to: string): number {
  const link = DRAWN_LINKS.find((drawn) =>
    samePair([drawn.from, drawn.to], from, to)
  );
  if (!link) throw new Error(`link is not drawn this cycle: ${from}-${to}`);
  return link.beginMs;
}

function scheduleDrawnLinks(): DrawnLink[] {
  const pairs: readonly (readonly [string, string])[] = [
    ...GRAPH_EDGES,
    ...SIMILARITY_LINKS.map((link) => link.pair),
  ];
  const seen = new Set<string>();
  const available: Omit<DrawnLink, 'beginMs'>[] = [];
  for (const [from, to] of pairs) {
    if (!isEnteringDot(from) && !isEnteringDot(to)) continue;
    const key = [from, to].sort().join('-');
    if (seen.has(key)) continue;
    seen.add(key);
    available.push({
      from,
      to,
      availableMs: Math.max(dotArrivalMs(from), dotArrivalMs(to)),
    });
  }
  // Causal order; within one arrival moment the labelled relations draw last,
  // so the meaning payoff closes the connect beat.
  available.sort(
    (a, b) =>
      a.availableMs - b.availableMs ||
      Number(Boolean(similarityOf(a.from, a.to))) -
        Number(Boolean(similarityOf(b.from, b.to)))
  );
  const gap = linkGapMs(available.map((link) => link.availableMs));
  let previous = Number.NEGATIVE_INFINITY;
  return available.map((link) => {
    const beginMs = Math.max(link.availableMs, previous + gap);
    previous = beginMs;
    return { ...link, beginMs };
  });
}

/** The widest gap that keeps the traces legible while still finishing the whole
 * connect beat before the reset. A link draws once both ends are in, and never
 * closer than one gap to the one before it: begin(n) === max(available(k) +
 * gap·(n−k)), so the gap is bounded by the tightest of those. That keeps the
 * beat inside the closing rest instead of letting it eat a stage. */
function linkGapMs(moments: readonly number[]): number {
  const budget =
    LANDING_MS + CONNECT_BUDGET_MS - CONNECT_DRAW_MS - CONNECT_SLACK_MS;
  const last = moments.length - 1;
  let gap = Number.POSITIVE_INFINITY;
  for (let index = 0; index < last; index += 1)
    gap = Math.min(gap, (budget - moments[index]) / (last - index));
  return Number.isFinite(gap) ? Math.max(0, Math.floor(gap)) : 0;
}

// Tile → scatter inset. The inset matches the framing's own padding, so the graph
// and the titles share one margin; the graph's composition then supplies its own
// breathing room inside that box (see SCATTER_DOTS).
export function scatterRegion(tile: Region, compact: boolean): Region {
  return compact
    ? {
        x: tile.x + 16,
        y: tile.y + 102,
        width: tile.width - 32,
        height: tile.height - 136,
      }
    : {
        x: tile.x + 16,
        y: tile.y + 88,
        width: tile.width - 32,
        height: tile.height - 122,
      };
}

export function toRegion(nx: number, ny: number, region: Region): Pt {
  return { x: region.x + nx * region.width, y: region.y + ny * region.height };
}

export function dotById(id: string): ScatterDot {
  const dot = SCATTER_DOTS.find((d) => d.id === id);
  if (!dot) throw new Error(`unknown scatter dot: ${id}`);
  return dot;
}

export function dotAt(dot: ScatterDot, region: Region): Pt {
  return toRegion(dot.nx, dot.ny, region);
}

export function distance(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// Midpoint of a similarity line, pushed perpendicular so the label never sits
// on the stroke. side=+1 for the close pair, -1 for the far outlier. The push
// has to clear half the label's width, not just its cap height, or the dashed
// line clips a corner of the 9px text.
export function similarityLabelPos(a: Pt, b: Pt, side: 1 | -1): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: (a.x + b.x) / 2 + (-dy / len) * 20 * side,
    y: (a.y + b.y) / 2 + (dx / len) * 20 * side,
  };
}
