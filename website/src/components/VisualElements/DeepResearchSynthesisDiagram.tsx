// Deep Research (v5) — one straight pipeline: walk the graph, then compress.
//
// EXPLORATION owns the graph. A walk lights the nodes it reaches and rings them,
// picking a candidate subset out of a large corpus; the skipped nodes stay dim. The
// harvested candidates leave the tile as ONE straight corridor of tokens — the same
// single-line flow every other figure uses, never a fan of diagonals.
//
// SYNTHESIS receives the corridor on its centre axis and runs three stages:
//   cluster  → candidates drop into topic rows, and each row is BUILT as it fills
//   compress → a row's candidates pile into that lane's exit and dissolve
//   merge    → the three exits join a funnel, which tapers to ONE mouth
// The funnel's trunk reaches the tile edge exactly where the out arrow starts, so the
// output stream is that same line continued; the answer node pops in once it clears.
//
// Motion spec (one loop, every stage chained off the model's schedule)
//   walk     → traversal edges trace, reached nodes brighten and ring
//   harvest  → the corridor streams candidates in
//   cluster  → rows appear as candidates arrive and seat themselves
//   compress → each row's candidates slide out and dissolve into its lane's exit
//   merge    → the exit plumbing opens: the lanes join the funnel and its trunk
//   answer   → the output stream leaves, then the answer node pops in
//   rollback → the walk, rows and answer reset at the wrap so the loop replays
// Static fallback: walk traced, reached nodes rung, candidates seated, rows built,
//   the funnel and its trunk drawn, the stream resting on its joint, answer shown —
//   motion can be disabled.
// Reduced motion: the shared CSS rests the trains and hides the motion.

import { useId, type CSSProperties } from 'react';
import { AnimatedSignalTrain, type TokenSequence } from './AnimatedTokenFlow';
import { EmojiImage } from './ActorNodes';
import { DIAGRAM_TOKEN_SIZE } from './diagramScale';
import { DiagramTileSurface } from './DiagramTile';
import { tileToneVars } from './diagramTileLayout';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import { TokenArrowTrain } from './TokenArrowTrain';
import { TokenUnit } from './TokenUnit';
import {
  CANDIDATE_ROWS,
  CLUSTER_COUNT,
  CORRIDOR_FADE_MS,
  CORRIDOR_START_MS,
  CORRIDOR_STEP_MS,
  CORRIDOR_TRAVEL_MS,
  DEEP_RESEARCH_SYNTHESIS_LAYOUT,
  DEEP_RESEARCH_SYNTHESIS_VIEWBOX,
  EDGE_TRACE_MS,
  ANSWER_LABEL_DROP,
  ANSWER_SIZE,
  answerNodeAt,
  EXIT_LANES_MS,
  FINAL_FADE_MS,
  FINAL_START_MS,
  FINAL_TOKEN_SPACING,
  FINAL_TRAVEL_MS,
  GRAPH_NODE_LABELS,
  LANE_TOKEN,
  SIGNAL_FADE_MS,
  SIGNAL_TRAVEL_MS,
  GRAPH_NODES,
  LOOP_MS,
  RING_FADE_MS,
  RING_HOLD_MS,
  ROLLBACK_START_MS,
  TRAVERSAL,
  candidateArrivalMs,
  candidateSlot,
  clusterRows,
  corridorPath,
  edgeRevealMs,
  exitRoutes,
  finalPath,
  finalTrainClearsMs,
  laneDrainedMs,
  laneExitPoint,
  laneExitStartMs,
  laneSignalStartMs,
  nodeById,
  nodeLabelAt,
  nodeRevealMs,
  rowBuildMs,
  traversalEdges,
  type DiagramMode,
  type GraphNodeId,
  type Point,
} from './deepResearchSynthesisModel';
import styles from './DeepResearchSynthesisDiagram.module.css';

const ARIA_LABEL =
  'Deep research in two phases: exploration walks a linked concept and source graph and picks a candidate subset, and synthesis clusters those candidates by topic, sends a signal out of every topic lane, and joins those lane exits into one stream that answers the question.';

const NODE_SIZE = 24;
const NODE_RING_RADIUS = 18;
const CANDIDATE_SIZE = LANE_TOKEN.size;
const FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const CONTEXT_STROKE = tileToneVars('context').accent;
const SUCCESS_STROKE = tileToneVars('success').accent;

type NodeVisual = { emoji: EmojiAsset };

// The stop's glyph only: its name lives in the model, which owns the label's
// geometry and therefore has to own the string it is sized from.
const NODE_VISUALS: Record<GraphNodeId, NodeVisual> = {
  question: { emoji: EMOJI.question },
  web: { emoji: EMOJI.globe },
  specs: { emoji: EMOJI.ruler },
  docs: { emoji: EMOJI.books },
  idea: { emoji: EMOJI.lightBulb },
  detail: { emoji: EMOJI.microscope },
};

// Mixed modalities: the harvested stream is heterogeneous reality, not one source
// kind. Enough tokens that, overlapping in the corridor, they read as one flow.
const CANDIDATE_TOKENS = [
  { modality: 'text' },
  { modality: 'code' },
  { modality: 'generic' },
  { modality: 'image' },
  { modality: 'text' },
  { modality: 'code' },
  { modality: 'generic' },
  { modality: 'text' },
  { modality: 'image' },
  { modality: 'code' },
  { modality: 'generic' },
  { modality: 'text' },
] as const satisfies TokenSequence;

// What leaves the funnel: one compressed fact per topic lane, as ONE stream.
const MERGED_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'generic', signal: 'salient' },
  { modality: 'text', signal: 'compressed' },
] as const satisfies TokenSequence;

export default function DeepResearchSynthesisDiagram() {
  return (
    <ResponsiveDiagram
      className={styles.container}
      breakpoint="768px"
      mode="viewport"
      ariaLabel={ARIA_LABEL}
      desktop={<Diagram mode="desktop" />}
      mobile={<Diagram mode="mobile" />}
    />
  );
}

function Diagram({ mode }: { mode: DiagramMode }) {
  const view = DEEP_RESEARCH_SYNTHESIS_VIEWBOX[mode];
  const names = useTimingNames();
  return (
    <svg
      className={`${styles.diagram} ${mode === 'mobile' ? styles.mobileDiagram : styles.desktopDiagram}`}
      style={{ '--cycle-ms': `${LOOP_MS}ms` } as CSSProperties}
      viewBox={`0 0 ${view.width} ${view.height}`}
    >
      <TimingStyles names={names} mode={mode} />
      <ExplorationGraph mode={mode} names={names} />
      <SynthesisTile mode={mode} names={names} />
      <CorridorTrain mode={mode} />
      <FinalTrain mode={mode} />
      <AnswerTile mode={mode} names={names} />
    </svg>
  );
}

// --- Exploration -----------------------------------------------------------
function ExplorationGraph({
  mode,
  names,
}: {
  mode: DiagramMode;
  names: TimingNames;
}) {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].exploration;
  const reachedStep = new Map(TRAVERSAL.map((id, index) => [id, index]));
  return (
    <g>
      <DiagramTileSurface {...tile} tone="context" weight={1.5} />
      <text
        x={tile.x + 16}
        y={tile.y + 26}
        fill={tileToneVars('context').label}
        className={styles.eyebrow}
      >
        EXPLORATION
      </text>
      <text
        x={tile.x + 16}
        y={tile.y + 44}
        fill="var(--text-muted)"
        className={styles.noteText}
      >
        follow the trail, pick candidates
      </text>
      {traversalEdges(mode).map((edge) => (
        <line
          key={`walk-${edge.key}`}
          x1={edge.from.x}
          y1={edge.from.y}
          x2={edge.to.x}
          y2={edge.to.y}
          pathLength={1}
          stroke={CONTEXT_STROKE}
          className={styles.tracedEdge}
          style={{ animationName: names.edge(edge.step) }}
        />
      ))}
      {(Object.keys(GRAPH_NODES[mode]) as GraphNodeId[]).map((id) => {
        const step = reachedStep.get(id);
        return (
          <GraphNodeView
            key={id}
            mode={mode}
            id={id}
            visual={NODE_VISUALS[id]}
            reached={step !== undefined}
            reachName={step === undefined ? undefined : names.reach(step)}
            ringName={step === undefined ? undefined : names.ring(step)}
          />
        );
      })}
    </g>
  );
}

function GraphNodeView({
  mode,
  id,
  visual,
  reached,
  reachName,
  ringName,
}: {
  mode: DiagramMode;
  id: GraphNodeId;
  visual: NodeVisual;
  reached: boolean;
  reachName?: string;
  ringName?: string;
}) {
  const at = nodeById(mode, id);
  const label = nodeLabelAt(mode, id);
  return (
    <g>
      {reached && (
        <circle
          cx={at.x}
          cy={at.y}
          r={NODE_RING_RADIUS}
          stroke={CONTEXT_STROKE}
          className={styles.reachRing}
          style={ringName ? { animationName: ringName } : undefined}
        />
      )}
      <g
        className={reached ? styles.reachedNode : styles.idleNode}
        style={reachName ? { animationName: reachName } : undefined}
      >
        <EmojiImage
          asset={visual.emoji}
          x={at.x - NODE_SIZE / 2}
          y={at.y - NODE_SIZE / 2}
          size={NODE_SIZE}
        />
        <text
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fill="var(--text-body)"
          className={styles.nodeLabel}
        >
          {GRAPH_NODE_LABELS[id]}
        </text>
      </g>
    </g>
  );
}

// --- Synthesis -------------------------------------------------------------
function SynthesisTile({
  mode,
  names,
}: {
  mode: DiagramMode;
  names: TimingNames;
}) {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].synthesis;
  return (
    <g>
      <DiagramTileSurface {...tile} tone="model" weight={1.5} />
      <text
        x={tile.x + 16}
        y={tile.y + 26}
        fill={tileToneVars('model').label}
        className={styles.eyebrow}
      >
        SYNTHESIS
      </text>
      <text
        x={tile.x + 16}
        y={tile.y + 44}
        fill="var(--text-muted)"
        className={styles.noteText}
      >
        cluster → compress → merge
      </text>
      {clusterRows(mode).map((row) => (
        <ClusterRow key={row.row} mode={mode} row={row.row} names={names} />
      ))}
      {/* Painted OVER the rows: a lane's lead runs from its row into the funnel, so the
          candidates that slide to the funnel's wide edge are swallowed by it — the
          pile visibly disappears into the vessel. */}
      <ExitPlumbing mode={mode} names={names} />
    </g>
  );
}

function ClusterRow({
  mode,
  row,
  names,
}: {
  mode: DiagramMode;
  row: number;
  names: TimingNames;
}) {
  const target = clusterRows(mode)[row];
  const candidates = CANDIDATE_ROWS.map((seat, index) => ({ seat, index }))
    .filter((entry) => entry.seat === row)
    .map((entry) => entry.index);
  return (
    <g>
      {/* The topic row itself: built the moment its first candidate lands. */}
      <rect
        x={target.box.x}
        y={target.box.y}
        width={target.box.width}
        height={target.box.height}
        className={styles.rowSurface}
        style={{ animationName: names.rowBuild(row) }}
        vectorEffect="non-scaling-stroke"
      />
      {candidates.map((candidate) => {
        const at = candidateSlot(mode, candidate);
        return (
          <g
            key={candidate}
            className={styles.candidateToken}
            style={{ animationName: names.candidateIn(row, candidate) }}
          >
            <TokenUnit
              x={at.x - CANDIDATE_SIZE / 2}
              y={at.y - CANDIDATE_SIZE / 2}
              width={CANDIDATE_SIZE}
              height={CANDIDATE_SIZE}
              tone="neutral"
              modality={CANDIDATE_TOKENS[candidate].modality}
            />
          </g>
        );
      })}
    </g>
  );
}

/** The grey exit plumbing: each lane's route corners out of its row onto the shared
 * spine and out of the tile, ending exactly where the out arrow begins — the plumbing
 * and the external stream read as ONE continued line. A lane's signal rides that route
 * once its candidates have dissolved, so the tile interior holds no train: the ONLY
 * train in the figure is the external one. It opens only once every lane is full. */
function ExitPlumbing({
  mode,
  names,
}: {
  mode: DiagramMode;
  names: TimingNames;
}) {
  return (
    <g
      className={styles.exitPlumbing}
      style={{ animationName: names.exitLanes }}
    >
      {exitRoutes(mode).map((route) => (
        <g key={`exit-${route.row}`}>
          <path
            d={route.d}
            className={styles.exitPipe}
            vectorEffect="non-scaling-stroke"
          />
          <AnimatedSignalTrain
            pathD={route.d}
            color={tileToneVars('neutral').stroke}
            timing={{
              cycleMs: LOOP_MS,
              travelMs: SIGNAL_TRAVEL_MS,
              fadeMs: SIGNAL_FADE_MS,
              repeat: 'loop',
              startDelayMs: laneSignalStartMs(route.row),
            }}
          />
        </g>
      ))}
    </g>
  );
}

// --- Flows -----------------------------------------------------------------
function CorridorTrain({ mode }: { mode: DiagramMode }) {
  return (
    <TokenArrowTrain
      d={corridorPath(mode)}
      tokens={CANDIDATE_TOKENS}
      timing={{
        cycleMs: LOOP_MS,
        travelMs: CORRIDOR_TRAVEL_MS,
        fadeMs: CORRIDOR_FADE_MS,
        repeat: 'loop',
        startDelayMs: CORRIDOR_START_MS,
      }}
      stagger={{ mode: 'fixedStep', stepMs: CORRIDOR_STEP_MS }}
      tone="neutral"
      stroke={CONTEXT_STROKE}
      size={FLOW_SIZE}
      pathClassName={styles.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

// The output lane is drawn ALWAYS — connector and arrowhead, exactly like the
// corridor's — so the pipeline's last hop is visible for the whole loop. Only its
// cargo is on the clock: the merged facts leave the tile once the lanes have drained,
// which is what keeps them from crossing before the fold.
function FinalTrain({ mode }: { mode: DiagramMode }) {
  return (
    <TokenArrowTrain
      d={finalPath(mode)}
      tokens={MERGED_TOKENS}
      timing={{
        cycleMs: LOOP_MS,
        travelMs: FINAL_TRAVEL_MS,
        fadeMs: FINAL_FADE_MS,
        repeat: 'loop',
        startDelayMs: FINAL_START_MS,
      }}
      stagger={{ mode: 'pathSpacing', spacingPx: FINAL_TOKEN_SPACING }}
      tone="indigo"
      stroke={CONTEXT_STROKE}
      size={FLOW_SIZE}
      pathClassName={styles.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

/** The answer is the figure's standard terminal — the check emoji plus its spec label
 * in the success accent — inside a container tile, so the pipeline ends at a tile and
 * not at a bare node. The tile is always drawn (the pipeline's last slot is visible
 * from the start); the NODE pops in on the arrival beat, once the output stream has
 * cleared the tile's edge. */
function AnswerTile({
  mode,
  names,
}: {
  mode: DiagramMode;
  names: TimingNames;
}) {
  const tile = DEEP_RESEARCH_SYNTHESIS_LAYOUT[mode].answer;
  const at = answerNodeAt(mode);
  return (
    <g>
      <DiagramTileSurface {...tile} tone="success" weight={1.5} />
      <g className={styles.answerNode} style={{ animationName: names.answer }}>
        <EmojiImage
          asset={EMOJI.check}
          x={at.x - ANSWER_SIZE / 2}
          y={at.y - ANSWER_SIZE / 2}
          size={ANSWER_SIZE}
        />
        <text
          x={at.x}
          y={at.y + ANSWER_SIZE / 2 + ANSWER_LABEL_DROP}
          textAnchor="middle"
          fill={SUCCESS_STROKE}
          className={styles.nodeLabel}
        >
          answer
        </text>
      </g>
    </g>
  );
}

// --- Keyframes --------------------------------------------------------------
type TimingNames = ReturnType<typeof useTimingNames>;

function useTimingNames() {
  const raw = useId().replace(/:/g, '');
  return {
    reach: (step: number) => `drs-reach-${raw}-${step}`,
    ring: (step: number) => `drs-ring-${raw}-${step}`,
    edge: (step: number) => `drs-edge-${raw}-${step}`,
    exitLanes: `drs-exit-${raw}`,
    rowBuild: (row: number) => `drs-row-${raw}-${row}`,
    candidateIn: (row: number, candidate: number) =>
      `drs-seat-${raw}-${row}-${candidate}`,
    answer: `drs-answer-${raw}`,
  };
}

function TimingStyles({
  names,
  mode,
}: {
  names: TimingNames;
  mode: DiagramMode;
}) {
  return <style>{keyframes(names, mode)}</style>;
}

const pct = (ms: number) => `${((ms / LOOP_MS) * 100).toFixed(3)}%`;
const REACH_MS = 220;
const ROLLBACK_MS = 400;

function keyframes(names: TimingNames, mode: DiagramMode): string {
  const reach = TRAVERSAL.map((_, step) =>
    rule(names.reach(step), appearRule(nodeRevealMs(step)))
  );
  const rings = TRAVERSAL.map((_, step) =>
    rule(names.ring(step), ringRule(nodeRevealMs(step)))
  );
  const edges = TRAVERSAL.slice(1).map((_, index) =>
    rule(names.edge(index + 1), traceRule(edgeRevealMs(index + 1)))
  );
  const rows = Array.from({ length: CLUSTER_COUNT }, (_, row) => [
    rule(names.rowBuild(row), appearRule(rowBuildMs(row))),
  ]).flat();
  const seats = CANDIDATE_ROWS.map((row, candidate) => {
    const seat = candidateSlot(mode, candidate);
    const exit = laneExitPoint(mode, row);
    return rule(
      names.candidateIn(row, candidate),
      binTokenRule(row, candidateArrivalMs(candidate), {
        x: exit.x - seat.x,
        y: exit.y - seat.y,
      })
    );
  });
  return [
    ...reach,
    ...rings,
    ...edges,
    ...rows,
    ...seats,
    rule(names.exitLanes, laneRule()),
    rule(names.answer, answerRule(mode)),
  ].join('\n');
}

function rule(name: string, body: string) {
  return `@keyframes ${name} {\n${body}\n}`;
}

/** A stop's ring is a ping, not a badge: it blooms when the stop is reached and
 * clears again, so the walk reads as a sequence of rings — each one firing that
 * stop's candidate train down the corridor. */
function ringRule(pulseMs: number) {
  const holdEnd = Math.min(pulseMs + RING_HOLD_MS, ROLLBACK_START_MS);
  const fadeEnd = Math.min(
    pulseMs + RING_HOLD_MS + RING_FADE_MS,
    ROLLBACK_START_MS + ROLLBACK_MS
  );
  return [
    `0%, ${pct(pulseMs)} { opacity: 0; transform: scale(0.55); }`,
    `${pct(holdEnd)} { opacity: 0.9; transform: scale(1); }`,
    `${pct(fadeEnd)}, 100% { opacity: 0; transform: scale(1.6); }`,
  ].join('\n');
}

/** A beat-driven appearance: hidden until the beat arrives, shown once it has
 * landed, then reset at the rollback. Used by the trail's stops and by each lane's
 * fact, which are the same kind of thing — a step of the story becoming true. */
function appearRule(arrivalMs: number) {
  return [
    `0%, ${pct(arrivalMs)} { opacity: 0; }`,
    `${pct(arrivalMs + REACH_MS)}, ${pct(ROLLBACK_START_MS)} { opacity: 1; }`,
    `${pct(ROLLBACK_START_MS + ROLLBACK_MS)}, 100% { opacity: 0; }`,
  ].join('\n');
}

/** The trail draws itself: a segment traces from stop to stop, then the next step
 * can begin — the movement the eye follows. */
function traceRule(beginMs: number) {
  const end = Math.min(beginMs + EDGE_TRACE_MS, ROLLBACK_START_MS);
  return [
    `0%, ${pct(beginMs)} { opacity: 0; stroke-dashoffset: 1; }`,
    `${pct(end)}, ${pct(ROLLBACK_START_MS)} { opacity: 1; stroke-dashoffset: 0; }`,
    `${pct(ROLLBACK_START_MS + ROLLBACK_MS)}, 100% { opacity: 0; stroke-dashoffset: 0; }`,
  ].join('\n');
}

/** A candidate seats itself when its train lands, then slides to its lane's exit
 * while it dissolves into the blue fact waiting there. Slide and fade share ONE
 * window, so the fade is not something that happens to the token afterwards — it
 * is the whole way the token leaves the row. */
function binTokenRule(row: number, arrivalMs: number, delta: Point) {
  const moved = `translate(${delta.x}px, ${delta.y}px)`;
  return [
    `0%, ${pct(arrivalMs)} { opacity: 0; transform: translate(0, 0); }`,
    `${pct(arrivalMs + CORRIDOR_FADE_MS)}, ${pct(laneExitStartMs(row))} { opacity: 1; transform: translate(0, 0); }`,
    `${pct(laneDrainedMs(row))}, 100% { opacity: 0; transform: ${moved}; }`,
  ].join('\n');
}

/** The answer node pops in once the output stream has cleared its tile, and holds long
 * enough to be the payoff rather than a flash. The lane it arrives on is drawn
 * unconditionally (see FinalTrain), so nothing here can hide it. */
function answerRule(mode: DiagramMode) {
  const arrival = finalTrainClearsMs(mode);
  return [
    `0%, ${pct(arrival)} { opacity: 0; transform: scale(0.92); }`,
    `${pct(arrival + REACH_MS)}, ${pct(ROLLBACK_START_MS)} { opacity: 1; transform: scale(1); }`,
    `${pct(ROLLBACK_START_MS + ROLLBACK_MS)}, 100% { opacity: 0; transform: scale(1); }`,
  ].join('\n');
}

/** The grey exit plumbing opens only once EVERY lane is full — it shows where the
 * output leaves, so it must not appear during the fill. */
function laneRule() {
  return [
    `0%, ${pct(EXIT_LANES_MS)} { opacity: 0; }`,
    `${pct(EXIT_LANES_MS + 200)}, ${pct(ROLLBACK_START_MS)} { opacity: 1; }`,
    `${pct(ROLLBACK_START_MS + ROLLBACK_MS)}, 100% { opacity: 0; }`,
  ].join('\n');
}
