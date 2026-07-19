import React from 'react';

import { AnimatedTokenTrain } from './AnimatedTokenFlow';
import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import {
  type ModelCallFrameBounds,
  modelCallFrameTab,
  ModelCallFrame,
} from './ModelCallFrame';
import { TILE_GRID } from './diagramTileLayout';
import { seededTokenTrain } from './TokenTrainSequence';
import styles from './AgentWorkStabilityDiagram.module.css';

type Tone = 'violet' | 'indigo' | 'cyan' | 'warning' | 'success';

type Pressure = {
  lines: readonly string[];
  tone: Exclude<Tone, 'success'>;
};

const PRESSURES: readonly Pressure[] = [
  { lines: ['UNPREDICTABLE', 'MODEL BEHAVIOR'], tone: 'violet' },
  { lines: ['MISSING CODEBASE', 'REALITY'], tone: 'indigo' },
  { lines: ['OVERSIZED OR', 'AMBIGUOUS TASK'], tone: 'cyan' },
  { lines: ['PLAUSIBLE,', 'UNVERIFIED OUTPUT'], tone: 'warning' },
];

const PRESSURE_TONES = PRESSURES.map(({ tone }) => tone);

const ARIA_LABEL =
  'Four production pressures surround a bounded agent-work loop: unpredictable model behavior, missing codebase reality, an oversized or ambiguous task, and plausible but unverified output. Explicit boundaries, working context, and independent evidence stabilize the loop of plan, act, observe, and verify.';
const WORK_TAB_LABEL = 'BOUNDED AGENT WORK';
const DESKTOP_FRAME = { x: 200, y: 112, width: 400, height: 296 };
const MOBILE_FRAME = { x: 16, y: 160, width: 308, height: 352 };
const DESKTOP_TAB_WIDTH = 216;
const MOBILE_TAB_WIDTH = 212;
const PRESSURE_ARROW_GRID = TILE_GRID;
const STABILIZER_HEIGHT = 24;
const WORKING_CONTEXT_OFFSET = 80;
const EVIDENCE_OFFSET = { desktop: 240, mobile: 272 } as const;
const LOOP_STAGE_HEIGHT = 32;
const LOOP_STAGE_STEP = 40;
const LOOP_VISUAL_HEIGHT = LOOP_STAGE_STEP * 2 + LOOP_STAGE_HEIGHT;
const CONTROLLED_RUN_DURATION = '9.6s';
const CONTROLLED_RUN_TIMING = {
  cycleMs: 9600,
  travelMs: 7600,
  fadeMs: 900,
  repeat: 'loop',
} as const;
const CONTROLLED_RUN_STAGGER = { mode: 'pathSpacing', spacingPx: 32 } as const;
const CONTROLLED_RUN_TOKENS = seededTokenTrain('agent-work-stability-loop', 4);

// Motion spec — A token train repeats Plan → Act → Observe → Verify on the actual loop
// connectors. Stabilizer pings mark their control points; all moving elements disappear
// under reduced motion, where this complete static diagram is canonical.

type WorkFrameGeometry = {
  frame: ModelCallFrameBounds;
  tab: ModelCallFrameBounds;
};
type ArrowSide = 'left' | 'right';

function workFrameGeometry(
  frame: ModelCallFrameBounds,
  compact: boolean
): WorkFrameGeometry {
  const tab = modelCallFrameTab(
    frame.x,
    frame.y,
    WORK_TAB_LABEL,
    compact ? MOBILE_TAB_WIDTH : DESKTOP_TAB_WIDTH,
    { tabAlign: 'center', frameWidth: frame.width }
  );
  return { frame, tab };
}

export default function AgentWorkStabilityDiagram() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}

function DesktopDiagram() {
  const geometry = workFrameGeometry(DESKTOP_FRAME, false);
  return (
    <svg className={styles.desktop} viewBox="0 0 800 512" aria-hidden="true">
      <Markers suffix="desktop" />
      <PressureBox pressure={PRESSURES[0]} x={16} y={24} />
      <PressureBox pressure={PRESSURES[1]} x={584} y={24} />
      <PressureBox pressure={PRESSURES[2]} x={16} y={424} />
      <PressureBox pressure={PRESSURES[3]} x={584} y={424} />
      <PressureArrows {...geometry} compact={false} suffix="desktop" />
      <WorkSystem {...geometry} compact={false} />
    </svg>
  );
}

function MobileDiagram() {
  const geometry = workFrameGeometry(MOBILE_FRAME, true);
  return (
    <svg className={styles.mobile} viewBox="0 0 340 680" aria-hidden="true">
      <Markers suffix="mobile" />
      <PressureBox pressure={PRESSURES[0]} x={16} y={16} width={148} />
      <PressureBox pressure={PRESSURES[1]} x={176} y={16} width={148} />
      <WorkSystem {...geometry} compact />
      <PressureBox pressure={PRESSURES[2]} x={16} y={576} width={148} />
      <PressureBox pressure={PRESSURES[3]} x={176} y={576} width={148} />
      <PressureArrows {...geometry} compact suffix="mobile" />
    </svg>
  );
}

function PressureBox({
  pressure,
  x,
  y,
  width = 200,
}: {
  pressure: Pressure;
  x: number;
  y: number;
  width?: number;
}) {
  return (
    <g className={styles.pressure} data-tone={pressure.tone}>
      <rect x={x} y={y} width={width} height={64} rx={0} />
      {pressure.lines.map((line, index) => (
        <text key={line} x={x + 16} y={y + 27 + index * 16}>
          {line}
        </text>
      ))}
    </g>
  );
}

function PressureArrows({
  frame,
  tab,
  compact,
  suffix,
}: WorkFrameGeometry & { compact: boolean; suffix: string }) {
  return (
    <g className={styles.pressureArrow}>
      <PressureArrow
        d={topPressurePath(frame, tab, 'left', compact)}
        tone="violet"
        suffix={suffix}
      />
      <PressureArrow
        d={topPressurePath(frame, tab, 'right', compact)}
        tone="indigo"
        suffix={suffix}
      />
      <PressureArrow
        d={bottomPressurePath(frame, 'left', compact)}
        tone="cyan"
        suffix={suffix}
      />
      <PressureArrow
        d={bottomPressurePath(frame, 'right', compact)}
        tone="warning"
        suffix={suffix}
      />
    </g>
  );
}

function topPressurePath(
  frame: ModelCallFrameBounds,
  tab: ModelCallFrameBounds,
  side: ArrowSide,
  compact: boolean
) {
  const sourceX = compact
    ? mobilePressureX(frame, side)
    : frame.x +
      (side === 'left'
        ? PRESSURE_ARROW_GRID * 2
        : frame.width - PRESSURE_ARROW_GRID * 2);
  const sourceY =
    frame.y - (compact ? PRESSURE_ARROW_GRID * 10 : PRESSURE_ARROW_GRID * 3);
  const targetX = compact
    ? sourceX
    : frame.x +
      (side === 'left'
        ? PRESSURE_ARROW_GRID * 5
        : frame.width - PRESSURE_ARROW_GRID * 5);
  const targetY = compact ? tab.y - 1 : frame.y;
  return compact
    ? `M ${sourceX} ${sourceY} V ${targetY}`
    : `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
}

function mobilePressureX(frame: ModelCallFrameBounds, side: ArrowSide) {
  return (
    frame.x +
    frame.width / 2 +
    (side === 'left' ? -PRESSURE_ARROW_GRID * 10 : PRESSURE_ARROW_GRID * 10)
  );
}

function bottomPressurePath(
  frame: ModelCallFrameBounds,
  side: ArrowSide,
  compact: boolean
) {
  const bottom = bottomEdge(frame);
  const sourceY =
    bottom + (compact ? PRESSURE_ARROW_GRID * 8 : PRESSURE_ARROW_GRID * 2);
  const sourceX = compact
    ? mobilePressureX(frame, side)
    : frame.x +
      (side === 'left'
        ? PRESSURE_ARROW_GRID * 2
        : frame.width - PRESSURE_ARROW_GRID * 2);
  const targetX = compact
    ? sourceX
    : frame.x +
      (side === 'left'
        ? PRESSURE_ARROW_GRID * 5
        : frame.width - PRESSURE_ARROW_GRID * 5);
  const targetY = bottom + (compact ? 1 : 0);
  return compact
    ? `M ${sourceX} ${sourceY} V ${targetY}`
    : `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
}

function bottomEdge(box: ModelCallFrameBounds) {
  return box.y + box.height;
}

function PressureArrow({
  d,
  tone,
  suffix,
}: {
  d: string;
  tone: Pressure['tone'];
  suffix: string;
}) {
  return (
    <path
      d={d}
      data-tone={tone}
      markerEnd={`url(#pressure-${tone}-${suffix})`}
    />
  );
}

function WorkSystem({
  frame,
  tab,
  compact = false,
}: WorkFrameGeometry & { compact?: boolean }) {
  const center = frame.x + frame.width / 2;
  return (
    <g>
      <ModelCallFrame
        {...frame}
        tabLabel={WORK_TAB_LABEL}
        tabIcon={EMOJI.agent}
        fill="var(--surface-page)"
        stroke="var(--border-emphasis)"
        tabWidth={tab.width}
        tabAlign="center"
        rectClassName={styles.systemBoundary}
      />
      <Stabilizers
        x={frame.x}
        y={frame.y}
        width={frame.width}
        compact={compact}
      />
      <AgentLoop
        x={frame.x}
        y={frame.y}
        width={frame.width}
        compact={compact}
      />
      <text
        className={styles.systemNote}
        x={center}
        y={bottomEdge(frame) - (compact ? 24 : 16)}
        textAnchor="middle"
      >
        REPEAT WITH CONTROL
      </text>
    </g>
  );
}

function Stabilizers({
  x,
  y,
  width,
  compact,
}: {
  x: number;
  y: number;
  width: number;
  compact: boolean;
}) {
  const cardWidth = compact ? 212 : 192;
  const cardX = x + width / 2 - cardWidth / 2;
  return (
    <>
      <Stabilizer
        x={cardX}
        y={y + 40}
        width={cardWidth}
        label="EXPLICIT BOUNDARIES"
        tone="cyan"
        motion="boundaries"
        icon={EMOJI.compass}
      />
      <Stabilizer
        x={cardX}
        y={y + WORKING_CONTEXT_OFFSET}
        width={cardWidth}
        label="WORKING CONTEXT"
        tone="indigo"
        motion="context"
        icon={EMOJI.books}
      />
      <Stabilizer
        x={cardX}
        y={evidenceStabilizerY(y, compact)}
        width={cardWidth}
        label="INDEPENDENT EVIDENCE"
        tone="success"
        motion="evidence"
        icon={EMOJI.check}
      />
    </>
  );
}

type StabilizerMotion = 'boundaries' | 'context' | 'evidence';

type StabilizerMotionTiming = {
  outlineTimes: string;
  outlineValues: string;
  pingTimes: string;
};

const STABILIZER_MOTION: Record<StabilizerMotion, StabilizerMotionTiming> = {
  boundaries: {
    outlineTimes: '0;0.02;0.12;0.16;1',
    outlineValues: '0;1;1;0;0',
    pingTimes: '0;0.02;0.06;1',
  },
  context: {
    outlineTimes: '0;0.22;0.27;0.61;0.66;1',
    outlineValues: '0;0;1;1;0;0',
    pingTimes: '0;0.22;0.26;1',
  },
  evidence: {
    outlineTimes: '0;0.72;0.77;0.85;0.90;1',
    outlineValues: '0;0;1;1;0;0',
    pingTimes: '0;0.72;0.76;1',
  },
};

function Stabilizer({
  x,
  y,
  width,
  label,
  tone,
  motion,
  icon,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  tone: Tone;
  motion: StabilizerMotion;
  icon: EmojiAsset;
}) {
  return (
    <g className={styles.stabilizer} data-tone={tone}>
      <rect x={x} y={y} width={width} height={STABILIZER_HEIGHT} rx={0} />
      <EmojiImage asset={icon} x={x + 8} y={y + 4} size={16} />
      <text x={x + 32} y={y + 16} textAnchor="start">
        {label}
      </text>
      <StabilizerSignal x={x} y={y} width={width} tone={tone} motion={motion} />
    </g>
  );
}

function StabilizerSignal({
  x,
  y,
  width,
  tone,
  motion,
}: {
  x: number;
  y: number;
  width: number;
  tone: Tone;
  motion: StabilizerMotion;
}) {
  const timing = STABILIZER_MOTION[motion];
  return (
    <g
      className={styles.stabilizerMotion}
      data-tone={tone}
      transform={`translate(${x + width / 2} ${y + 12})`}
    >
      <rect
        className={styles.stabilizerOutline}
        x={-width / 2 - 4}
        y={-16}
        width={width + 8}
        height={32}
        opacity="0"
      >
        <animate
          attributeName="opacity"
          dur={CONTROLLED_RUN_DURATION}
          repeatCount="indefinite"
          values={timing.outlineValues}
          keyTimes={timing.outlineTimes}
        />
      </rect>
      <rect
        className={styles.stabilizerPing}
        x={-width / 2 - 4}
        y={-16}
        width={width + 8}
        height={32}
        opacity="0"
      >
        <animate
          attributeName="opacity"
          dur={CONTROLLED_RUN_DURATION}
          repeatCount="indefinite"
          values="0;0.8;0;0"
          keyTimes={timing.pingTimes}
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          dur={CONTROLLED_RUN_DURATION}
          repeatCount="indefinite"
          values="1;1;1.12;1.12"
          keyTimes={timing.pingTimes}
        />
      </rect>
    </g>
  );
}

function evidenceStabilizerY(y: number, compact: boolean) {
  return y + EVIDENCE_OFFSET[compact ? 'mobile' : 'desktop'];
}

function centeredLoopTop(y: number, compact: boolean) {
  const contextBottom = y + WORKING_CONTEXT_OFFSET + STABILIZER_HEIGHT;
  const evidenceTop = evidenceStabilizerY(y, compact);
  return contextBottom + (evidenceTop - contextBottom - LOOP_VISUAL_HEIGHT) / 2;
}

function AgentLoop({
  x,
  y,
  width,
  compact,
}: {
  x: number;
  y: number;
  width: number;
  compact: boolean;
}) {
  const center = x + width / 2;
  const top = centeredLoopTop(y, compact);
  const side = top + LOOP_STAGE_STEP;
  const bottom = top + LOOP_STAGE_STEP * 2;
  const sideWidth = compact ? 80 : 96;
  const left = x + 24;
  const right = x + width - sideWidth - 24;
  const trainPath = loopTrainPath(
    center,
    top,
    side,
    bottom,
    left,
    right,
    sideWidth
  );
  return (
    <g className={styles.loop}>
      <LoopPath
        d={`M ${center + 48} ${top + 16} H ${right - 16} V ${side + 16} H ${right}`}
      />
      <LoopPath
        d={`M ${right + sideWidth} ${side + 16} H ${right + sideWidth - 16} V ${bottom + 16} H ${center + 48}`}
      />
      <LoopPath
        d={`M ${center - 48} ${bottom + 16} H ${left + sideWidth + 16} V ${side + 16} H ${left + sideWidth}`}
      />
      <LoopPath
        d={`M ${left} ${side + 16} H ${left + 16} V ${top + 16} H ${center - 48}`}
      />
      <AnimatedTokenTrain
        pathD={trainPath}
        tokens={CONTROLLED_RUN_TOKENS}
        timing={CONTROLLED_RUN_TIMING}
        stagger={CONTROLLED_RUN_STAGGER}
        size={16}
        tone="violet"
      />
      <LoopStage
        x={center - 48}
        y={top}
        label="PLAN"
        icon={EMOJI.documentTabs}
      />
      <LoopStage
        x={right}
        y={side}
        label="ACT"
        width={sideWidth}
        icon={EMOJI.act}
      />
      <LoopStage
        x={center - 48}
        y={bottom}
        label="OBSERVE"
        icon={EMOJI.observe}
      />
      <LoopStage
        x={left}
        y={side}
        label="VERIFY"
        width={sideWidth}
        icon={EMOJI.ruler}
      />
    </g>
  );
}

function loopTrainPath(
  center: number,
  top: number,
  side: number,
  bottom: number,
  left: number,
  right: number,
  sideWidth: number
) {
  const planY = top + 16;
  const sideY = side + 16;
  const observeY = bottom + 16;
  return [
    `M ${center} ${planY} H ${right - 16} V ${sideY} H ${right + sideWidth}`,
    `H ${right + sideWidth - 16} V ${observeY} H ${center - 48}`,
    `H ${left + sideWidth + 16} V ${sideY} H ${left}`,
    `H ${left + 16} V ${planY} H ${center}`,
  ].join(' ');
}

function LoopPath({ d }: { d: string }) {
  return <path d={d} markerEnd="url(#loop-arrow)" />;
}

function LoopStage({
  x,
  y,
  label,
  icon,
  width = 96,
}: {
  x: number;
  y: number;
  label: string;
  icon: EmojiAsset;
  width?: number;
}) {
  return (
    <g className={styles.loopStage}>
      <rect x={x} y={y} width={width} height={LOOP_STAGE_HEIGHT} rx={0} />
      <EmojiImage asset={icon} x={x + 8} y={y + 8} size={16} />
      <text x={x + 30} y={y + 21} textAnchor="start">
        {label}
      </text>
    </g>
  );
}

function Markers({ suffix }: { suffix: string }) {
  return (
    <defs>
      {PRESSURE_TONES.map((tone) => (
        <marker
          key={tone}
          id={`pressure-${tone}-${suffix}`}
          viewBox="0 0 6 6"
          refX="5"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 Z" data-tone={tone} />
        </marker>
      ))}
      <marker
        id="loop-arrow"
        viewBox="0 0 6 6"
        refX="5"
        refY="3"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path d="M 0 0 L 6 3 L 0 6 Z" />
      </marker>
    </defs>
  );
}
