// Geometry + schedule for the Deep Research figure (v4).
//
// The figure is one straight pipeline of strictly sequential beats — the walk ends
// before the first candidate moves, the candidates cross one at a time, the last
// seat lands before compression starts, and so on, so the eye can follow the story.
//
// EXPLORATION is an exploration TRAIL: six stops joined in the order they are
// visited — a route, not a web. The walk lights the trail stop by stop. The
// harvested candidates leave the tile as ONE straight corridor on the tiles' shared
// axis. SYNTHESIS receives the corridor on its centre axis and runs cluster →
// compress → merge, then ONE straight output stream joints the tile edge to the
// answer and the answer node reveals once that stream has cleared. Every
// coordinate and millisecond lives here so the component renders and the tests
// assert the same source of truth.
//
// The synthesis tile's interior holds NO train: lanes, their one fact each, and the
// grey exit plumbing that collects those facts into the single external stream.
// MOBILE TRANSPOSES that interior: the SAME three lanes run top→bottom and the
// plumbing collects them onto the tile's bottom edge, so the stacked mobile figure
// keeps one downward direction while desktop keeps its left→right one. It is ONE
// composition described once; only the lane spacing and the exit insets differ.

import { tokenTrainBeginOffsetMs } from './TokenTrainTiming.ts';
import { TILE_GRID } from './diagramTileLayout.ts';

export type Point = { x: number; y: number };
export type Box = Point & { width: number; height: number };

export type GraphNodeId =
  | 'question'
  | 'web'
  | 'specs'
  | 'docs'
  | 'idea'
  | 'detail';

export type DiagramMode = 'desktop' | 'mobile';

// --- Corpus candidates ------------------------------------------------------
// Candidates carry no domain meaning of their own; the topic row each one joins is
// what synthesis discovers. Generic by design — every reader sees their own topics.
// GROUPED, not round-robin: one topic lane fills COMPLETELY before the next starts,
// so a reader sees a lane reach full before the walk moves on.
export const CANDIDATE_ROWS: readonly number[] = [
  0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
];

export const CLUSTER_COUNT = 3;

// --- Tile frame -------------------------------------------------------------
// Both tiles are the SAME height and put their content on the SAME three rows, so
// the trail's stops and the topic lanes line up across the figure and the two halves
// read as one pipeline. Each tile is only as big as what it holds — no dead band for
// the eye to read as content that failed to arrive.
export const TILE_MARGIN = 16;
/** 208, not the 200 the compaction first aimed at: mobile's lanes end at 168, so their
 * exit ports (portInset 32 below the lanes) need a tile of 200 just to CLEAR the last
 * seat — at exactly 200 the port lands ON the lane's end, with no room to slide, and
 * that lane's route doubles back off the pipe. 208 gives the slide 8u, on the same 8px
 * grid, and still holds desktop's last row plus its label descent. */
export const TILE_HEIGHT = 208;
/** The shared row rhythm, measured from a tile's top edge. 72 clears the header
 * (eyebrow 26, note 44) and 168 leaves the last 9u label its descent inside the
 * tile: at a 240u height the rows sat 56u apart and the two tiles read half empty. */
export const TILE_ROW_OFFSETS = [72, 120, 168] as const;
/** Mobile lays its lanes ACROSS the tile, so their spacing is the figure's COLUMN
 * rhythm, not desktop's row rhythm: the outer lanes stand on the two columns the trail's
 * stops already occupy (40/200 from the tile edge) and the middle lane on the shared axis
 * the corridor and the output stream ride. The row offsets would centre a 130u lane band
 * in a 240u tile and leave a 55u dead band on either side. */
export const MOBILE_LANE_COLUMN_OFFSETS = [40, 120, 200] as const;
/** Distance from a tile's edge to the content it holds. */
const TILE_CONTENT_PADDING = 16;

/** Metrics of the 9px mono spec face a label is set in, in viewBox units, so the
 * model can size text — and the boxes that must contain it — without measuring a
 * rendered font. */
const LABEL_TEXT_HEIGHT = 10;
const LABEL_ASCENT = 7;

/** The answer terminal: the check emoji, sized like the suite's other result nodes,
 * plus the baseline drop of the label that names it. */
export const ANSWER_SIZE = 40;
/** Baseline distance of the answer's label below its emoji. */
export const ANSWER_LABEL_DROP = 14;

// Everything the answer node occupies, emoji top to label baseline plus the label's
// own descent, and the smallest grid-aligned tile that holds it with the same even
// padding the two stage tiles keep.
const ANSWER_CONTENT_HEIGHT =
  ANSWER_SIZE + ANSWER_LABEL_DROP + (LABEL_TEXT_HEIGHT - LABEL_ASCENT);
export const ANSWER_TILE_SIZE =
  Math.ceil((ANSWER_CONTENT_HEIGHT + TILE_CONTENT_PADDING * 2) / 8) * 8;

// --- One topic lane ---------------------------------------------------------
/** A lane's seat grid: the token, the pitch between seats, and the even padding the
 * lane keeps at both ends. */
export const LANE_TOKEN = { size: 16, pitch: 24, padding: 16 } as const;
/** Desktop only: the room a lane's candidates slide through before they dissolve at
 * its exit. Mobile's lanes exit straight down, so what separates their last seat from
 * the exit edge is the plumbing's own port inset. */
const LANE_SLIDE = 48;
/** The exit plumbing: every lane's route corners onto ONE spine, and the spine feeds
 * ONE trunk to the tile edge — exactly where the out arrow starts. Both insets are
 * measured in from the tile's exit edge and are per mode, because a transposed
 * interior leaves through a different edge. `portInset` is where a lane's port sits
 * (just past the lane); `spineInset` puts the spine INSIDE it, so every lane's port
 * is on the way to its own spine. */
export const EXIT_PLUMBING = {
  desktop: { portInset: 56, spineInset: 32 },
  mobile: { portInset: 32, spineInset: 16 },
} as const;

const SEATS_PER_LANE = Math.max(
  ...Array.from(
    { length: CLUSTER_COUNT },
    (_, lane) => CANDIDATE_ROWS.filter((target) => target === lane).length
  )
);

/** A lane is EXACTLY as wide as the seats it holds — even padding, one pitch per
 * extra seat — so no row trails off to the right. */
export function laneWidth(): number {
  return (
    LANE_TOKEN.padding * 2 +
    (SEATS_PER_LANE - 1) * LANE_TOKEN.pitch +
    LANE_TOKEN.size
  );
}

/** The synthesis tile is its lane, the room its candidates slide through, and the
 * exit plumbing's own inset — and nothing more. */
const SYNTHESIS_TILE_WIDTH =
  TILE_CONTENT_PADDING +
  laneWidth() +
  LANE_SLIDE +
  EXIT_PLUMBING.desktop.portInset;

// --- The tiles --------------------------------------------------------------
// BOTH tiles are the same width and height. The synthesis tile is as wide as its
// lanes need; the exploration tile matches it exactly, so the pair reads as two equal
// blocks instead of a wide one and a narrow one. The trail has to fit that width —
// its two columns plus the widest label hanging off each one — which the label
// containment test enforces.
const TILE_WIDTH = SYNTHESIS_TILE_WIDTH;
/** Mobile is the same tile in a canvas of its own; the CSS lets it scale up to fill a
 * phone's column, so its canvas only has to wrap the tile. */
const MOBILE_CANVAS_WIDTH = TILE_WIDTH + TILE_MARGIN * 2;

// --- The strip --------------------------------------------------------------
/** The figure's air: one EVEN gap between every pair of blocks — exploration →
 * synthesis (the corridor the harvest rides) and synthesis → answer. Mobile stacks
 * the same rhythm at its own scale. */
const BLOCK_GAP = { desktop: 132, mobile: 56 } as const;

const DESKTOP_SYNTHESIS_X = TILE_MARGIN + TILE_WIDTH + BLOCK_GAP.desktop;
const DESKTOP_ANSWER_X =
  DESKTOP_SYNTHESIS_X + SYNTHESIS_TILE_WIDTH + BLOCK_GAP.desktop;
const MOBILE_SYNTHESIS_Y = TILE_MARGIN + TILE_HEIGHT + BLOCK_GAP.mobile;
const MOBILE_ANSWER_Y = MOBILE_SYNTHESIS_Y + TILE_HEIGHT + BLOCK_GAP.mobile;

// Three tiles on one shared axis: desktop shares a y, mobile shares an x. The
// corridor and the output stream ride that axis, so every joint is perpendicular.
// The answer is a tile too — a container in the same language as the two stages,
// sized to the one node it holds rather than to a stage's worth of content.
export const DEEP_RESEARCH_SYNTHESIS_LAYOUT: Record<
  DiagramMode,
  { exploration: Box; synthesis: Box; answer: Box }
> = {
  desktop: {
    exploration: {
      x: TILE_MARGIN,
      y: TILE_MARGIN,
      width: TILE_WIDTH,
      height: TILE_HEIGHT,
    },
    synthesis: {
      x: DESKTOP_SYNTHESIS_X,
      y: TILE_MARGIN,
      width: SYNTHESIS_TILE_WIDTH,
      height: TILE_HEIGHT,
    },
    answer: {
      x: DESKTOP_ANSWER_X,
      y: TILE_MARGIN + TILE_HEIGHT / 2 - ANSWER_TILE_SIZE / 2,
      width: ANSWER_TILE_SIZE,
      height: ANSWER_TILE_SIZE,
    },
  },
  mobile: {
    exploration: {
      x: MOBILE_CANVAS_WIDTH / 2 - TILE_WIDTH / 2,
      y: TILE_MARGIN,
      width: TILE_WIDTH,
      height: TILE_HEIGHT,
    },
    synthesis: {
      x: MOBILE_CANVAS_WIDTH / 2 - SYNTHESIS_TILE_WIDTH / 2,
      y: MOBILE_SYNTHESIS_Y,
      width: SYNTHESIS_TILE_WIDTH,
      height: TILE_HEIGHT,
    },
    answer: {
      x: MOBILE_CANVAS_WIDTH / 2 - ANSWER_TILE_SIZE / 2,
      y: MOBILE_ANSWER_Y,
      width: ANSWER_TILE_SIZE,
      height: ANSWER_TILE_SIZE,
    },
  },
};

// The canvas is tightened around the content, so the figure renders as large as the
// column allows instead of scaling its own dead space down with it.
export const DEEP_RESEARCH_SYNTHESIS_VIEWBOX = {
  desktop: {
    width:
      DEEP_RESEARCH_SYNTHESIS_LAYOUT.desktop.answer.x +
      ANSWER_TILE_SIZE +
      TILE_MARGIN,
    height: TILE_MARGIN * 2 + TILE_HEIGHT,
  },
  mobile: {
    width: MOBILE_CANVAS_WIDTH,
    height:
      DEEP_RESEARCH_SYNTHESIS_LAYOUT.mobile.answer.y +
      ANSWER_TILE_SIZE +
      TILE_MARGIN,
  },
} as const;

// The trail: stops in visit order, laid as a route that crosses itself never. The
// route is a serpentine — right along a row, down, back along the next, down, then
// right again — so it reads as ONE open direction instead of a loop, and every stop
// lands on the same two columns. Both breakpoints lay the same route family; only
// the tile it is laid into differs. Every reader follows it as a path.
export const GRAPH_NODES: Record<DiagramMode, Record<GraphNodeId, Point>> = {
  desktop: {
    question: { x: 56, y: 88 },
    web: { x: 216, y: 88 },
    specs: { x: 216, y: 136 },
    docs: { x: 56, y: 136 },
    idea: { x: 56, y: 184 },
    detail: { x: 216, y: 184 },
  },
  mobile: {
    question: { x: 56, y: 88 },
    web: { x: 216, y: 88 },
    specs: { x: 216, y: 136 },
    docs: { x: 56, y: 136 },
    idea: { x: 56, y: 184 },
    detail: { x: 216, y: 184 },
  },
};

// The walk IS the trail: consecutive stops in visit order. No cross-links → no web.
export const TRAVERSAL: readonly GraphNodeId[] = [
  'question',
  'web',
  'specs',
  'docs',
  'idea',
  'detail',
];

// What each stop is called. The model owns the string because it owns the label's
// geometry too — the label is sized and placed from its own text.
export const GRAPH_NODE_LABELS: Record<GraphNodeId, string> = {
  question: 'question',
  web: 'web',
  specs: 'specs',
  docs: 'docs',
  idea: 'idea',
  detail: 'detail',
};

export const NODE_LABEL = {
  /** Baseline distance below a stop: close enough to bind the label to its stop,
   * far enough to clear the emoji's own ink. */
  offsetY: 25,
  charWidth: 5.6,
} as const;

function labelWidth(id: GraphNodeId) {
  return GRAPH_NODE_LABELS[id].length * NODE_LABEL.charWidth;
}

/** Where a stop's label sits: centred under the stop, EXCEPT when the trail leaves
 * the stop vertically — that wire would run straight through the text. Those stops
 * step their label sideways, toward the tile's interior: the one direction the
 * route never uses, and therefore the direction that stays clear. */
export function nodeLabelAt(mode: DiagramMode, id: GraphNodeId): Point {
  const at = nodeById(mode, id);
  const next = TRAVERSAL[TRAVERSAL.indexOf(id) + 1];
  const outbound = next === undefined ? undefined : nodeById(mode, next);
  const leavesVertically =
    outbound !== undefined &&
    Math.abs(outbound.y - at.y) > Math.abs(outbound.x - at.x);
  if (!leavesVertically) return { x: at.x, y: at.y + NODE_LABEL.offsetY };
  const inside = boxCenter(DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].exploration);
  const towardsInterior = at.x < inside.x ? 1 : -1;
  return {
    x: at.x + towardsInterior * (labelWidth(id) / 2 + TILE_GRID),
    y: at.y + NODE_LABEL.offsetY,
  };
}

/** A label's box: what the wire and the tile edge must both stay clear of. */
export function nodeLabelBox(mode: DiagramMode, id: GraphNodeId): Box {
  const at = nodeLabelAt(mode, id);
  const width = labelWidth(id);
  return {
    x: at.x - width / 2,
    y: at.y - LABEL_ASCENT,
    width,
    height: LABEL_TEXT_HEIGHT,
  };
}

export const EMITTING_NODES: readonly GraphNodeId[] = TRAVERSAL.slice(1);

// --- Schedule (ms, one loop) -------------------------------------------------
// One STEP is one trail beat: the segment traces to a stop and the stop RINGS.
// The corridor is the OTHER clock: a CONTINUOUS train whose tokens overlap
// (step < travel) so it reads as one steady candidate stream, running for the whole
// of exploration. Synthesis then runs in order: every lane FILLS COMPLETELY, the grey
// exit plumbing opens and each lane's candidates slide out and dissolve into its blue
// fact, the plumbing has already collected those facts into ONE trunk, and the
// external stream leaves along it to the answer.
export const STEP_MS = 620;
export const EDGE_TRACE_MS = 180;
export const RING_HOLD_MS = 130;
export const RING_FADE_MS = 420;
export const CORRIDOR_START_MS = 150;
export const CORRIDOR_STEP_MS = 240;
export const CORRIDOR_TRAVEL_MS = 560;
export const CORRIDOR_FADE_MS = 140;
export const EXIT_LANES_MS = 3600;
export const COMPRESS_START_MS = 3800;
export const COMPRESS_STEP_MS = 300;
export const COMPRESS_BEAT_MS = 260;
// A lane's exit is ONE beat for its candidates: they slide the whole way to the
// lane's exit and fade out over the SAME window, which opens before the fold and
// runs past it. Both are therefore gentler than the blue fact's own appearance —
// the row drains instead of snapping empty.
export const LANE_EXIT_LEAD_MS = 200;
export const FINAL_START_MS = 5220;
export const FINAL_TRAVEL_MS = 380;
export const FINAL_FADE_MS = 140;
// The merged facts queue along the joint in SPACE (a fixed gap between tokens), not
// in time: the same gap holds the static frame apart, and the train's own queue
// math turns it into the arrival schedule that finalTrainClearsMs reports.
export const FINAL_TOKEN_SPACING = 20;
export const ROLLBACK_START_MS = 7400;
export const LOOP_MS = 8000;

/** When the last candidate lands: every lane is full and the fill beat is over. */
export function fillCompleteMs() {
  return candidateArrivalMs(CANDIDATE_ROWS.length - 1);
}

/** When a trail edge begins to trace (the step it belongs to). */
export function edgeRevealMs(step: number) {
  return step * STEP_MS;
}

/** When a trail stop lights — and rings. The entry at t0; every later stop once
 * its segment has landed. */
export function nodeRevealMs(step: number) {
  return step === 0 ? 0 : edgeRevealMs(step) + EDGE_TRACE_MS;
}

/** A candidate leaves on the corridor's own steady clock, independent of the walk. */
export function candidateDepartMs(candidate: number) {
  return CORRIDOR_START_MS + candidate * CORRIDOR_STEP_MS;
}

/** A candidate's corridor arrival: when its own token train lands. */
export function candidateArrivalMs(candidate: number) {
  return candidateDepartMs(candidate) + CORRIDOR_TRAVEL_MS;
}

export function compressionMs(row: number) {
  return COMPRESS_START_MS + row * COMPRESS_STEP_MS;
}

/** When a row's candidates begin their exit: sliding to the lane's exit while they
 * dissolve into the blue fact already waiting there. */
export function laneExitStartMs(row: number) {
  return compressionMs(row) - LANE_EXIT_LEAD_MS;
}

/** When a row has drained: every candidate has reached the lane exit and faded. */
export function laneDrainedMs(row: number) {
  return compressionMs(row) + COMPRESS_BEAT_MS;
}

/** The output stream: one merged fact per topic lane. */
export const MERGED_TOKEN_COUNT = CLUSTER_COUNT;

/** When the LAST output token has cleared the answer's slot — the instant the slot
 * empties, so the answer reveals onto nothing and never under a moving token.
 * Derived with the train's OWN queue math, so the schedule and the rendering can
 * never drift apart (the queue delay grows as the joint gets shorter). */
export function finalTrainClearsMs(mode: DiagramMode) {
  const { start, end } = finalJoint(mode);
  const queueMs = tokenTrainBeginOffsetMs(
    MERGED_TOKEN_COUNT - 1,
    Math.hypot(end.x - start.x, end.y - start.y),
    { mode: 'pathSpacing', spacingPx: FINAL_TOKEN_SPACING },
    FINAL_TRAVEL_MS
  );
  return FINAL_START_MS + queueMs + FINAL_TRAVEL_MS + FINAL_FADE_MS;
}

/** A row is built the moment its first candidate lands. */
export function rowBuildMs(row: number) {
  const arrivals = CANDIDATE_ROWS.map((target, candidate) =>
    target === row ? candidateArrivalMs(candidate) : Infinity
  );
  return Math.min(...arrivals);
}

// --- Geometry helpers -------------------------------------------------------
export function boxRight(box: Box) {
  return box.x + box.width;
}

export function boxBottom(box: Box) {
  return box.y + box.height;
}

export function boxCenter(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export function nodeById(mode: DiagramMode, id: GraphNodeId): Point {
  return GRAPH_NODES[mode][id];
}

/** The trail segments, in visit order — the only links the figure ever draws. */
export function traversalEdges(
  mode: DiagramMode
): readonly { key: string; step: number; from: Point; to: Point }[] {
  return TRAVERSAL.slice(1).map((to, index) => {
    const from = TRAVERSAL[index];
    return {
      key: `${from}_${to}`,
      step: index + 1,
      from: nodeById(mode, from),
      to: nodeById(mode, to),
    };
  });
}

// --- The corridor: one straight line, both joints on the shared axis ---------
/** The tiles sit on ONE shared axis (their common centre line). Every joint — the
 * corridor, the exit plumbing, the out arrow — rides it, so each one meets a tile
 * edge perpendicular. */
export function tileAxis(mode: DiagramMode): number {
  const centre = boxCenter(DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].exploration);
  return mode === 'desktop' ? centre.y : centre.x;
}

export function corridorPath(mode: DiagramMode): string {
  const layout = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
  const axis = tileAxis(mode);
  const start =
    mode === 'desktop'
      ? { x: boxRight(layout.exploration), y: axis }
      : { x: axis, y: boxBottom(layout.exploration) };
  const entry =
    mode === 'desktop'
      ? { x: layout.synthesis.x, y: axis }
      : { x: axis, y: layout.synthesis.y };
  return `M ${start.x} ${start.y} L ${entry.x} ${entry.y}`;
}

export function finalPath(mode: DiagramMode): string {
  const { start, end } = finalJoint(mode);
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

/** The output joint: the synthesis tile's edge to the answer TILE's edge, on the
 * tiles' shared axis — the same perpendicular hand-off the corridor makes, so the
 * output stream leaves one container and enters the next. */
export function finalJoint(mode: DiagramMode): { start: Point; end: Point } {
  const layout = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode];
  const axis = tileAxis(mode);
  return mode === 'desktop'
    ? {
        start: { x: boxRight(layout.synthesis), y: axis },
        end: { x: layout.answer.x, y: axis },
      }
    : {
        start: { x: axis, y: boxBottom(layout.synthesis) },
        end: { x: axis, y: layout.answer.y },
      };
}

/** Where the answer node sits inside its tile: OPTICALLY centred, so the label
 * hanging below the emoji is balanced by an equal shift up. */
export function answerNodeAt(mode: DiagramMode): Point {
  const centre = boxCenter(DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].answer);
  const belowEmoji = ANSWER_LABEL_DROP + LABEL_TEXT_HEIGHT - LABEL_ASCENT;
  return { x: centre.x, y: centre.y - belowEmoji / 2 };
}

// --- Synthesis stages -------------------------------------------------------
// Lanes land on the figure's shared three-lane rhythm, so a topic lane sits level with
// the trail stop that fed it. The rhythm runs DOWN the tile on desktop and ACROSS it on
// mobile; `containerWidth` is always the lane's LENGTH (the axis its seats ride) and
// `containerHeight` its thickness.
export const CLUSTER_STAGE = {
  headerHeight: 64,
  containerWidth: laneWidth(),
  containerHeight: 34,
  topInset: TILE_ROW_OFFSETS[0] - 64,
  rowGap: TILE_ROW_OFFSETS[1] - TILE_ROW_OFFSETS[0],
} as const;

/** Mobile's lanes start right under the header: the first seat sits on the desktop row
 * rhythm and the lane wraps it with the token padding, exactly as desktop's lane wraps
 * its row. */
const MOBILE_LANE_TOP =
  TILE_ROW_OFFSETS[0] - LANE_TOKEN.padding - LANE_TOKEN.size / 2;

/** A topic lane, plus `y` — the line its seats, its exit port and its signal all ride:
 * the ROW's centre on desktop, the COLUMN's centre on mobile. Both orientations take
 * those centres from the shared rhythm, so the two can never drift apart. */
export function clusterRows(
  mode: DiagramMode
): readonly { row: number; y: number; box: Box }[] {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
  return Array.from({ length: CLUSTER_COUNT }, (_, row) =>
    mode === 'desktop' ? desktopLane(tile, row) : mobileLane(tile, row)
  );
}

function desktopLane(tile: Box, row: number) {
  const y =
    tile.y +
    CLUSTER_STAGE.headerHeight +
    CLUSTER_STAGE.topInset +
    row * CLUSTER_STAGE.rowGap;
  return {
    row,
    y,
    box: {
      x: tile.x + TILE_CONTENT_PADDING,
      y: y - CLUSTER_STAGE.containerHeight / 2,
      width: CLUSTER_STAGE.containerWidth,
      height: CLUSTER_STAGE.containerHeight,
    },
  };
}

/** The desktop lane TRANSPOSED: a tall container whose seats ride y, so the corridor
 * arriving at the tile's top meets the lanes head-on and the plumbing collects them at
 * the bottom — the direction the stacked mobile figure moves in. */
function mobileLane(tile: Box, row: number) {
  const y = tile.x + MOBILE_LANE_COLUMN_OFFSETS[row];
  return {
    row,
    y,
    box: {
      x: y - CLUSTER_STAGE.containerHeight / 2,
      y: tile.y + MOBILE_LANE_TOP,
      width: CLUSTER_STAGE.containerHeight,
      height: CLUSTER_STAGE.containerWidth,
    },
  };
}

/** A candidate's slot inside its topic lane, in arrival order: one padding plus one
 * pitch per seat, along the lane's travel axis. Mobile CENTRES its token on that slot,
 * so its seats land on the shared rhythm exactly; desktop's historic grid measures from
 * the token's leading edge — frozen, because desktop is shipped geometry. */
export function candidateSlot(mode: DiagramMode, candidate: number): Point {
  const row = CANDIDATE_ROWS[candidate];
  const lane = clusterRows(mode)[row];
  const seat = CANDIDATE_ROWS.slice(0, candidate).filter(
    (target) => target === row
  ).length;
  const along = LANE_TOKEN.padding + seat * LANE_TOKEN.pitch;
  return mode === 'desktop'
    ? { x: lane.box.x + along, y: lane.y }
    : { x: lane.y, y: lane.box.y + along + LANE_TOKEN.size / 2 };
}

/** How long a lane's signal takes to ride its route out of the tile, and how long it
 * fades once it arrives. */
export const SIGNAL_TRAVEL_MS = 380;
export const SIGNAL_FADE_MS = 120;

/** Where a lane's exit port is: just past the lane, ON the lane's own travel line. Every
 * candidate in the lane slides here and dissolves, and the lane's route runs through it. */
export function laneExitPoint(mode: DiagramMode, row: number): Point {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
  const along = exitEdge(mode, tile) - EXIT_PLUMBING[mode].portInset;
  return transposed(mode, along, clusterRows(mode)[row].y);
}

/** The ONE junction the lane routes converge on, and the point the trunk leaves from:
 * on the tiles' shared axis, inset from the tile's exit edge. */
export function exitJunction(mode: DiagramMode): Point {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
  const along = exitEdge(mode, tile) - EXIT_PLUMBING[mode].spineInset;
  return transposed(mode, along, tileAxis(mode));
}

/** The tile's exit edge, on the lane travel axis: the right edge on desktop, the bottom
 * edge on the transposed mobile interior. */
function exitEdge(mode: DiagramMode, tile: Box) {
  return mode === 'desktop' ? boxRight(tile) : boxBottom(tile);
}

/** The transposition between the two orientations, in ONE place: `along` is a position
 * on the lane's travel axis (desktop x, mobile y) and `across` the perpendicular one,
 * so a route is described once and read in either direction. */
function transposed(mode: DiagramMode, along: number, across: number): Point {
  return mode === 'desktop' ? { x: along, y: across } : { x: across, y: along };
}

/** A lane's signal leaves once its candidates have finished dissolving. */
export function laneSignalStartMs(row: number) {
  return laneDrainedMs(row);
}

/** One orthogonally-routed polyline: consecutive points share an axis, so successive
 * runs are perpendicular and every corner mitres SHARP. Runs that would not move are
 * dropped, which is why collinear waypoints cost nothing. */
function corneredPath(waypoints: readonly Point[]) {
  // Collinear middles are not corners: dropping them keeps one run per leg, so a lane
  // that already sits on the axis gets a single straight pipe.
  const points = waypoints.filter((point, index) => {
    if (index === 0 || index === waypoints.length - 1) return true;
    const before = waypoints[index - 1];
    const after = waypoints[index + 1];
    return (
      (before.x === point.x && point.x === after.x) === false &&
      (before.y === point.y && point.y === after.y) === false
    );
  });
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (to.x !== from.x && to.y !== from.y)
      throw new Error('exit plumbing corners must be right angles');
    if (to.x !== from.x) d += ` H ${to.x}`;
    if (to.y !== from.y) d += ` V ${to.y}`;
  }
  return d;
}

/** Every lane's exit route: out of its lane, through its exit port, onto the spine,
 * along it to the shared axis, then out of the tile. Every route ends exactly where the
 * out arrow starts, so the plumbing and the external stream are ONE line, continued —
 * and each route is a complete path for that lane's signal to ride. The centre lane IS
 * the axis, so its route collapses to a single straight run. */
export function exitRoutes(
  mode: DiagramMode
): readonly { row: number; d: string }[] {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
  const axis = tileAxis(mode);
  const edge = exitEdge(mode, tile);
  const { portInset, spineInset } = EXIT_PLUMBING[mode];
  const spine = edge - spineInset;
  return clusterRows(mode).map(({ row, y, box }) => ({
    row,
    d: corneredPath([
      transposed(mode, exitEdge(mode, box), y),
      transposed(mode, edge - portInset, y),
      transposed(mode, spine, y),
      transposed(mode, spine, axis),
      transposed(mode, edge, axis),
    ]),
  }));
}
