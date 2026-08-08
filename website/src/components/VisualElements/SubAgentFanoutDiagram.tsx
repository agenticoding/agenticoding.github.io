import clsx from 'clsx';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AgentNode } from './ActorNodes.tsx';
import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import styles from './SubAgentFanoutDiagram.module.css';
import {
  ContextRegionScene,
  StandardContextTile,
  type ContextSceneFrame,
  type RegionTile,
  type TileRenderProps,
} from './ContextRegions.tsx';
import {
  ROOT_AGENT_COUNT,
  ROOT_SCHEDULE,
  SUB_AGENT_PROFILES,
  compressionRatio,
  internalUnits,
  parentRows,
  synthesisUnits,
  windowFill,
  type SubAgentContextRow,
} from './SubAgentFanoutModel';
import { TokenArrowTrain } from './TokenArrowTrain';
import type { TokenSequence } from './AnimatedTokenFlow';
import { DIAGRAM_STROKE } from './diagramScale';
import type { DiagramTone } from './diagramTileLayout';
import type { TokenTrainTiming } from './TokenTrainTiming';

// The static structure is the complete explanation. The CSS loop below only
// replays the causal schedule: 1 returns, 2 returns, then 3 and 4 run as one
// concurrent stage. Every satellite is a direct root call.
const PARENT_HEIGHT = 320;
const LOOP_MS = 11000;
const FLOW_STAGGER = { mode: 'pathSpacing', spacingPx: 24 } as const;
const FANOUT_FLOW_TOKEN_SIZE = 12;
const MOBILE_VIEW = { width: 340, height: 356 } as const;
const MOBILE_ROOT = { x: 86, y: 8, width: 168, height: 36 } as const;
const MOBILE_CARD_HEIGHT = 60;
const MOBILE_ARROW_TONES = [
  'indigo',
  'violet',
] as const satisfies readonly DiagramTone[];
const DISPATCH_TOKENS = [
  { modality: 'code', signal: 'salient' },
  { modality: 'text' },
] as const satisfies TokenSequence;
const SYNTHESIS_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'text' },
] as const satisfies TokenSequence;
const FLOW_DELAYS = {
  dispatch: [0, 3000, 6000, 6000],
  synthesis: [1900, 4900, 8000, 8000],
} as const;

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

const satelliteStepClasses = [
  styles.satelliteOne,
  styles.satelliteTwo,
  styles.satellitePair,
  styles.satellitePair,
];

type FlowTone = 'dispatch' | 'return';
type FlowCoordinates = {
  rootX: number;
  workerX: number;
  dispatchElbowX: number;
  returnElbowX: number;
  dispatch: number;
  synthesis: number;
  center: number;
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

function AnimatedParentRow({
  row,
  layout,
}: {
  row: RegionTile;
  layout: TileRenderProps['layout'];
}) {
  return (
    <div className={clsx(styles.scheduleTile, parentStepClasses[row.id])}>
      <StandardContextTile row={row} layout={layout} />
    </div>
  );
}

function rowCenter(frame: ContextSceneFrame, rowId: string) {
  const row = frame.rows[rowId];
  if (!row) throw new Error(`missing root landing: ${rowId}`);
  return row.top + row.height / 2;
}

function landingStyle(top: number): CSSProperties {
  return { top };
}

function workerCenter(frame: ContextSceneFrame, index: number) {
  const dispatch = rowCenter(frame, `dispatch-${index}`);
  const synthesis = rowCenter(frame, `synthesis-${index}`);
  return (dispatch + synthesis) / 2;
}

function WorkerIdentity({ index }: { index: number }) {
  return (
    <span className={styles.workerIdentity}>
      <span>SUB-AGENT {index + 1}</span>
      <strong>{SUB_AGENT_PROFILES[index].task}</strong>
    </span>
  );
}

function DesktopWorker({ index, center }: { index: number; center: number }) {
  const sideClass = index % 2 === 0 ? styles.leftWorker : styles.rightWorker;
  return (
    <section
      className={clsx(styles.worker, sideClass, satelliteStepClasses[index])}
      style={landingStyle(center)}
      aria-label={`Direct root call ${index + 1}: ${SUB_AGENT_PROFILES[index].task}`}
    >
      <WorkerIdentity index={index} />
      <span className={styles.workerActor}>
        <AgentNode x={0} y={0} size={32} />
      </span>
    </section>
  );
}

function useOverlayWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
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

function flowCoordinates(
  index: number,
  frame: ContextSceneFrame,
  width: number
): FlowCoordinates {
  const isLeft = index % 2 === 0;
  const rootX = width * (isLeft ? 0.28 : 0.72);
  const actorX = width * (isLeft ? 0.15 : 0.85);
  return {
    rootX,
    workerX: actorX + (isLeft ? 20 : -20),
    dispatchElbowX: width * (isLeft ? 0.24 : 0.76),
    returnElbowX: width * (isLeft ? 0.21 : 0.79),
    dispatch: rowCenter(frame, `dispatch-${index}`),
    synthesis: rowCenter(frame, `synthesis-${index}`),
    center: workerCenter(frame, index),
  };
}

function orthogonalPath(
  fromX: number,
  fromY: number,
  elbowX: number,
  toX: number,
  toY: number
) {
  return `M ${fromX} ${fromY} H ${elbowX} V ${toY} H ${toX}`;
}

function flowTiming(startDelayMs: number): TokenTrainTiming {
  return {
    cycleMs: LOOP_MS,
    travelMs: 560,
    fadeMs: 120,
    repeat: 'loop',
    startDelayMs,
  };
}

function FlowTrain({
  d,
  tone,
  startDelayMs,
}: {
  d: string;
  tone: FlowTone;
  startDelayMs: number;
}) {
  const isDispatch = tone === 'dispatch';
  return (
    <TokenArrowTrain
      d={d}
      tokens={isDispatch ? DISPATCH_TOKENS : SYNTHESIS_TOKENS}
      stroke={`var(--visual-${isDispatch ? 'indigo' : 'violet'})`}
      tone={isDispatch ? 'indigo' : 'violet'}
      timing={flowTiming(startDelayMs)}
      stagger={FLOW_STAGGER}
      size={FANOUT_FLOW_TOKEN_SIZE}
      laneOffsetPx={0}
      className={styles.flowTrain}
      staticClassName={styles.staticTokenTrain}
      pathClassName={isDispatch ? styles.dispatchPath : styles.returnPath}
      strokeWidth={DIAGRAM_STROKE.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

function WorkerFlows({
  index,
  frame,
  width,
}: {
  index: number;
  frame: ContextSceneFrame;
  width: number;
}) {
  const flow = flowCoordinates(index, frame, width);
  return (
    <g className={satelliteStepClasses[index]}>
      <FlowTrain
        d={orthogonalPath(
          flow.rootX,
          flow.dispatch,
          flow.dispatchElbowX,
          flow.workerX,
          flow.center
        )}
        tone="dispatch"
        startDelayMs={FLOW_DELAYS.dispatch[index]}
      />
      <FlowTrain
        d={orthogonalPath(
          flow.workerX,
          flow.center,
          flow.returnElbowX,
          flow.rootX,
          flow.synthesis
        )}
        tone="return"
        startDelayMs={FLOW_DELAYS.synthesis[index]}
      />
    </g>
  );
}

function FanoutRails({ frame }: { frame: ContextSceneFrame }) {
  const { ref, width } = useOverlayWidth();
  return (
    <div ref={ref} className={styles.fanoutOverlay}>
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
            />
          ))}
        </svg>
      )}
      {SUB_AGENT_PROFILES.map((_, index) => (
        <DesktopWorker
          key={index}
          index={index}
          center={workerCenter(frame, index)}
        />
      ))}
    </div>
  );
}

function DesktopPanel() {
  const modelRows = parentRows();
  const rows = modelRows.map(parentTile);
  return (
    <section className={styles.panel} aria-label="Root orchestrator window">
      <div className={styles.panelHeader}>
        ROOT ORCHESTRATOR · CAUSAL TIMELINE
      </div>
      <ContextRegionScene
        rows={rows}
        fallbackHeight={PARENT_HEIGHT}
        fillRatio={windowFill(modelRows)}
        className={styles.stackClip}
        stackClassName={styles.rootStack}
        companionClassName={styles.fanoutOverlay}
        renderRow={(row, { layout }) => (
          <AnimatedParentRow row={row} layout={layout} />
        )}
        renderCompanion={(frame) => <FanoutRails frame={frame} />}
      />
    </section>
  );
}

type MobileCard = { x: number; y: number; width: number };

function mobileCard(stageIndex: number, position: number): MobileCard {
  const paired = ROOT_SCHEDULE[stageIndex].length > 1;
  return {
    x: paired ? 12 + position * 164 : 70,
    y: 76 + stageIndex * 98,
    width: paired ? 152 : 200,
  };
}

function mobileDispatchPath(card: MobileCard) {
  const left = card.x < MOBILE_VIEW.width / 2;
  const rootX = MOBILE_ROOT.x + (left ? 42 : MOBILE_ROOT.width - 42);
  const targetX = left ? card.x : card.x + card.width / 2;
  const railX = left ? card.x - 28 : targetX;
  const targetY = left ? card.y + MOBILE_CARD_HEIGHT / 2 : card.y;
  return `M ${rootX} 44 H ${railX} V ${targetY} H ${targetX}`;
}

function mobileReturnPath(card: MobileCard) {
  const rootY = MOBILE_ROOT.y + MOBILE_ROOT.height + 8;
  const railX = Math.min(MOBILE_VIEW.width - 8, card.x + card.width + 18);
  return `M ${card.x + card.width} ${card.y + MOBILE_CARD_HEIGHT / 2} H ${railX} V ${rootY} H ${MOBILE_ROOT.x + MOBILE_ROOT.width}`;
}

function MobileAgentCard({ index, card }: { index: number; card: MobileCard }) {
  const profile = SUB_AGENT_PROFILES[index];
  return (
    <g className={styles.mobileAgent}>
      <rect
        x={card.x}
        y={card.y}
        width={card.width}
        height={MOBILE_CARD_HEIGHT}
      />
      <AgentNode x={card.x + 25} y={card.y + 25} size={24} />
      <text x={card.x + 46} y={card.y + 22}>
        SUB-AGENT {index + 1}
      </text>
      <text x={card.x + 46} y={card.y + 35} className={styles.mobileTask}>
        {profile.task}
      </text>
      <text x={card.x + 12} y={card.y + 52} className={styles.mobileContract}>
        ← DISPATCH · SYNTHESIS →
      </text>
    </g>
  );
}

function MobileAgentRoute({
  index,
  card,
}: {
  index: number;
  card: MobileCard;
}) {
  return (
    <g>
      <DiagramArrow
        d={mobileDispatchPath(card)}
        markerIdPrefix="fanout-mobile"
        tone="indigo"
      />
      <DiagramArrow
        d={mobileReturnPath(card)}
        markerIdPrefix="fanout-mobile"
        tone="violet"
      />
      <MobileAgentCard index={index} card={card} />
    </g>
  );
}

function MobileStage({
  stage,
  stageIndex,
}: {
  stage: readonly number[];
  stageIndex: number;
}) {
  const priorStage = ROOT_SCHEDULE[stageIndex - 1];
  const label =
    stage.length > 1
      ? `STAGE ${stageIndex + 1} · CONCURRENT`
      : priorStage
        ? `STAGE ${stageIndex + 1} · AFTER ${priorStage.map((index) => index + 1).join(' + ')} SYNTHESIS`
        : 'STAGE 1 · ROOT DISPATCH';
  return (
    <g>
      <text
        x="12"
        y={mobileCard(stageIndex, 0).y - 8}
        className={styles.mobileStage}
      >
        {label}
      </text>
      {stage.map((index, position) => (
        <MobileAgentRoute
          key={index}
          index={index}
          card={mobileCard(stageIndex, position)}
        />
      ))}
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg
      viewBox={`0 0 ${MOBILE_VIEW.width} ${MOBILE_VIEW.height}`}
      className={styles.mobileDiagram}
      aria-hidden="true"
    >
      <DiagramArrowMarkers prefix="fanout-mobile" tones={MOBILE_ARROW_TONES} />
      <g className={styles.mobileRoot}>
        <rect
          x={MOBILE_ROOT.x}
          y={MOBILE_ROOT.y}
          width={MOBILE_ROOT.width}
          height={MOBILE_ROOT.height}
        />
        <AgentNode x={MOBILE_ROOT.x + 24} y={MOBILE_ROOT.y + 18} size={24} />
        <text x={MOBILE_ROOT.x + 44} y={MOBILE_ROOT.y + 17}>
          ROOT ORCHESTRATOR
        </text>
        <text x={MOBILE_ROOT.x + 44} y={MOBILE_ROOT.y + 29}>
          direct calls only
        </text>
      </g>
      {ROOT_SCHEDULE.map((stage, stageIndex) => (
        <MobileStage key={stageIndex} stage={stage} stageIndex={stageIndex} />
      ))}
    </svg>
  );
}

function ScheduleKey() {
  return (
    <p className={styles.scheduleKey}>
      <strong>ROOT-ONLY CALL ORDER</strong>
      <span>1 → 2 → 3 + 4</span>
      <span>+ = concurrent</span>
    </p>
  );
}

function CostSummary() {
  const ratio = Math.round(compressionRatio() * 10) / 10;
  return (
    <p className={styles.costSummary}>
      {ROOT_AGENT_COUNT} isolated windows burn {internalUnits()} units; only{' '}
      {synthesisUnits()} synthesis units return to the root (~{ratio}:1
      compression). This schedule peaks at 2 concurrent calls.
    </p>
  );
}

export default function SubAgentFanoutDiagram() {
  return (
    <div className={styles.container}>
      <ScheduleKey />
      <ResponsiveDiagram
        className={styles.panels}
        breakpoint="704px"
        mode="container"
        ariaLabel="A root orchestrator dispatches work to four sub-agents and receives compact synthesis results."
        desktop={<DesktopPanel />}
        mobile={<MobileDiagram />}
      />
      <CostSummary />
      <p className={styles.screenReaderSummary}>
        One root orchestrator directly calls four sub-agents. Agent 1 returns
        before agent 2 starts. Agents 3 and 4 run concurrently. Each isolated
        sub-agent window returns only a compact synthesis to the root.
      </p>
    </div>
  );
}
