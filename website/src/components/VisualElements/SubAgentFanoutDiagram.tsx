import clsx from 'clsx';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AgentNode } from './ActorNodes.tsx';
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
  ROOT_SCHEDULE,
  SUB_AGENT_PROFILES,
  parentRows,
  windowFill,
  type SubAgentContextRow,
} from './SubAgentFanoutModel';
import { TokenArrowTrain } from './TokenArrowTrain';
import type { TokenSequence } from './AnimatedTokenFlow';
import { DIAGRAM_STROKE } from './diagramScale';
import type { TokenTrainTiming } from './TokenTrainTiming';

// The static structure is the complete explanation. The CSS loop below only
// replays the causal schedule: 1 returns, 2 returns, then 3 and 4 run as one
// concurrent stage. Every satellite is a direct root call.
const PARENT_HEIGHT = 320;
const LOOP_MS = 11000;
const FLOW_STAGGER = { mode: 'pathSpacing', spacingPx: 24 } as const;
const FANOUT_FLOW_TOKEN_SIZE = 12;
const MOBILE_AGENT_SIZE = 32;
const MOBILE_ROW_MIN_HEIGHT = 40;
const MOBILE_STACK_HEIGHT = 560;
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

function mobileParentTile(row: SubAgentContextRow): RegionTile {
  return {
    ...parentTile(row),
    minHeight: row.spacer ? undefined : MOBILE_ROW_MIN_HEIGHT,
  };
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

function mobileStage(index: number) {
  const stage = ROOT_SCHEDULE.find((candidate) =>
    candidate.some((agentIndex) => agentIndex === index)
  );
  if (!stage)
    throw new RangeError(`no mobile stage for sub-agent ${index + 1}`);
  return stage;
}

function mobileWorkerCenter(index: number, frame: ContextSceneFrame) {
  const stage = mobileStage(index);
  if (stage.length === 1) return workerCenter(frame, index);
  const stageCenter =
    stage
      .flatMap((agentIndex) => [
        rowCenter(frame, `dispatch-${agentIndex}`),
        rowCenter(frame, `synthesis-${agentIndex}`),
      ])
      .reduce((total, landing) => total + landing, 0) /
    (stage.length * 2);
  return stageCenter + (index === stage[0] ? -32 : 32);
}

function mobileWorkerX(width: number) {
  return width * 0.85;
}

function mobileWorkerAnchorX(width: number) {
  return mobileWorkerX(width) - MOBILE_AGENT_SIZE / 2;
}

function mobilePath(
  index: number,
  frame: ContextSceneFrame,
  width: number,
  tone: FlowTone
) {
  const dispatch = tone === 'dispatch';
  const rootY = rowCenter(
    frame,
    `${dispatch ? 'dispatch' : 'synthesis'}-${index}`
  );
  const workerX = mobileWorkerAnchorX(width);
  const workerY = mobileWorkerCenter(index, frame);
  const elbowX = width * (index === 3 ? 0.77 : 0.76);
  return dispatch
    ? orthogonalPath(width * 0.7, rootY, elbowX, workerX, workerY)
    : orthogonalPath(workerX, workerY, elbowX, width * 0.7, rootY);
}

function MobileWorker({
  index,
  frame,
  width,
}: {
  index: number;
  frame: ContextSceneFrame;
  width: number;
}) {
  return (
    <div
      className={styles.mobileWorker}
      style={{
        left: mobileWorkerX(width),
        top: mobileWorkerCenter(index, frame),
      }}
    >
      <svg
        viewBox={`0 0 ${MOBILE_AGENT_SIZE} ${MOBILE_AGENT_SIZE}`}
        aria-hidden="true"
      >
        <AgentNode x={0} y={0} size={MOBILE_AGENT_SIZE} />
      </svg>
      <span>{`AGENT ${index + 1}`}</span>
    </div>
  );
}

function MobileDelegateRail({ frame }: { frame: ContextSceneFrame }) {
  const { ref, width } = useOverlayWidth();
  return (
    <div ref={ref} className={styles.mobileDelegateRail}>
      {width > 0 && (
        <svg
          className={styles.mobileFlowLayer}
          width={width}
          height={frame.height}
          aria-hidden="true"
        >
          {(['return', 'dispatch'] as const).flatMap((tone) =>
            SUB_AGENT_PROFILES.map((_, index) => (
              <FlowTrain
                key={`${tone}-${index}`}
                d={mobilePath(index, frame, width, tone)}
                tone={tone}
                startDelayMs={
                  tone === 'dispatch'
                    ? FLOW_DELAYS.dispatch[index]
                    : FLOW_DELAYS.synthesis[index]
                }
              />
            ))
          )}
        </svg>
      )}
      <span className={styles.mobileRailLabel}>DIRECT CALLS</span>
      <span
        className={styles.mobileParallelLabel}
        style={{ top: mobileWorkerCenter(3, frame) + MOBILE_AGENT_SIZE }}
      >
        3+4 PARALLEL
      </span>
      {width > 0 &&
        SUB_AGENT_PROFILES.map((_, index) => (
          <MobileWorker key={index} index={index} frame={frame} width={width} />
        ))}
    </div>
  );
}

function MobileDiagram() {
  const modelRows = parentRows();
  const rows = modelRows.map(mobileParentTile);
  return (
    <section className={styles.mobileDiagram} aria-hidden="true">
      <ContextRegionScene
        rows={rows}
        fallbackHeight={MOBILE_STACK_HEIGHT}
        fillRatio={windowFill(modelRows)}
        className={styles.mobileStackClip}
        stackClassName={styles.mobileRootStack}
        companionClassName={styles.mobileDelegateRail}
        renderRow={(row, { layout }) => (
          <AnimatedParentRow row={row} layout={layout} />
        )}
        renderCompanion={(frame) => <MobileDelegateRail frame={frame} />}
      />
    </section>
  );
}

export default function SubAgentFanoutDiagram() {
  return (
    <div className={styles.container}>
      <ResponsiveDiagram
        className={styles.panels}
        breakpoint="704px"
        mode="container"
        ariaLabel="A root orchestrator dispatches work to four sub-agents and receives compact synthesis results."
        desktop={<DesktopPanel />}
        mobile={<MobileDiagram />}
      />
      <p className={styles.screenReaderSummary}>
        One root orchestrator directly calls four sub-agents. Agent 1 returns
        before agent 2 starts. Agents 3 and 4 run concurrently. Each isolated
        sub-agent window returns only a compact synthesis to the root.
      </p>
    </div>
  );
}
