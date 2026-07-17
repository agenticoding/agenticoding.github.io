import React from 'react';

import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { ModelCallFrame } from './ModelCallFrame';
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

export default function AgentWorkStabilityDiagram() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}

function DesktopDiagram() {
  return (
    <svg className={styles.desktop} viewBox="0 0 800 512" aria-hidden="true">
      <Markers suffix="desktop" />
      <PressureBox pressure={PRESSURES[0]} x={16} y={24} />
      <PressureBox pressure={PRESSURES[1]} x={584} y={24} />
      <PressureBox pressure={PRESSURES[2]} x={16} y={424} />
      <PressureBox pressure={PRESSURES[3]} x={584} y={424} />
      <PressureArrows suffix="desktop" />
      <WorkSystem x={200} y={112} width={400} />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg className={styles.mobile} viewBox="0 0 340 680" aria-hidden="true">
      <Markers suffix="mobile" />
      <PressureBox pressure={PRESSURES[0]} x={16} y={16} width={148} />
      <PressureBox pressure={PRESSURES[1]} x={176} y={16} width={148} />
      <WorkSystem x={16} y={160} width={308} compact />
      <PressureBox pressure={PRESSURES[2]} x={16} y={576} width={148} />
      <PressureBox pressure={PRESSURES[3]} x={176} y={576} width={148} />
      <MobilePressureArrows suffix="mobile" />
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

function PressureArrows({ suffix }: { suffix: string }) {
  return (
    <g className={styles.pressureArrow}>
      <PressureArrow d="M 192 88 L 208 111" tone="violet" suffix={suffix} />
      <PressureArrow d="M 608 88 L 592 111" tone="indigo" suffix={suffix} />
      <PressureArrow d="M 216 424 L 240 408" tone="cyan" suffix={suffix} />
      <PressureArrow d="M 584 424 L 560 408" tone="warning" suffix={suffix} />
    </g>
  );
}

function MobilePressureArrows({ suffix }: { suffix: string }) {
  return (
    <g className={styles.pressureArrow}>
      <PressureArrow
        d="M 90 80 V 128 L 24 144 V 159"
        tone="violet"
        suffix={suffix}
      />
      <PressureArrow
        d="M 250 80 V 128 L 316 144 V 159"
        tone="indigo"
        suffix={suffix}
      />
      <PressureArrow d="M 90 576 V 561" tone="cyan" suffix={suffix} />
      <PressureArrow d="M 250 576 V 561" tone="warning" suffix={suffix} />
    </g>
  );
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
  x,
  y,
  width,
  compact = false,
}: {
  x: number;
  y: number;
  width: number;
  compact?: boolean;
}) {
  const height = compact ? 400 : 296;
  const center = x + width / 2;
  return (
    <g>
      <ModelCallFrame
        x={x}
        y={y}
        width={width}
        height={height}
        tabLabel="BOUNDED AGENT WORK"
        tabIcon={EMOJI.agent}
        fill="var(--surface-page)"
        stroke="var(--border-emphasis)"
        tabWidth={compact ? 212 : 216}
        rectClassName={styles.systemBoundary}
      />
      <Stabilizers x={x} y={y} width={width} compact={compact} />
      <AgentLoop x={x} y={y} width={width} compact={compact} />
      <text
        className={styles.systemNote}
        x={center}
        y={y + height - (compact ? 24 : 16)}
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
