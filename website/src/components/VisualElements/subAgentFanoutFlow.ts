// Pure routing model for the sub-agent fan-out figure. The ledger owns every row
// y-coordinate; this module owns every x-coordinate and the elbow columns that
// keep an outbound request and its inbound synthesis off each other's stroke.

import {
  arrowTipTrim,
  MAX_TERMINAL_TRIM_RATIO,
  trainLaneOffset,
} from './diagramGeometryCore.ts';
import {
  DIAGRAM_ICON_SIZE,
  DIAGRAM_STROKE,
  DIAGRAM_TOKEN_SIZE,
  SPACE,
  gridUp,
} from './diagramScale.ts';

/** Glyph-train geometry. One descriptor per scale tier keeps the glyph tier, its
    lane separation and its along-path spacing in lockstep. The tiers cannot share
    one size: the compact actor (`--icon-md`) caps the lane pitch at 24, which
    caps its glyph at 16, while the wide actor carries the site-standard flow
    tier. */
export type FanoutTokenGeometry = {
  /** Glyph edge length. */
  size: number;
  /** Centre-to-centre separation of the outbound and inbound lanes. */
  lanePitch: number;
  /** Centre-to-centre spacing of consecutive glyphs on one path. */
  spacing: number;
  /** Connector stroke the train and its marker ride on. The marker scales with
      the stroke, so this also sets the arrowhead trim the corridor must host. */
  strokeWidth: number;
};

/** Wide train: the site-standard flow tier, on the tightest legal shape box
    (`size + SPACE['1']`) so the widest corridor carries the most glyphs. The
    32px pitch equals the wide actor box, so both lanes attach inside it. */
export const FLOW_TOKEN_GEOMETRY: FanoutTokenGeometry = {
  size: DIAGRAM_TOKEN_SIZE.flow,
  lanePitch: SPACE['4'],
  spacing: DIAGRAM_TOKEN_SIZE.flow + SPACE['1'],
  strokeWidth: DIAGRAM_STROKE.connector,
};

/** Compact train: one tier down in glyph and stroke. The lane pitch tracks the
    compact actor box (SPACE['4'] = 32 <= the 36px box) so both lanes attach
    inside it and clear its glyph lanes; `dense` keeps the 8px shape gap. The
    hairline connector keeps the arrowhead (and so the whole rail floor) small
    enough for the phone ledger to hold the narrative. */
export const COMPACT_TOKEN_GEOMETRY: FanoutTokenGeometry = {
  size: DIAGRAM_TOKEN_SIZE.dense,
  lanePitch: SPACE['4'],
  spacing: DIAGRAM_TOKEN_SIZE.dense + SPACE['1'],
  strokeWidth: DIAGRAM_STROKE.default,
};

/** Wide actor box (mirrors `--icon-lg`). */
export const FLOW_ACTOR_SIZE = DIAGRAM_ICON_SIZE.primary;

/** Compact actor tier: 1.5× the `--icon-md` step, per the operator's phone
    request (the emoji reads small at 24px beside a 48px row). The compact rail is
    a fixed-px budget (corridor + stand-off + actor), so this widens the rail and
    narrows the ledger by the same amount. */
export const COMPACT_ACTOR_SIZE = DIAGRAM_ICON_SIZE.secondary * 1.5; // 36

/** How far a glyph train rides from the connector it rides on. */
function tokenLaneOffset(geometry: FanoutTokenGeometry) {
  return trainLaneOffset(geometry.size, geometry.strokeWidth);
}

/** Hair of clearance between a glyph's outer edge and the row edge that owns it. */
const FLOW_LANE_CLEARANCE = SPACE['0h'];

/** How far a train starts inside the window edge. A glyph is centred on its path
    point, so a train starting exactly on the border paints half a glyph over the
    ledger (measured 2.5px); half a glyph plus the lane offset's worst-case x
    component keeps every token in the rail whatever the geometry does. */
function tokenRootInset(geometry: FanoutTokenGeometry) {
  return geometry.size / 2 + tokenLaneOffset(geometry);
}

/** Vertical half-span a glyph lane draws inside its row: half a lane pitch out
    to the lane, the train's offset, half a glyph and a hair of clearance. */
function laneReach(geometry: FanoutTokenGeometry) {
  return (
    geometry.lanePitch / 2 +
    tokenLaneOffset(geometry) +
    geometry.size / 2 +
    FLOW_LANE_CLEARANCE
  );
}

/** Row floor that lets every flow row host its own glyph lane. The ledger derives
    its canvas from these floors (`floorCanvas`), so a row can never be too short
    to carry its train — the reason the trains used to ride the connector line
    itself. One shared floor (the larger, wide lane) keeps a single canvas for
    every width; the height it hands a compact row is not spare — it is what
    lengthens that row's token runway to a third glyph. */
export const FLOW_ROW_MIN_HEIGHT = gridUp(
  Math.max(laneReach(FLOW_TOKEN_GEOMETRY), laneReach(COMPACT_TOKEN_GEOMETRY))
);

/** The shortest arrow leg that keeps `trimPathEnd` from halving the arrow trim,
    which is what holds the head SPACE['1'] clear of the actor box. Derived from
    the tier's own stroke, so a thinner connector buys a shorter rail floor. */
function minArrowLeg(geometry: FanoutTokenGeometry) {
  return arrowTipTrim(geometry.strokeWidth) / MAX_TERMINAL_TRIM_RATIO;
}

/** A single shared elbow column still holds both arrow legs and the actor
    stand-off. No renderable width draws a narrower corridor than this. */
function minCorridor(geometry: FanoutTokenGeometry) {
  return 2 * minArrowLeg(geometry);
}

/** Wide-tier floors (kept exported for the desk's corridor invariants). */
export const MIN_ARROW_LEG = minArrowLeg(FLOW_TOKEN_GEOMETRY);
export const MIN_CORRIDOR = minCorridor(FLOW_TOKEN_GEOMETRY);

/** Compact-tier floors: the hairline stroke shortens the arrowhead, so the phone
    rail hosts a narrower corridor than the desk. */
export const COMPACT_MIN_ARROW_LEG = minArrowLeg(COMPACT_TOKEN_GEOMETRY);
export const COMPACT_MIN_CORRIDOR = minCorridor(COMPACT_TOKEN_GEOMETRY);

/** Ledger inset as a share of the scene. The wide composition keeps the desk's
    32%; the share eases down through the compact band so the ledger (the
    narrative payload) never shrinks to a sliver beside two fixed-px rails. */
export const ROOT_INSET = 0.32;
export const COMPACT_ROOT_INSET = 0.18;
const COMPACT_INSET_WIDTH = 480;
const WIDE_INSET_WIDTH = 704;

/** How deep into its rail the composition hangs the actor, as a share of the
    scene — the desk's rail width × actor share, frozen into one proportion. The
    rail also hosts the identity label, so this is what buys it its measure. */
export const RAIL_ACTOR_DEPTH = 0.17;

/** Narrowest rail that still hosts one shared elbow column, the stand-off and the
    compact actor. Fixed px on purpose: a share of the host is what collapsed the
    corridor at phone widths. */
export const RAIL_MIN = COMPACT_MIN_CORRIDOR + SPACE['1'] + COMPACT_ACTOR_SIZE;

/** Widest rail-identity line the ledger can place: the longest task label at the
    --text-xs measure. Keeps the identity a rail-budget question, not a width
    question, so the desk and the phone share one rule. */
export const IDENTITY_MEASURE = 14 * 6.82;

/** The two proportions that change with width: the actor tier and its glyph
    train. Composition, rails and ledger inset are one quantity at every width. */
export type FanoutScale = {
  actorSize: number;
  tokens: FanoutTokenGeometry;
};

/** Actor tier + token geometry by width. The tier switches where the ledger
    inset share reaches its wide value. */
export function fanoutScale(width: number): FanoutScale {
  return width < WIDE_INSET_WIDTH
    ? { actorSize: COMPACT_ACTOR_SIZE, tokens: COMPACT_TOKEN_GEOMETRY }
    : { actorSize: FLOW_ACTOR_SIZE, tokens: FLOW_TOKEN_GEOMETRY };
}

function ledgerInsetShare(width: number) {
  const t = Math.min(
    1,
    Math.max(
      0,
      (width - COMPACT_INSET_WIDTH) / (WIDE_INSET_WIDTH - COMPACT_INSET_WIDTH)
    )
  );
  return COMPACT_ROOT_INSET + (ROOT_INSET - COMPACT_ROOT_INSET) * t;
}

/** Ledger inset: the host share, floored in px so the rail always keeps its
    arrow corridor. */
export function ledgerInset(width: number) {
  return Math.max(RAIL_MIN, ledgerInsetShare(width) * width);
}

/** Actor centre measured from its own scene edge. The share only applies while
    the rail can still spend the corridor between the actor box and the ledger;
    past that the actor sits at the rail's inner limit (flush at the floor). */
export function actorAnchor(width: number, actorSize: number) {
  const ceiling =
    ledgerInset(width) -
    actorSize / 2 -
    SPACE['1'] -
    minCorridor(fanoutScale(width).tokens);
  return Math.min(RAIL_ACTOR_DEPTH * width, ceiling);
}

/** Measure the rail can give the identity label on the actor's far side. */
export function identityMeasure(width: number, actorSize: number) {
  return actorAnchor(width, actorSize) - actorSize / 2;
}

/** Only the fields the router reads — ContextSceneFrame satisfies this. */
export type FlowRow = { top: number; height: number };
export type FlowFrame = { rows: Record<string, FlowRow> };

export type FlowTone = 'dispatch' | 'return';

/** The lane a tone's train rides: its offset off the connector, and which side. */
export type FlowLane = {
  offset: number;
  orientation: 'above' | 'below';
};

/** Which side of its own line each train rides. The lanes sit `lanePitch/2`
    either side of the worker centre and the dispatch row is the upper row of the
    pair, so the outbound train rides above its lane and the inbound train below
    its own: every glyph then reads inside the ledger row that owns it instead of
    crowding the pair's shared centre line. */
export function flowLane(
  tone: FlowTone,
  geometry: FanoutTokenGeometry
): FlowLane {
  return {
    offset: tokenLaneOffset(geometry),
    orientation: tone === 'dispatch' ? 'above' : 'below',
  };
}
export type FlowSegment = {
  tone: FlowTone;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type FlowGeometry = {
  rootX: number;
  robotX: number;
  center: number;
  /** Elbow columns; the return's column is never nearer the actor. */
  elbows: Record<FlowTone, number>;
  lanes: Record<FlowTone, number>;
  rows: { dispatch: number; synthesis: number };
  paths: Record<FlowTone, string>;
  /** The route the glyph trains ride: same legs, root end pulled into the rail
      by the layout's token inset so no token paints over the window border. */
  tokenPaths: Record<FlowTone, string>;
  /** The train geometry this route was built for. */
  tokens: FanoutTokenGeometry;
  /** How far the token route starts inside the window border. */
  tokenInset: number;
  /** Length of the token route — the runway a train must fit in. */
  tokenRun: number;
  segments: readonly FlowSegment[];
};

/** Where one caller's round trip lands for a given width. One composition for
    every width: only the actor tier and its train change. */
export type FanoutLayout = {
  /** Actor box size (`--icon-lg` wide, `--icon-md` compact). */
  actorSize: number;
  /** Glyph-train geometry for this actor tier. */
  tokens: FanoutTokenGeometry;
  /** Elbow distance from the actor-facing arrow end, [dispatch, return]. Equal
      offsets share one column (compact corridors); a wide corridor splits them. */
  elbowOffsets: readonly [number, number];
  /** Which way the ledger lies from the actor. */
  towardLedger: -1 | 1;
  /** Ledger edge this caller draws from. */
  rootX: number;
  /** Actor centre for this caller. */
  actorCenterX: number;
  /** Rail measure the identity label can use on the actor's far side. */
  identityMeasure: number;
};

function rowCenter(frame: FlowFrame, rowId: string) {
  const row = frame.rows[rowId];
  if (!row) throw new Error(`missing root landing: ${rowId}`);
  return row.top + row.height / 2;
}

/** The router's row-id format: one builder pair and one parser, so a caller's
    flows and its ledger rows can never name different rows. */
export function dispatchRowId(index: number): string {
  return `dispatch-${index}`;
}

export function synthesisRowId(index: number): string {
  return `synthesis-${index}`;
}

/** Every caller sits between the dispatch row it launches from and the synthesis
    row it lands on, so both of its legs stay inside its own row span. */
export function workerCenter(frame: FlowFrame, index: number) {
  return (
    (rowCenter(frame, dispatchRowId(index)) +
      rowCenter(frame, synthesisRowId(index))) /
    2
  );
}

/** Which rail a caller's flows use. One predicate for every width: even callers
    take the left rail, odd the right, so a parallel stage can never put two
    actors in one rail. */
export function callerRail(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'left' : 'right';
}

/** The elbow columns a corridor can host: two when it fits both arrow legs and a
    lane pitch, else one shared column. A corridor under the tier's minimum is a
    layout bug, not a renderable state, so it fails loudly. */
function elbowColumnsFor(
  corridor: number,
  geometry: FanoutTokenGeometry
): readonly [number, number] {
  const eps = 0.01;
  const leg = minArrowLeg(geometry);
  if (corridor + eps >= 2 * leg + geometry.lanePitch) {
    return [leg, leg + geometry.lanePitch];
  }
  if (corridor + eps >= minCorridor(geometry)) return [leg, leg];
  throw new Error(
    `fanout corridor ${corridor.toFixed(2)}px < ${minCorridor(geometry)}px (one shared column)`
  );
}

/** One composition for every width: a centered ledger and two outer rails. The
    caller's side comes from `callerRail`; its rail fixes the ledger edge and the
    actor centre, and the elbow columns follow from the corridor they leave. */
export function fanoutLayout(index: number, width: number): FanoutLayout {
  const isLeft = callerRail(index) === 'left';
  const { actorSize, tokens } = fanoutScale(width);
  const inset = ledgerInset(width);
  const anchor = actorAnchor(width, actorSize);
  const rootX = isLeft ? inset : width - inset;
  const actorCenterX = isLeft ? anchor : width - anchor;
  const robotX =
    actorCenterX + (isLeft ? 1 : -1) * (actorSize / 2 + SPACE['1']);
  return {
    actorSize,
    tokens,
    elbowOffsets: elbowColumnsFor(Math.abs(rootX - robotX), tokens),
    towardLedger: isLeft ? 1 : -1,
    rootX,
    actorCenterX,
    identityMeasure: anchor - actorSize / 2,
  };
}

/** Actor-facing arrow end, held SPACE['1'] clear of the actor box. */
function robotAttachX(layout: FanoutLayout) {
  return (
    layout.actorCenterX +
    layout.towardLedger * (layout.actorSize / 2 + SPACE['1'])
  );
}

function lanesAt(center: number, lanePitch: number): Record<FlowTone, number> {
  return {
    dispatch: center - lanePitch / 2,
    return: center + lanePitch / 2,
  };
}

/** Three legs per flow, in drawing order; continuity is asserted by the guards. */

function orthogonalSegments(
  tone: FlowTone,
  fromX: number,
  fromY: number,
  elbowX: number,
  toY: number,
  toX: number
): FlowSegment[] {
  const corner = { x: elbowX, y: fromY };
  return [
    { tone, x1: fromX, y1: fromY, x2: corner.x, y2: corner.y },
    { tone, x1: corner.x, y1: corner.y, x2: corner.x, y2: toY },
    { tone, x1: corner.x, y1: toY, x2: toX, y2: toY },
  ];
}

function renderPath(segments: readonly FlowSegment[]) {
  const [start] = segments;
  return [
    `M ${start.x1} ${start.y1}`,
    ...segments.map((segment) =>
      segment.y1 === segment.y2 ? `H ${segment.x2}` : `V ${segment.y2}`
    ),
  ].join(' ');
}

function segmentsLength(segments: readonly FlowSegment[]) {
  return segments.reduce(
    (sum, segment) =>
      sum + Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1),
    0
  );
}

/** How many glyphs of this geometry fit along a flow's token route. */
export function tokenCapacity(geometry: FanoutTokenGeometry, tokenRun: number) {
  return Math.floor(tokenRun / geometry.spacing) + 1;
}

/** Pull a horizontal root leg's ledger-side end `inset` px toward the actor: the
    direction that moves the train into the rail. */
function insetLedgerEnd(
  segment: FlowSegment,
  end: 'start' | 'end',
  inset: number
): FlowSegment {
  const from = end === 'start' ? segment.x1 : segment.x2;
  const towardActor = end === 'start' ? segment.x2 : segment.x1;
  const moved = from + Math.sign(towardActor - from) * inset;
  return end === 'start'
    ? { ...segment, x1: moved }
    : { ...segment, x2: moved };
}

/** The legs the trains ride: the drawn legs with the root end inset, so a glyph
    centred on the train's first point stays inside the rail. */
function tokenSegments(
  tone: FlowTone,
  segments: readonly FlowSegment[],
  inset: number
): FlowSegment[] {
  const [first] = segments;
  const last = segments[segments.length - 1];
  return tone === 'dispatch'
    ? [insetLedgerEnd(first, 'start', inset), ...segments.slice(1)]
    : [...segments.slice(0, -1), insetLedgerEnd(last, 'end', inset)];
}

/** Route one round trip through the layout its width resolves to. */
function route(index: number, frame: FlowFrame, width: number): FlowGeometry {
  const layout = fanoutLayout(index, width);
  const { tokens } = layout;
  const rootX = layout.rootX;
  const robotX = robotAttachX(layout);
  const rows = {
    dispatch: rowCenter(frame, `dispatch-${index}`),
    synthesis: rowCenter(frame, `synthesis-${index}`),
  };
  const center = workerCenter(frame, index);
  const lanes = lanesAt(center, tokens.lanePitch);
  const elbows = {
    dispatch: robotX + layout.towardLedger * layout.elbowOffsets[0],
    return: robotX + layout.towardLedger * layout.elbowOffsets[1],
  };
  const dispatch = orthogonalSegments(
    'dispatch',
    rootX,
    rows.dispatch,
    elbows.dispatch,
    lanes.dispatch,
    robotX
  );
  const ret = orthogonalSegments(
    'return',
    robotX,
    lanes.return,
    elbows.return,
    rows.synthesis,
    rootX
  );
  const inset = tokenRootInset(tokens);
  const dispatchTokens = tokenSegments('dispatch', dispatch, inset);
  const returnTokens = tokenSegments('return', ret, inset);
  return {
    rootX,
    robotX,
    center,
    elbows,
    lanes,
    rows,
    segments: [...dispatch, ...ret],
    paths: { dispatch: renderPath(dispatch), return: renderPath(ret) },
    tokenPaths: {
      dispatch: renderPath(dispatchTokens),
      return: renderPath(returnTokens),
    },
    tokens,
    tokenInset: inset,
    tokenRun: segmentsLength(dispatchTokens),
  };
}

export function flowGeometry(
  index: number,
  frame: FlowFrame,
  width: number
): FlowGeometry {
  return route(index, frame, width);
}
