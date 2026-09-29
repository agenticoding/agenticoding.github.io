import clsx from 'clsx';
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { AgentNode } from './ActorNodes.tsx';
import { arrivalBeatKeyframes } from './diagramBeat';
import shared from './diagram.module.css';
import styles from './SubAgentFanoutDiagram.module.css';
import {
  ContextRegionScene,
  StandardContextTile,
  type ContextSceneFrame,
  type RegionLayout,
  type RegionTile,
} from './ContextRegions.tsx';
import {
  SUB_AGENT_PROFILES,
  PARENT_STACK_HEIGHT,
  dispatchDelayMs,
  FLOW_FADE_MS,
  FLOW_LOOP_MS,
  FLOW_TRAVEL_MS,
  parentRows,
  synthesisDelayMs,
  windowFill,
  workDelayMs,
  type SubAgentContextRow,
} from './SubAgentFanoutModel';
import { TokenArrowTrain } from './TokenArrowTrain';
import type { TokenSequence } from './AnimatedTokenFlow';
import {
  IDENTITY_MEASURE,
  actorAnchor,
  callerRail,
  fanoutScale,
  flowGeometry,
  flowLane,
  identityMeasure,
  ledgerInset,
  tokenCapacity,
  workerCenter,
  type FanoutTokenGeometry,
  type FlowTone,
} from './subAgentFanoutFlow';
import type { TokenTrainStagger, TokenTrainTiming } from './TokenTrainTiming';

// Motion spec — the static schedule below is the complete explanation; motion
// only replays it.
//   Story loop     root issues a stage's calls → a call travels → that sub-agent
//                  works → its synthesis travels back. Three stages, one per
//                  caller plus the concurrent pair, then the loop repeats.
//   Semantics      row border = a call (indigo) or a synthesis (violet) leaving
//                  the window; token train = that payload in flight; actor = the
//                  sub-agent working, lit only between its dispatch landing and
//                  its answer via the book's shared arrival beat (the same scale
//                  pulse other figures apply to a tile), landing one beat per loop
//                  at workDelayMs(index) on the model's own clock (FLOW_LOOP_MS).
//   Reader benefit which agent is called when, that 3 and 4 overlap, and that
//                  nothing returns before the sub-agent has worked.
//   Static         rows, arrows, actor identities and the text summary carry the
//                  whole schedule with motion disabled.
//   Loop coherence every role is a phase of ONE loop; phases and the actor's work
//                  window come from SubAgentFanoutModel and the stylesheet mirrors
//                  them (guarded by subAgentFanoutFlow.test.ts).
//   Rejection test each role maps to a real process step — none is decoration.
// One composition at every width: a centered ledger and two outer rails. Only the
// actor tier, its glyph train, the ledger inset share and whether the identity
// label fits change with width (see subAgentFanoutFlow).
// Payload sequences: one distinguishing lead glyph (code / compressed) then text.
// A train shows the first `count` entries, where `count` is the most the
// viewport's runway can carry — so a longer run reads as a bigger payload rather
// than a wider gap between two glyphs.
const DISPATCH_TOKENS = [
  { modality: 'code', signal: 'salient' },
  { modality: 'text' },
  { modality: 'text' },
  { modality: 'text' },
  { modality: 'text' },
] as const satisfies TokenSequence;
const SYNTHESIS_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'text' },
  { modality: 'text' },
  { modality: 'text' },
  { modality: 'text' },
] as const satisfies TokenSequence;
const MAX_FLOW_TOKENS = Math.min(
  DISPATCH_TOKENS.length,
  SYNTHESIS_TOKENS.length
);

/** The train a tone carries, trimmed to the glyphs its runway fits. */
function trainTokens(base: TokenSequence, count: number): TokenSequence {
  return base.slice(0, Math.min(count, MAX_FLOW_TOKENS));
}

/** One count for all four trains, sized to the TIGHTEST flow so they read alike;
    the runway decides the count instead of a hand-picked literal. The `2` floor
    keeps every train a train even on a path too short for its shape gap. */
function flowTokenCount(frame: ContextSceneFrame, width: number) {
  const capacities = SUB_AGENT_PROFILES.map((_, index) => {
    const flow = flowGeometry(index, frame, width);
    return tokenCapacity(flow.tokens, flow.tokenRun);
  });
  return Math.min(MAX_FLOW_TOKENS, Math.max(2, Math.min(...capacities)));
}

function flowStagger(spacing: number): TokenTrainStagger {
  return { mode: 'pathSpacing', spacingPx: spacing };
}

const parentStepClasses: Record<string, string> = {
  'dispatch-0': styles.dispatchOne,
  'synthesis-0': styles.returnOne,
  'dispatch-1': styles.dispatchTwo,
  'synthesis-1': styles.returnTwo,
  'dispatch-2': styles.dispatchPair,
  'dispatch-3': styles.dispatchPair,
  'synthesis-2': styles.returnPair,
  'synthesis-3': styles.returnPair,
};

function parentTile(row: SubAgentContextRow): RegionTile {
  const tile: RegionTile = {
    ...row,
    labelFontFamily: 'var(--font-mono-spec)',
  };
  if (row.spacer) return tile;
  if (row.id === 'prompt') tile.accent = 'var(--border-emphasis)';
  else if (row.id === 'final') tile.accent = 'var(--border-default)';
  else if (row.id.startsWith('dispatch-')) tile.accent = 'var(--visual-indigo)';
  else if (row.id.startsWith('synthesis-'))
    tile.accent = 'var(--visual-violet)';
  else tile.accent = 'var(--visual-cyan)';
  return tile;
}

/** Every row spans the full ledger column; only the wrapper differs, because a
    row's own beat class is what lights it when its call or synthesis moves. */
function AnimatedParentRow({
  row,
  layout,
}: {
  row: RegionTile;
  layout: RegionLayout;
}) {
  return (
    <div className={clsx(styles.scheduleTile, parentStepClasses[row.id])}>
      <StandardContextTile row={row} layout={layout} />
    </div>
  );
}

function landingStyle(top: number): CSSProperties {
  return { top };
}

/** The rail's identity: eyebrow + task. Rendered only while the rail measure
    hosts the widest line, so the label never wraps past the actor box. */
function WorkerIdentity({ index }: { index: number }) {
  return (
    <span className={styles.workerIdentity}>
      <span>SUB-AGENT {index + 1}</span>
      <strong>{SUB_AGENT_PROFILES[index].task}</strong>
    </span>
  );
}

/** One actor box, centered on its lane midpoint. The box, its rail depth and its
    glyph size all come from the layout's own scale (CSS vars set on the panel),
    so the DOM and the routed arrows can never disagree. */
function Worker({
  index,
  center,
  actorSize,
  showIdentity,
  beatName,
}: {
  index: number;
  center: number;
  actorSize: number;
  showIdentity: boolean;
  beatName: string;
}) {
  const sideClass =
    callerRail(index) === 'left' ? styles.leftWorker : styles.rightWorker;
  return (
    <section
      className={clsx(styles.worker, sideClass)}
      style={landingStyle(center)}
      aria-label={`Direct root call ${index + 1}: ${SUB_AGENT_PROFILES[index].task}`}
    >
      {showIdentity && <WorkerIdentity index={index} />}
      <span
        className={clsx(shared.arrivalBeat, styles.workerBreathe)}
        style={beatStyle(beatName, index)}
      >
        <AgentNode x={0} y={0} size={actorSize} />
      </span>
    </section>
  );
}

/** The robot's pulse rides the model's own clock: one shared arrival beat per
    loop, landing when this caller's dispatch has reached it (workDelayMs). The
    beat is `arrivalBeat` (diagram.module.css) and its keyframe is generated from
    FLOW_LOOP_MS here, so the figure owns no pulse amplitude of its own. */
function beatStyle(beatName: string, index: number): CSSProperties {
  return {
    animationName: beatName,
    animationDuration: `${FLOW_LOOP_MS}ms`,
    animationDelay: `${workDelayMs(index)}ms`,
  };
}

/** Measure the panel's own width: it is the scene width the routes and the rail
    variables both read, so one observer keeps them in lockstep. `useLayoutEffect`
    measures before paint, so the composition never flashes the wrong inset. */
function useElementWidth() {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.clientWidth);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function flowTiming(startDelayMs: number): TokenTrainTiming {
  return {
    cycleMs: FLOW_LOOP_MS,
    travelMs: FLOW_TRAVEL_MS,
    fadeMs: FLOW_FADE_MS,
    repeat: 'loop',
    startDelayMs,
  };
}

function FlowTrain({
  d,
  tokenD,
  tone,
  startDelayMs,
  tokens,
  count,
}: {
  d: string;
  tokenD: string;
  tone: FlowTone;
  startDelayMs: number;
  tokens: FanoutTokenGeometry;
  count: number;
}) {
  const isDispatch = tone === 'dispatch';
  const lane = flowLane(tone, tokens);
  return (
    <TokenArrowTrain
      d={d}
      // The trains ride a root-inset variant of the same route, so no glyph
      // paints over the window border (see the layout's token inset).
      tokenPathD={tokenD}
      tokens={trainTokens(
        isDispatch ? DISPATCH_TOKENS : SYNTHESIS_TOKENS,
        count
      )}
      stroke={`var(--visual-${isDispatch ? 'indigo' : 'violet'})`}
      tone={isDispatch ? 'indigo' : 'violet'}
      timing={flowTiming(startDelayMs)}
      stagger={flowStagger(tokens.spacing)}
      size={tokens.size}
      // Each train rides the side of its line where its own ledger row has room
      // (see `flowLane` / `FLOW_ROW_MIN_HEIGHT`).
      laneOffsetPx={lane.offset}
      laneOrientation={lane.orientation}
      staticClassName={styles.staticTokenTrain}
      pathClassName={isDispatch ? styles.dispatchPath : styles.returnPath}
      strokeWidth={tokens.strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

function WorkerFlows({
  index,
  frame,
  width,
  count,
}: {
  index: number;
  frame: ContextSceneFrame;
  width: number;
  count: number;
}) {
  const flow = flowGeometry(index, frame, width);
  return (
    <g>
      <FlowTrain
        d={flow.paths.dispatch}
        tokenD={flow.tokenPaths.dispatch}
        tone="dispatch"
        startDelayMs={dispatchDelayMs(index)}
        tokens={flow.tokens}
        count={count}
      />
      <FlowTrain
        d={flow.paths.return}
        tokenD={flow.tokenPaths.return}
        tone="return"
        startDelayMs={synthesisDelayMs(index)}
        tokens={flow.tokens}
        count={count}
      />
    </g>
  );
}

function FanoutOverlay({
  frame,
  width,
  showIdentity,
}: {
  frame: ContextSceneFrame;
  width: number;
  showIdentity: boolean;
}) {
  const beatName = `fanout-beat-${useId().replace(/:/g, '')}`;
  const { actorSize } = fanoutScale(width);
  const count = width > 0 ? flowTokenCount(frame, width) : 0;
  return (
    <div className={styles.fanoutOverlay}>
      <style>{arrivalBeatKeyframes(beatName, FLOW_LOOP_MS)}</style>
      {width > 0 && (
        <svg
          className={styles.flowLayer}
          width={width}
          height={frame.height}
          aria-hidden="true"
        >
          {SUB_AGENT_PROFILES.map((_, index) => (
            <WorkerFlows
              key={index}
              index={index}
              frame={frame}
              width={width}
              count={count}
            />
          ))}
        </svg>
      )}
      {width > 0 &&
        SUB_AGENT_PROFILES.map((_, index) => (
          <Worker
            key={index}
            index={index}
            center={workerCenter(frame, index)}
            actorSize={actorSize}
            showIdentity={showIdentity}
            beatName={beatName}
          />
        ))}
    </div>
  );
}

/** The rail's own geometry, handed to CSS as one set of variables so the DOM and
    the routed arrows read the same numbers (single source of truth: the flow
    module). Below the identity threshold the label is dropped, not squeezed. */
function railStyle(width: number): CSSProperties {
  const { actorSize } = fanoutScale(width);
  const anchor = actorAnchor(width, actorSize);
  return {
    '--fanout-ledger-inset': `${ledgerInset(width)}px`,
    '--fanout-actor-center': `${anchor}px`,
    '--fanout-actor-size': `${actorSize}px`,
    '--fanout-identity-measure': `${identityMeasure(width, actorSize)}px`,
  } as CSSProperties;
}

function FanoutPanel() {
  const { ref, width } = useElementWidth();
  const { actorSize } = fanoutScale(width);
  const showIdentity =
    width > 0 && identityMeasure(width, actorSize) >= IDENTITY_MEASURE;
  const modelRows = parentRows();
  const rows = modelRows.map(parentTile);
  return (
    <section
      ref={ref}
      className={styles.panel}
      style={width > 0 ? railStyle(width) : undefined}
    >
      <div className={styles.panelHeader}>
        ROOT ORCHESTRATOR · CAUSAL TIMELINE
      </div>
      <ContextRegionScene
        rows={rows}
        fallbackHeight={PARENT_STACK_HEIGHT}
        fillRatio={windowFill(modelRows)}
        className={styles.stackClip}
        stackClassName={styles.rootStack}
        companionClassName={styles.fanoutOverlay}
        renderRow={(row, { layout }) => (
          <AnimatedParentRow row={row} layout={layout} />
        )}
        renderCompanion={(frame) => (
          <FanoutOverlay
            frame={frame}
            width={width}
            showIdentity={showIdentity}
          />
        )}
      />
    </section>
  );
}

export default function SubAgentFanoutDiagram() {
  return (
    <div className={styles.container}>
      <div
        className={styles.figure}
        role="img"
        aria-label="A root orchestrator dispatches work to four sub-agents and receives compact synthesis results."
      >
        <FanoutPanel />
      </div>
      <p className={styles.screenReaderSummary}>
        One root orchestrator directly calls four sub-agents. Agent 1 returns
        before agent 2 starts. Agents 3 and 4 run concurrently. Each isolated
        sub-agent window returns only a compact synthesis to the root.
      </p>
    </div>
  );
}
