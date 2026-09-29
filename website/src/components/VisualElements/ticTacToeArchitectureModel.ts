import { DIAGRAM_GRID, DIAGRAM_TOKEN_SIZE } from './diagramScale.ts';

// Model for TicTacToeArchitectureDiagram: the game's high-level shape told as one
// idle loop that plays a whole game turn by turn. Every turn is the same protocol
// — the seat plays a move (a provisional candidate on its own board), the server
// decides the board, appends the event to the log, and pushes
// the state it decided to both seats, where the push cements the candidate.
// Geometry, copy and the turn schedule live here so the story is testable without
// rendering; the component only maps this onto SVG.

// One turn. Offsets are relative to the turn's start, so the whole loop is a
// function of PLY_MS and no beat can drift from the model. The travel time is
// shared: the move lands as the server decides, and the push lands as the boards
// tick. A turn is deliberately slow — it carries five distinct protocol steps, and
// read as a blur (a 1.24s turn and then a 2s turn each drew a "way too fast"
// verdict) they stop teaching. A turn must be watched, not skimmed: 3s per turn.
// Every internal offset is a fixed fraction of that turn, so the beats stay spread
// across it instead of bunching at the start. A turn OPENS with the click: the hand
// lands on the seat's own cell, presses, and only then is the move on the wire — so
// the cause of every arrow that follows is seen before the arrow. The click is its
// own beat, so the turn grew by it (`move` is where the pre-click schedule sat at 0)
// and the reviewed spacing between the remaining beats is preserved, not compressed.
export const PLY_MS = 3420;
export const ARCH_PLY = {
  click: 0,
  // The hand's descent: it is fully present at `clickIn` and touches down at `press`.
  clickIn: 120,
  press: 280,
  // The move leaves the seat for the server; every offset below keeps its pre-click
  // spacing, shifted by this much.
  move: 420,
  travel: 1050,
  decide: 1470,
  appendStart: 1560,
  appendTravel: 450,
  log: 2010,
  pushStart: 2160,
  tick: 3210,
} as const;

/** How long the click hand lingers after the move departs before it is gone. */
export const ARCH_CLICK_FADE_MS = 180;

// A move is not final when it is played. The seat renders it as a CANDIDATE the moment
// the hand lands, held semi-transparent until the server's push arrives and cements it.
// That is the figure's line between "what I did" and "what the authority ruled": the
// local board is a preview of the truth, never the truth itself.
export const ARCH_CANDIDATE_OPACITY = 0.4;
export const ARCH_CANDIDATE_IN_MS = 80;
export const ARCH_CEMENT_MS = 160;

// A token dissolves as it lands, so its journey is visible without it lingering.
export const ARCH_TOKEN_FADE_MS = 160;

export type ArchSeat = 'x' | 'o';
export type ArchTurn = { seat: ArchSeat; cell: number };

// The fixed game the loop plays: X builds a double threat, O can only answer one
// of them, and X completes the middle row on turn 7. Fixing the script is the
// point — a figure that never repeats itself cannot be read twice.
export const ARCH_GAME: readonly ArchTurn[] = [
  { seat: 'x', cell: 0 },
  { seat: 'o', cell: 1 },
  { seat: 'x', cell: 4 },
  { seat: 'o', cell: 8 },
  { seat: 'x', cell: 3 },
  { seat: 'o', cell: 6 },
  { seat: 'x', cell: 5 },
];

/** The three cells the last turn completes; the loop's only accent. */
export const ARCH_WIN_LINE = [3, 4, 5] as const;

// The end of the loop, measured from the last turn's tick: the winning line beats,
// holds while it is read, then every mark fades back to the empty board the loop
// restarts from. The board clears; the log does not — appends are durable. Scaled
// with the turn so the win still gets its own unhurried beat.
export const ARCH_END = { winIn: 180, winHold: 1020, fadeMs: 600 } as const;

/** Quiet time between the fade clearing the board and the next game's first move. */
export const ARCH_LOOP_HEADROOM_MS = 240;

export const plyStartMs = (ply: number) => ply * PLY_MS;
export const plyTickMs = (ply: number) => plyStartMs(ply) + ARCH_PLY.tick;

const LAST_TICK_MS = plyTickMs(ARCH_GAME.length - 1);
export const ARCH_WIN_AT_MS = LAST_TICK_MS + ARCH_END.winIn;
export const ARCH_FADE_AT_MS = ARCH_WIN_AT_MS + ARCH_END.winHold;
export const ARCH_FADE_END_MS = ARCH_FADE_AT_MS + ARCH_END.fadeMs;

// The loop's own length is DERIVED, never typed: it must outlast the last mark's
// fade or the seam tears (a stale literal here silently breaks the restart).
export const ARCH_CYCLE_MS = ARCH_FADE_END_MS + ARCH_LOOP_HEADROOM_MS;

export type ArchBeat = { id: string; at: number; label: string };

// Every motion role maps to a real protocol step (DESIGN_SYSTEM §8). These offsets
// are inside ONE turn; the loop repeats them once per turn in ARCH_GAME.
export const ARCH_PLY_BEATS: readonly ArchBeat[] = [
  {
    id: 'click',
    at: ARCH_PLY.click,
    label: 'the seated player clicks a cell on their own board',
  },
  {
    id: 'move',
    at: ARCH_PLY.move,
    label: 'the move leaves the seat for the server',
  },
  { id: 'decide', at: ARCH_PLY.decide, label: 'server decides the board' },
  {
    id: 'append',
    at: ARCH_PLY.appendStart,
    label: 'server writes the turn into the log',
  },
  {
    id: 'log',
    at: ARCH_PLY.log,
    label: 'the entry lands on the log',
  },
  {
    id: 'push',
    at: ARCH_PLY.pushStart,
    label: 'decided state pushed to both seats',
  },
  {
    id: 'tick',
    at: ARCH_PLY.tick,
    label:
      "the ack cements the sender's candidate; the other seat sees the move",
  },
];

// The loop's own beats, absolute in the cycle.
export const ARCH_LOOP_BEATS: readonly ArchBeat[] = [
  { id: 'win', at: ARCH_WIN_AT_MS, label: 'the winning line completes' },
  {
    id: 'fade',
    at: ARCH_FADE_AT_MS,
    label: 'every mark clears for the next game',
  },
];

export type ArchTone = 'neutral' | 'cyan' | 'indigo';

/** The two seats are people, not accounts: a distinct human avatar each, so the
    figure reads as a game between two players rather than two identical boxes. */
export type ArchAvatar = 'girl' | 'boy';

export type ArchTileId = 'player-x' | 'player-o' | 'server' | 'store';
export type ArchTileSpec = {
  id: ArchTileId;
  title: string;
  detail: string;
  tone: ArchTone;
  avatar?: ArchAvatar;
};

// Tone = meaning: seats are achromatic human actors, the server is the system
// authority, the store is data.
export const ARCH_TILES: readonly ArchTileSpec[] = [
  {
    id: 'player-x',
    title: 'Player X',
    detail: 'anonymous · seat',
    tone: 'neutral',
    avatar: 'girl',
  },
  {
    id: 'player-o',
    title: 'Player O',
    detail: 'anonymous · seat',
    tone: 'neutral',
    avatar: 'boy',
  },
  // The server tile earns its space: it names the two decisions the authority makes
  // (validate, apply) so the biggest surface is not empty.
  {
    id: 'server',
    title: 'Game server',
    detail: 'the only authority · validate the move · apply the board',
    tone: 'cyan',
  },
  {
    id: 'store',
    title: 'SQLite',
    detail: 'current state · append-only log',
    tone: 'indigo',
  },
];

export type ArchLaneId = 'move' | 'state-push';
export type ArchLane = { id: ArchLaneId; label: string; tone: ArchTone };

// Two lanes, one per direction. Each seat owns one of each, so the figure reads
// symmetrically: X and O are the same kind of participant.
export const ARCH_LANES: readonly ArchLane[] = [
  { id: 'move', label: 'move', tone: 'neutral' },
  { id: 'state-push', label: 'state push', tone: 'cyan' },
];

/** Every tile's inset: what headings, icons and boards are measured from. */
export const ARCH_TILE_PADDING = 16;

export type ArchEdgeId = 'move-x' | 'move-o' | 'state-x' | 'state-o' | 'append';

export type ArchEdge = {
  id: ArchEdgeId;
  /** Story lane this edge belongs to; the store write is structural, not a lane. */
  lane?: ArchLaneId;
  d: string;
  /** Path a token rides when it must stop clear of the connector's drawn end. Only
      the append traversal needs it: its mark is a glyph around its path point, so it
      must stop half a glyph above the store border to stay outside the tile. */
  tokenD?: string;
  tone: ArchTone;
  /** Which side the played marks ride, so they never cross this lane's own label.
      'above' is up on a horizontal lane and left on a vertical one. */
  tokenSide?: 'above' | 'below';
  label?: string;
  labelX?: number;
  labelY?: number;
  labelAnchor?: 'start' | 'middle' | 'end';
};

export type ArchTilePlacement = {
  id: ArchTileId;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ArchLayout = {
  width: number;
  height: number;
  tiles: readonly ArchTilePlacement[];
  edges: readonly ArchEdge[];
};

export type ArchToken = {
  edge: ArchEdgeId;
  /** The mark being carried: the turn's move on the way out, the decided state back. */
  seat: ArchSeat;
  startMs: number;
  travelMs: number;
};

/** Every message in the loop is a turn. The played mark rides its own seat's move
    lane out; the same decided mark rides both state-push lanes back, so a flip on
    the board is always explained by a line on the figure. */
export const archTokens = (): readonly ArchToken[] =>
  ARCH_GAME.flatMap((turn, ply) => {
    const start = plyStartMs(ply);
    // The move is on the wire only after the click: it starts at `move`, not at the
    // turn boundary, so the click is always seen as its cause.
    const move: ArchToken = {
      edge: `move-${turn.seat}`,
      seat: turn.seat,
      startMs: start + ARCH_PLY.move,
      travelMs: ARCH_PLY.travel,
    };
    const push = (edge: ArchEdgeId): ArchToken => ({
      edge,
      seat: turn.seat,
      startMs: start + ARCH_PLY.pushStart,
      travelMs: ARCH_PLY.travel,
    });
    // The write rides its own tether: the mark that was played is the mark the log
    // keeps, so the append is seen to arrive where it is stored.
    const append: ArchToken = {
      edge: 'append',
      seat: turn.seat,
      startMs: start + ARCH_PLY.appendStart,
      travelMs: ARCH_PLY.appendTravel,
    };
    return [move, push('state-x'), push('state-o'), append];
  });

// Clients stacked left, the authority column centre-right. The store sits directly
// UNDER the server, same width, so the log reads as the server's durable floor
// rather than a detached peer box. The 48 gap between the two is the append tether's
// runway: it must exceed twice the arrow-tip trim, or the arrowhead overshoots the
// path end into the store tile (asserted in the model test, see `appendEdge`). The
// viewBox is cropped to the content on every side (24px margin).
//
// Every board-holder is board + 2*inset, so no tile carries a dead band: the boards
// are the story and they own their tiles. The server is the other tile tall for a
// reason other than its copy — it must span the four lane rows — so its short copy is
// centred against them instead. The authority column (server over store) is wider than
// the seats so its longer copy clears the store's board at the tile type ramp.
const DESKTOP_TILES: readonly ArchTilePlacement[] = [
  { id: 'player-x', x: 24, y: 24, width: 240, height: 120 },
  { id: 'player-o', x: 24, y: 176, width: 240, height: 120 },
  { id: 'server', x: 400, y: 80, width: 272, height: 160 },
  { id: 'store', x: 400, y: 288, width: 272, height: 120 },
];

// Lanes run horizontally so every label can hang below its line and never cross it,
// and the four sit 48 apart (88, 136, 184, 232) — wide enough that a label lands in
// the gap between two lanes without meeting the next lane's traveling mark. Every
// vertical anchor mirrors about y160: the seat pair, the four lanes and the server
// are all symmetric about it, so one axis owns the whole figure. X sends at y88 and
// receives at y136, O receives at y184 and sends at y232.
const DESKTOP_EDGES: readonly ArchEdge[] = [
  {
    id: 'move-x',
    lane: 'move',
    d: 'M 264 88 H 400',
    tone: 'neutral',
    tokenSide: 'above',
    label: 'move',
    labelX: 332,
    labelY: 108,
    labelAnchor: 'middle',
  },
  {
    id: 'state-x',
    lane: 'state-push',
    d: 'M 400 136 H 264',
    tone: 'cyan',
    tokenSide: 'above',
    label: 'state push',
    labelX: 332,
    labelY: 156,
    labelAnchor: 'middle',
  },
  {
    id: 'state-o',
    lane: 'state-push',
    d: 'M 400 184 H 264',
    tone: 'cyan',
    tokenSide: 'above',
    label: 'state push',
    labelX: 332,
    labelY: 204,
    labelAnchor: 'middle',
  },
  {
    id: 'move-o',
    lane: 'move',
    d: 'M 264 232 H 400',
    tone: 'neutral',
    tokenSide: 'above',
    label: 'move',
    labelX: 332,
    labelY: 252,
    labelAnchor: 'middle',
  },
];

// Two anonymous seats share the top row; the authority column (server over store)
// sits below. Every client↔server lane is then a short vertical in the single band
// between the seats and the server — no lane enters or crosses a tile, and no lane
// needs a side gutter. Each seat owns one lane in each direction, mirrored about the
// server's centre (x180): 96↔264 send, 144↔216 receive. The band is only 64 tall, so
// here the marks ride to the SIDE and every label faces away from them. The store is
// pushed 48 below the server so the append tether has the same runway as desktop.
const MOBILE_TILES: readonly ArchTilePlacement[] = [
  { id: 'player-x', x: 24, y: 24, width: 152, height: 88 },
  { id: 'player-o', x: 184, y: 24, width: 152, height: 88 },
  { id: 'server', x: 88, y: 176, width: 200, height: 104 },
  { id: 'store', x: 88, y: 328, width: 200, height: 88 },
];

// The two inner labels face into the open middle of the band so the outer lanes'
// marks can ride outward past them.
const MOBILE_EDGES: readonly ArchEdge[] = [
  {
    id: 'move-x',
    lane: 'move',
    d: 'M 96 112 V 176',
    tone: 'neutral',
    tokenSide: 'below',
    label: 'move',
    labelX: 92,
    labelY: 132,
    labelAnchor: 'end',
  },
  {
    id: 'state-x',
    lane: 'state-push',
    d: 'M 144 176 V 112',
    tone: 'cyan',
    tokenSide: 'above',
    label: 'state push',
    labelX: 148,
    labelY: 132,
    labelAnchor: 'start',
  },
  {
    id: 'state-o',
    lane: 'state-push',
    d: 'M 216 176 V 112',
    tone: 'cyan',
    tokenSide: 'below',
    label: 'state push',
    labelX: 212,
    labelY: 152,
    labelAnchor: 'end',
  },
  {
    id: 'move-o',
    lane: 'move',
    d: 'M 264 112 V 176',
    tone: 'neutral',
    tokenSide: 'above',
    label: 'move',
    labelX: 268,
    labelY: 132,
    labelAnchor: 'start',
  },
];

/** The store's contents are the game itself: the board the authority decided, not a
    table of rows. It is drawn with the SEATS' cell size so the figure reads as three
    boards of one state — the store's, and the two copies it pushed. */
export const storeBoardGeometry = (layout: ArchLayout) =>
  boardBox(
    tilePlacement(layout, 'store'),
    boardCell(tilePlacement(layout, 'player-x'))
  );

/** A vertical tether from the authority's base to the store's TOP EDGE, where it
    stops. This figure is the deliberate exception to the house rule that a tether
    ends ON the thing it changed: the traversal must never cross into the store tile
    (its own board plays the write beat instead), so the tether is seen to drop into
    the durable log but the tile is never entered. It falls from the server's centre,
    which the store shares, so the two stacked tiles read as one line into the log. The
    runway it spans is a layout contract: it must exceed twice `DIAGRAM_ARROW_TIP_TRIM`
    (the marker's forward reach), or `trimPathEnd` caps at half and the arrowhead
    overshoots into the tile — hence the 48 gap between the two placements. */
const appendEdge = (layout: ArchLayout): ArchEdge => {
  const server = tilePlacement(layout, 'server');
  const store = tilePlacement(layout, 'store');
  const serverBase = server.y + server.height;
  const x = server.x + server.width / 2;
  return {
    id: 'append',
    d: `M ${x} ${serverBase} V ${store.y}`,
    // The drawn tether reaches the border; the mark riding it stops half a glyph
    // short, so the glyph's leading edge just meets the border and never crosses it.
    tokenD: `M ${x} ${serverBase} V ${store.y - travelMarkSize(layout) / 2}`,
    tone: 'indigo',
    label: 'append · durable',
    // Clear of the write's own mark: the token rides the tether, so the label keeps
    // a mark's half-width plus a gutter to itself.
    labelX: x + 16,
    labelY: (serverBase + store.y) / 2 + 4,
    labelAnchor: 'start',
  };
};

const findTile = (tiles: readonly ArchTilePlacement[], id: ArchTileId) => {
  const placement = tiles.find((tile) => tile.id === id);
  if (!placement) throw new Error(`Layout is missing the ${id} tile.`);
  return placement;
};

export const tilePlacement = (
  layout: ArchLayout,
  id: ArchTileId
): ArchTilePlacement => findTile(layout.tiles, id);

const layoutOf = (
  width: number,
  height: number,
  tiles: readonly ArchTilePlacement[],
  lanes: readonly ArchEdge[]
): ArchLayout => {
  const base: ArchLayout = { width, height, tiles, edges: lanes };
  return { ...base, edges: [...lanes, appendEdge(base)] };
};

export const desktopLayout = (): ArchLayout =>
  layoutOf(696, 432, DESKTOP_TILES, DESKTOP_EDGES);

export const mobileLayout = (): ArchLayout =>
  layoutOf(360, 440, MOBILE_TILES, MOBILE_EDGES);

export const edgeBy = (layout: ArchLayout, id: ArchEdgeId): ArchEdge => {
  const edge = layout.edges.find((item) => item.id === id);
  if (!edge) throw new Error(`Layout is missing the ${id} edge.`);
  return edge;
};

/** Board cells (3×3) inside a tile, inset from its right edge. Narrow tiles (the
    mobile seat pair) shrink the cells so the heading never collides with the board. */
export const boardGeometry = (tile: ArchTilePlacement) =>
  boardBox(tile, boardCell(tile));

const boardCell = (tile: ArchTilePlacement) => (tile.width < 180 ? 16 : 24);

/** A mark riding a lane is the mark a cell will hold: draw it at the seat board's
    own cell size so the glyph that travels and the glyph that lands are one object.
    Capped at the book-wide flow token so a wide board's mark cannot ride out to meet
    the next lane's label. */
export const travelMarkSize = (layout: ArchLayout) =>
  Math.min(
    boardGeometry(tilePlacement(layout, 'player-x')).cell,
    DIAGRAM_TOKEN_SIZE.flow
  );

const boardBox = (tile: ArchTilePlacement, cell: number) => {
  // The grid line gutter is the sanctioned half-step (DIAGRAM_GRID / 2), smaller
  // than the 8px shape gap because a board's cells share a drawn grid, not a layout.
  const gap = DIAGRAM_GRID / 2;
  const size = cell * 3 + gap * 2;
  return {
    cell,
    gap,
    size,
    x: tile.x + tile.width - size - ARCH_TILE_PADDING,
    y: tile.y + (tile.height - size) / 2,
  };
};
