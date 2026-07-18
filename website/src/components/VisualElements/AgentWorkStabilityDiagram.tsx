import React from 'react';

import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import {
  type ModelCallFrameBounds,
  modelCallFrameTab,
  ModelCallFrame,
} from './ModelCallFrame';
import { TILE_GRID } from './diagramTileLayout';
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
        icon={EMOJI.compass}
      />
      <Stabilizer
        x={cardX}
        y={y + 80}
        width={cardWidth}
        label="WORKING CONTEXT"
        tone="indigo"
        icon={EMOJI.books}
      />
      <Stabilizer
        x={cardX}
        y={compact ? y + 272 : y + 240}
        width={cardWidth}
        label="INDEPENDENT EVIDENCE"
        tone="success"
        icon={EMOJI.check}
      />
    </>
  );
}

function Stabilizer({
  x,
  y,
  width,
  label,
  tone,
  icon,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  tone: Tone;
  icon: EmojiAsset;
}) {
  return (
    <g className={styles.stabilizer} data-tone={tone}>
      <rect x={x} y={y} width={width} height={24} rx={0} />
      <EmojiImage asset={icon} x={x + 8} y={y + 4} size={16} />
      <text x={x + 32} y={y + 16} textAnchor="start">
        {label}
      </text>
    </g>
  );
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
  const top = compact ? y + 136 : y + 120;
  const side = top + 40;
  const bottom = top + 80;
  const sideWidth = compact ? 80 : 96;
  const left = x + 24;
  const right = x + width - sideWidth - 24;
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
      <rect x={x} y={y} width={width} height={32} rx={0} />
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
