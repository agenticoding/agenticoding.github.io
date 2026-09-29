/* eslint-disable react/prop-types -- TypeScript owns prop validation for SVG primitive props. */
import React from 'react';
import clsx from 'clsx';

import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { DiagramTile, type DiagramTileProps } from './DiagramTile';
import { DIAGRAM_ICON_SIZE, DIAGRAM_STROKE } from './diagramScale';
import { EmojiImage } from './ActorNodes';
import { EMOJI, centeredEmojiOffset, emojiDisplaySize } from './emojiAssets';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import { AnimatedPathTraveler } from './AnimatedTokenFlow';
import { trainLaneOffset } from './diagramGeometry';
import {
  tileToneVars,
  voiceStyle,
  type DiagramTone,
} from './diagramTileLayout';
import {
  ARCH_CANDIDATE_IN_MS,
  ARCH_CANDIDATE_OPACITY,
  ARCH_CEMENT_MS,
  ARCH_CLICK_FADE_MS,
  ARCH_CYCLE_MS,
  ARCH_FADE_AT_MS,
  ARCH_FADE_END_MS,
  ARCH_GAME,
  ARCH_PLY,
  ARCH_TILES,
  ARCH_TOKEN_FADE_MS,
  ARCH_WIN_AT_MS,
  ARCH_WIN_LINE,
  archTokens,
  boardGeometry,
  desktopLayout,
  edgeBy,
  mobileLayout,
  plyStartMs,
  plyTickMs,
  storeBoardGeometry,
  travelMarkSize,
  type ArchEdge,
  type ArchLayout,
  type ArchSeat,
  type ArchToken,
  type ArchTilePlacement,
  type ArchTileSpec,
  type ArchTurn,
} from './ticTacToeArchitectureModel.ts';
import styles from './TicTacToeArchitectureDiagram.module.css';

const ARIA_LABEL =
  "Two anonymous seats play one tic-tac-toe game at its own URL, with a single game server as the only authority. A move is not a board: the seat sends a move, the server decides the new board, appends the event to an append-only SQLite log, and pushes the board it decided to both seats. A seat renders the move it just played as a provisional candidate on its own board, and the server's push cements it; the other seat sees the same move for the first time on that push. Both seats keep drawing the same board until one of them closes the game out.";

// Motion spec (DESIGN_SYSTEM §8).
// Story loop: one whole game, turn by turn. Each turn is the same protocol — the
//   seated player clicks a cell (rendering it as a provisional candidate), the seat
//   sends a move, the server decides it, the decided board is written into the store
//   (its own third board), the stored state is pushed to both seats, and that push
//   cements the candidate on the sender while the other seat sees the move for the
//   first time — repeated until X completes the middle row on turn 7, then all three
//   boards clear and the next game starts on an empty grid.
// Semantic meaning: the hand landing on a cell is the click that causes the turn, so
//   the arrow that follows it is never a cause without an effect; a mark the seat
//   played is a CANDIDATE (dim) until the ack cements it, so the local board is a
//   preview, never the truth; every traveling glyph is one protocol message carrying
//   one turn's mark; the server pulse is the decision; the mark landing on the store's
//   board IS the write; the candidate brightening is the ack — and the store holding
//   the settled state before either seat confirms it is the ordering made visible.
// Reader benefit: shows that the seat sends a move but never owns the board — it
//   renders a candidate and the server cements it; that the turn is stored before it
//   is acknowledged; and that the opponent learns the move only from the server.
// Static fallback: complete. All four tiles, four lane labels, and three
//   boards of the finished game with its winning row highlighted all read with motion
//   off.
// Loop coherence: every role is derived from PLY_MS in the model, so no turn can
//   drift from the protocol it illustrates.
// Rejection test: removing the loop would hide the ordering — that the write lands in
//   the store before the push leaves — which a static frame cannot show.

type CycleStyle = React.CSSProperties & { '--cycle-ms': string };
type BoardBox = ReturnType<typeof boardGeometry>;
type CellBox = { x: number; y: number; size: number };
// Which keyframe a holder's mark lands on: the seat that played a turn sees its own
// candidate cement on the ack, the other seat sees the server's first appearance, and
// the store sees the write. Passing it in is what lets the three boards share one
// renderer while telling those stories apart.
type MarkNameFor = (turn: ArchTurn, ply: number) => string;

// Only the tones the edges actually use; the winning row owns the success accent and
// is drawn straight from the visual token rather than as an edge tone.
const EDGE_TONES = ['neutral', 'cyan', 'indigo'] as const;
// The lead icon of a seat, server or store sits beside the copy, cap-centred on the
// title rather than block-aligned to the tile edge. Stacking it above the copy is a
// variant decision (the mobile store's board leaves too little room for an inline icon).
// A mark that starts inside its cell reads as small; insetting 22% from the cell
// edge is what keeps X and O the same visual weight as the grid.
const MARK_INSET_RATIO = 0.22;
// The desktop-computer glyph (1F5A5) fills ~82% of its box height, while the file
// cabinet (1F5C4) and the seat avatars fill ~70%. At one nominal size the server
// therefore reads heavier than every other icon in the figure, so it is shrunk in
// place — `iconScale` leaves the reserved icon column (and the text column) unmoved.
const SERVER_ICON_SCALE = 0.85;
// One mark per traveler, so the stagger is inert — each traveler owns its own beat.
const SINGLE_TOKEN_STAGGER = { mode: 'fixedStep', stepMs: 0 } as const;
// 1F447 (backhand index pointing down) touches the cell with the index fingertip at
// (40.5, 64) of OpenMoji's 72 box, measured from the rendered asset. Anchoring that
// point on the cell's centre is what makes the hand point at the exact cell clicked;
// `EmojiImage` draws 1.12× from the box corner, so a plain centre anchor would miss.
const CLICK_FINGER = { x: 40.5 / 72, y: 64 / 72 } as const;
// Sized so the whole hand clears the tile's top edge even on the mobile seat (whose
// board sits only 16 above the tile border), with the fingertip still on the cell.
const CLICK_HAND_SIZE = 24;
// The hand is lifted above the cell at rest and drops onto it on the press beat.
const CLICK_HAND_LIFT = 7;

// Keyframe names are single-sourced here and applied INLINE: CSS Modules rewrites
// animation-name references but cannot see the injected @keyframes, so an inline
// name is what keeps the two in sync (CompactionLineDiagram precedent).
const KF = {
  serverPulse: 'archServerPulse',
  ownMark: (ply: number) => `archOwnMark${ply}`,
  pushMark: (ply: number) => `archPushMark${ply}`,
  storeMark: (ply: number) => `archStoreMark${ply}`,
  clickHand: (ply: number) => `archClickHand${ply}`,
  winLine: 'archWinLine',
  storeWinLine: 'archStoreWinLine',
};

export default function TicTacToeArchitectureDiagram() {
  return (
    <ResponsiveDiagram
      className={styles.container}
      breakpoint="40rem"
      mode="container"
      ariaLabel={ARIA_LABEL}
      desktop={<ArchScene layout={desktopLayout()} variant="desktop" />}
      mobile={<ArchScene layout={mobileLayout()} variant="mobile" />}
    />
  );
}

function ArchScene({
  layout,
  variant,
}: {
  layout: ArchLayout;
  variant: 'desktop' | 'mobile';
}) {
  const style: CycleStyle = { '--cycle-ms': `${ARCH_CYCLE_MS}ms` };
  return (
    <svg
      className={clsx(
        styles.diagram,
        variant === 'desktop' ? styles.desktopDiagram : styles.mobileDiagram
      )}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      aria-hidden="true"
      style={style}
    >
      <ArchKeyframes />
      <DiagramArrowMarkers prefix={`arch-${variant}`} tones={EDGE_TONES} />
      <LaneArrows layout={layout} variant={variant} />
      <LaneMarks layout={layout} />
      <EdgeLabels layout={layout} compact={variant === 'mobile'} />
      <Tiles layout={layout} variant={variant} />
      {/* The write drops from the server to the store's top edge, so its tether and
          its token are drawn after the tile surfaces — otherwise the store would paint
          over the moment the turn is stored. The tether deliberately stops at the
          boundary and does not enter the tile (see the model's `appendEdge`). */}
      <AppendArrow layout={layout} variant={variant} />
      <AppendMark layout={layout} />
    </svg>
  );
}

// The schedule injects one keyframe per animated role; each is a function of the
// turn model, so no beat can drift from the story.
function pct(ms: number) {
  return `${((ms / ARCH_CYCLE_MS) * 100).toFixed(2)}%`;
}

function ArchKeyframes() {
  return (
    <style>
      {[
        serverPulseKeyframes(),
        // The click that opens every turn, before any message is on the wire.
        ...ARCH_GAME.map((_, ply) => clickKeyframes(KF.clickHand(ply), ply)),
        // Each turn's mark has two treatments: on the seat that played it, a candidate
        // that cements on the ack; on the other seat, a first appearance on that same
        // ack. The store's write is always the settled state.
        ...ARCH_GAME.flatMap((_, ply) => [
          ownMarkKeyframes(KF.ownMark(ply), ply),
          markKeyframes(KF.pushMark(ply), plyTickMs(ply)),
        ]),
        ...ARCH_GAME.map((_, ply) =>
          markKeyframes(KF.storeMark(ply), storeLandsAt(ply))
        ),
        markKeyframes(KF.winLine, ARCH_WIN_AT_MS),
        markKeyframes(KF.storeWinLine, storeLandsAt(ARCH_GAME.length - 1)),
      ].join('\n')}
    </style>
  );
}

/** When the store's board takes a turn: the beat the write lands, a whole state push
    before the seats are told. */
function storeLandsAt(ply: number) {
  return plyStartMs(ply) + ARCH_PLY.log;
}

// A hold is expressed by repeating its value at BOTH ends of the window: a lone
// value lets CSS interpolate it across the whole cycle, so a mark would dissolve
// instead of holding until the fade.
function hold(value: number, from: number, to: number) {
  return `${pct(from)}, ${pct(to)} { opacity: ${value}; }`;
}

/** A mark, a winning row and a filled cell are the same effect: appear on the beat the
    holder's board lands the turn, hold while the game is read, then clear. */
function markKeyframes(name: string, landsAt: number) {
  return `@keyframes ${name} {
    0%, ${pct(landsAt)} { opacity: 0; }
    ${hold(1, landsAt + 120, ARCH_FADE_AT_MS)}
    ${pct(ARCH_FADE_END_MS)}, 100% { opacity: 0; }
  }`;
}

/** The turn as the seat that played it renders it: a CANDIDATE from the press until
    the ack (the push landing) cements it to solid. Same mark, two states — the figure's
    line between a local preview and the authority's ruling. */
function ownMarkKeyframes(name: string, ply: number) {
  const placed = plyStartMs(ply) + ARCH_PLY.press;
  const acked = plyStartMs(ply) + ARCH_PLY.tick;
  return `@keyframes ${name} {
    0%, ${pct(placed)} { opacity: 0; }
    ${hold(ARCH_CANDIDATE_OPACITY, placed + ARCH_CANDIDATE_IN_MS, acked)}
    ${hold(1, acked + ARCH_CEMENT_MS, ARCH_FADE_AT_MS)}
    ${pct(ARCH_FADE_END_MS)}, 100% { opacity: 0; }
  }`;
}

/** The click that opens a turn: the hand drops onto the seat's own cell, presses, and
    lets go as the move departs. This is the cause every later arrow explains. */
function clickKeyframes(name: string, ply: number) {
  const at = plyStartMs(ply);
  const release = at + ARCH_PLY.move;
  return `@keyframes ${name} {
    0%, ${pct(at)} { opacity: 0; transform: translateY(${-CLICK_HAND_LIFT}px); }
    ${pct(at + ARCH_PLY.clickIn)} { opacity: 1; transform: translateY(${-CLICK_HAND_LIFT}px); }
    ${pct(at + ARCH_PLY.press)} { opacity: 1; transform: translateY(0); }
    ${pct(release)} { opacity: 1; transform: translateY(0); }
    ${pct(release + ARCH_CLICK_FADE_MS)}, 100% { opacity: 0; transform: translateY(0); }
  }`;
}

function serverPulseKeyframes() {
  const beats = ARCH_GAME.map((_, ply) => {
    const decide = plyStartMs(ply) + ARCH_PLY.decide;
    const lead = ply === 0 ? '0%, ' : '';
    return `${lead}${pct(decide)} { opacity: 0; } ${pct(decide + 60)} { opacity: 1; } ${pct(decide + 240)} { opacity: 0; }`;
  });
  return `@keyframes ${KF.serverPulse} { ${beats.join(' ')} }`;
}

function LaneArrows({
  layout,
  variant,
}: {
  layout: ArchLayout;
  variant: string;
}) {
  return (
    <>
      {layout.edges.filter(isLane).map((edge) => (
        <DiagramArrow
          key={edge.id}
          d={edge.d}
          markerIdPrefix={`arch-${variant}`}
          tone={edge.tone}
        />
      ))}
    </>
  );
}

function AppendArrow({
  layout,
  variant,
}: {
  layout: ArchLayout;
  variant: string;
}) {
  const edge = edgeBy(layout, 'append');
  return (
    <DiagramArrow
      d={edge.d}
      markerIdPrefix={`arch-${variant}`}
      tone={edge.tone}
    />
  );
}

const isLane = (edge: ArchEdge) => Boolean(edge.lane);

// Every message the loop sends is a turn's mark riding its own line, so a flip on
// a board always traces back to a line and an arrowhead.
function LaneMarks({ layout }: { layout: ArchLayout }) {
  return (
    <>
      {archTokens()
        .filter(isLaneToken)
        .map((token, index) => (
          <SentMark key={index} layout={layout} token={token} />
        ))}
    </>
  );
}

function AppendMark({ layout }: { layout: ArchLayout }) {
  return (
    <>
      {archTokens()
        .filter(isAppendToken)
        .map((token, index) => (
          <SentMark key={index} layout={layout} token={token} />
        ))}
    </>
  );
}

const isLaneToken = (token: ArchToken) => token.edge !== 'append';
const isAppendToken = (token: ArchToken) => token.edge === 'append';

function SentMark({ layout, token }: { layout: ArchLayout; token: ArchToken }) {
  const edge = edgeBy(layout, token.edge);
  // The mark is the seat board's own cell size (see the model), which also keeps a
  // mark clear of the next lane's label at the 48-unit lane spacing.
  const size = travelMarkSize(layout);
  return (
    <AnimatedPathTraveler
      // A token that must stop clear of the connector's drawn end rides `tokenD`.
      pathD={edge.tokenD ?? edge.d}
      items={[token.seat]}
      timing={{
        cycleMs: ARCH_CYCLE_MS,
        startDelayMs: token.startMs,
        travelMs: token.travelMs,
        fadeMs: ARCH_TOKEN_FADE_MS,
        repeat: 'loop',
      }}
      stagger={SINGLE_TOKEN_STAGGER}
      // A lane mark rides clear of its line; the append write rides on its tether.
      laneOffsetPx={
        isLane(edge) ? trainLaneOffset(size, DIAGRAM_STROKE.default) : 0
      }
      laneOrientation={edge.tokenSide ?? 'above'}
      renderItem={(mark, center) => (
        <MarkGlyph
          mark={mark}
          cx={center.x}
          cy={center.y}
          size={size}
          strokeWidth={DIAGRAM_STROKE.default}
        />
      )}
      // The reduced-motion twin parks a mark mid-lane at an arbitrary point. The
      // boards already hold the whole game statically, so it is dropped instead.
      renderStaticItems={false}
    />
  );
}

function EdgeLabels({
  layout,
  compact,
}: {
  layout: ArchLayout;
  compact: boolean;
}) {
  return (
    <>
      {layout.edges.map((edge) =>
        edge.label ? (
          <LaneLabel
            key={edge.id}
            edge={edge}
            x={edge.labelX}
            y={edge.labelY}
            anchor={edge.labelAnchor}
            compact={compact}
          >
            {edge.label}
          </LaneLabel>
        ) : null
      )}
    </>
  );
}

function LaneLabel({
  edge,
  x,
  y,
  anchor,
  compact,
  children,
}: {
  edge: ArchEdge;
  x?: number;
  y?: number;
  anchor?: 'start' | 'middle' | 'end';
  compact?: boolean;
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor ?? 'start'}
      fill={toneAccent(edge.tone)}
      style={voiceStyle('keyword', compact ? 8 : 9.5, 500)}
    >
      {children}
    </text>
  );
}

function Tiles({
  layout,
  variant,
}: {
  layout: ArchLayout;
  variant: 'desktop' | 'mobile';
}) {
  return (
    <>
      {layout.tiles.map((placement) => {
        const spec = ARCH_TILES.find((tile) => tile.id === placement.id);
        if (!spec) return null;
        if (placement.id === 'server') {
          return (
            <ServerTile key={placement.id} spec={spec} placement={placement} />
          );
        }
        if (placement.id === 'store') {
          return (
            <StoreTile
              key={placement.id}
              spec={spec}
              placement={placement}
              board={storeBoardGeometry(layout)}
              stackIcon={variant === 'mobile'}
            />
          );
        }
        return (
          <SeatTile
            key={placement.id}
            spec={spec}
            placement={placement}
            seat={placement.id === 'player-x' ? 'x' : 'o'}
            stackIcon={variant === 'mobile'}
          />
        );
      })}
    </>
  );
}

function SeatTile({
  spec,
  placement,
  seat,
  stackIcon,
}: {
  spec: ArchTileSpec;
  placement: ArchTilePlacement;
  seat: ArchSeat;
  stackIcon: boolean;
}) {
  const board = boardGeometry(placement);
  return (
    <DiagramTile
      {...archTileProps(spec, placement)}
      // A seat is a person: its avatar leads the tile. The mobile tile is too narrow to
      // put the avatar beside the title, so there it stacks above the copy.
      icon={spec.avatar ? EMOJI[spec.avatar] : undefined}
      iconLayout={stackIcon ? 'above' : 'inline'}
    >
      <Board board={board}>
        {/* The turn this seat played is its own candidate; the turn it did not is
            state the server pushed. */}
        <TurnMarks
          board={board}
          nameFor={(turn, ply) =>
            turn.seat === seat ? KF.ownMark(ply) : KF.pushMark(ply)
          }
        />
        <WinningLine board={board} name={KF.winLine} />
      </Board>
      {/* Only the seat that is acting shows the click, and only over its own board: the
          press that causes the move is the seat's, never the authority's. */}
      {ARCH_GAME.map((turn, ply) =>
        turn.seat === seat ? (
          <ClickHand key={ply} board={board} turn={turn} ply={ply} />
        ) : null
      )}
    </DiagramTile>
  );
}

/** Every tile's shared heading request: the kit owns the copy, the tile supplies its
    own body. The icon is cap-centred on the title; the detail sits in the title's
    column except where a board crowds it (the store opts out). */
function archTileProps(
  spec: ArchTileSpec,
  placement: ArchTilePlacement
): DiagramTileProps {
  const detail = spec.detail.split(' · ');
  return {
    variant: 'rich',
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
    tone: spec.tone,
    // Every tile here also holds a drawing, so the heading is centred as one block
    // instead of hanging from the tile's top edge.
    align: 'center',
    title: spec.title,
    detail,
    detailMaxLines: detail.length,
    iconSize: DIAGRAM_ICON_SIZE.secondary,
    iconAnchor: 'drawn',
    showDivider: false,
  };
}

/** The press that opens a turn, parked on the cell `turn.cell` of the acting seat's
    own board: the cause the move token and every arrow after it explain. */
function ClickHand({
  board,
  turn,
  ply,
}: {
  board: BoardBox;
  turn: ArchTurn;
  ply: number;
}) {
  const cell = cellBox(board, turn.cell);
  const display = emojiDisplaySize(CLICK_HAND_SIZE);
  const offset = centeredEmojiOffset(CLICK_HAND_SIZE);
  // Anchor the fingertip — not the emoji box — on the cell centre. `EmojiImage`
  // recovers the drawn box from the point it is given, so the finger lands exactly.
  const left = cell.x + cell.size / 2 - CLICK_FINGER.x * display;
  const top = cell.y + cell.size / 2 - CLICK_FINGER.y * display;
  return (
    <g
      className={styles.clickHand}
      style={{ animationName: KF.clickHand(ply) }}
    >
      <EmojiImage
        asset={EMOJI.click}
        x={left + offset}
        y={top + offset}
        size={CLICK_HAND_SIZE}
      />
    </g>
  );
}

/** Every mark one board lands, in turn order. `nameFor` is what tells a holder's own
    candidate from the state it received: the same turn is provisional on the seat that
    played it and settled on the other. */
function TurnMarks({
  board,
  nameFor,
}: {
  board: BoardBox;
  nameFor: MarkNameFor;
}) {
  return (
    <>
      {ARCH_GAME.map((turn, ply) => (
        <TurnMark
          key={ply}
          board={board}
          turn={turn}
          name={nameFor(turn, ply)}
        />
      ))}
    </>
  );
}

/** One cell's mark: a candidate that cements where the seat played it, a first
    appearance wherever the server carried it. Holds until the board clears. */
function TurnMark({
  board,
  turn,
  name,
}: {
  board: BoardBox;
  turn: ArchTurn;
  name: string;
}) {
  const box = cellBox(board, turn.cell);
  return (
    <MarkGlyph
      mark={turn.seat}
      cx={box.x + box.size / 2}
      cy={box.y + box.size / 2}
      size={box.size}
      className={styles.turnMark}
      style={{ animationName: name }}
    />
  );
}

/** The winning row, drawn once around all three cells so the win reads as a line
    rather than three highlighted squares. The loop's single accent. */
function WinningLine({ board, name }: { board: BoardBox; name: string }) {
  const cells = ARCH_WIN_LINE.map((index) => cellBox(board, index));
  const first = cells[0];
  const last = cells[cells.length - 1];
  const pad = 2;
  return (
    <rect
      className={styles.winLine}
      style={{ animationName: name }}
      x={first.x - pad}
      y={first.y - pad}
      width={last.x + last.size + pad * 2 - first.x}
      height={first.size + pad * 2}
      fill="var(--visual-bg-success)"
      stroke="var(--visual-success)"
      strokeWidth={DIAGRAM_STROKE.connector}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function ServerTile({
  spec,
  placement,
}: {
  spec: ArchTileSpec;
  placement: ArchTilePlacement;
}) {
  return (
    <DiagramTile
      {...archTileProps(spec, placement)}
      icon={EMOJI.server}
      iconScale={SERVER_ICON_SCALE}
    >
      {/* The server's copy is short and its tile is tall (it spans the four lane rows),
          so the centred heading balances it instead of leaving the lower half a void. */}
      <rect
        className={styles.serverPulse}
        style={{ animationName: KF.serverPulse }}
        x={placement.x}
        y={placement.y}
        width={placement.width}
        height={placement.height}
        fill="none"
        stroke="var(--visual-cyan)"
        strokeWidth={DIAGRAM_STROKE.connector}
        vectorEffect="non-scaling-stroke"
      />
    </DiagramTile>
  );
}

function StoreTile({
  spec,
  placement,
  board,
  stackIcon,
}: {
  spec: ArchTileSpec;
  placement: ArchTilePlacement;
  board: BoardBox;
  stackIcon: boolean;
}) {
  return (
    <DiagramTile
      {...archTileProps(spec, placement)}
      icon={EMOJI.database}
      // The board crowds the title's column on mobile, so the icon stacks above the copy.
      iconLayout={stackIcon ? 'above' : 'inline'}
    >
      {/* The store holds the game itself: the board the authority decided, drawn with
          the seats' own renderer so the three cannot diverge. */}
      <Board board={board}>
        {/* The store holds the settled state: every turn is solid the moment it lands. */}
        <TurnMarks board={board} nameFor={(_turn, ply) => KF.storeMark(ply)} />
        <WinningLine board={board} name={KF.storeWinLine} />
      </Board>
    </DiagramTile>
  );
}

function Board({
  board,
  children,
}: {
  board: BoardBox;
  children: React.ReactNode;
}) {
  return (
    <g>
      {Array.from({ length: 9 }, (_, index) => {
        const box = cellBox(board, index);
        return (
          <rect
            key={index}
            x={box.x}
            y={box.y}
            width={box.size}
            height={box.size}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={DIAGRAM_STROKE.thin}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {children}
    </g>
  );
}

/** One glyph for both a board cell and a message on a lane, so a mark that travels
    and the mark that lands cannot diverge. Centred on (cx, cy) rather than boxed,
    because a traveler is positioned by its path midpoint. */
function MarkGlyph({
  mark,
  cx,
  cy,
  size,
  className,
  style,
  strokeWidth = DIAGRAM_STROKE.default,
}: {
  mark: ArchTurn['seat'];
  cx: number;
  cy: number;
  size: number;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}) {
  const radius = size / 2 - size * MARK_INSET_RATIO;
  return (
    <g
      className={className}
      style={style}
      fill="none"
      stroke="var(--text-heading)"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    >
      {mark === 'x' ? (
        <>
          <line
            x1={cx - radius}
            y1={cy - radius}
            x2={cx + radius}
            y2={cy + radius}
          />
          <line
            x1={cx + radius}
            y1={cy - radius}
            x2={cx - radius}
            y2={cy + radius}
          />
        </>
      ) : (
        <circle cx={cx} cy={cy} r={radius} />
      )}
    </g>
  );
}

function cellBox(board: BoardBox, index: number): CellBox {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return {
    x: board.x + col * (board.cell + board.gap),
    y: board.y + row * (board.cell + board.gap),
    size: board.cell,
  };
}

function toneAccent(tone: DiagramTone) {
  return tileToneVars(tone).accent;
}
