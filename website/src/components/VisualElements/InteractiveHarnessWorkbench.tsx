import React from 'react';
import clsx from 'clsx';
import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import type { TokenSequence } from './AnimatedTokenFlow';
import { TokenArrowTrain } from './TokenArrowTrain';
import { seededTokenTrain } from './TokenTrainSequence';
import { DiagramTile } from './DiagramTile';
import { GearNode } from './GearNode';
import { ModelCallFrame } from './ModelCallFrame';

import {
  DIAGRAM_STROKE,
  DIAGRAM_TOKEN_SIZE,
  RICH_TILE_SCALE,
  WORKBENCH_SCALE,
} from './diagramScale';
import { MODEL_CALL_FRAME_LAYOUT, TILE_GRID } from './diagramTileLayout';
import styles from './InteractiveHarnessWorkbench.module.css';

const ARIA_LABEL =
  'Interactive harness flow inside one root harness context: the human sets generic guardrails, the LLM chooses most tool-loop turns, use-case tools execute, and the human reviews or redirects the result.';

type Tone = 'model' | 'system' | 'warning' | 'neutral';
type Voice = 'human' | 'ai' | 'spec';
type FlowStep = 1 | 2 | 3 | 4 | 5;

type CardProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  tone: Tone;
  icon: EmojiAsset;
  eyebrow: string;
  title: string;
  detail: string;
  voice: Voice;
  step: FlowStep;
  weight?: number;
};

const COLORS: Record<
  Tone,
  { accent: string; border: string; fill: string; label: string; title: string }
> = {
  model: {
    accent: 'var(--visual-violet)',
    border: 'var(--visual-violet)',
    fill: 'var(--surface-raised)',
    label: 'var(--visual-violet)',
    title: 'var(--text-heading)',
  },
  system: {
    accent: 'var(--visual-cyan)',
    border: 'var(--visual-cyan)',
    fill: 'var(--surface-raised)',
    label: 'var(--visual-cyan)',
    title: 'var(--text-heading)',
  },
  warning: {
    accent: 'var(--visual-warning)',
    border: 'var(--visual-warning)',
    fill: 'var(--surface-raised)',
    label: 'var(--visual-warning)',
    title: 'var(--text-heading)',
  },
  neutral: {
    accent: 'var(--text-muted)',
    border: 'var(--border-default)',
    fill: 'var(--surface-raised)',
    label: 'var(--text-muted)',
    title: 'var(--text-heading)',
  },
};

const TOOLS = [
  { label: 'bash', icon: EMOJI.magnify },
  { label: 'LSP', icon: EMOJI.documentTabs },
  { label: 'FX', icon: EMOJI.check },
] as const;

const CONTEXT_TOKEN_SEQUENCE = seededTokenTrain('harness-context', 3);
const MOBILE_CONTEXT_TOKEN_SEQUENCE = seededTokenTrain('harness-context-mobile', 2);
const OBSERVATION_TOKEN_SEQUENCE = seededTokenTrain('harness-observation', 3);
const MOBILE_OBSERVATION_TOKEN_SEQUENCE = seededTokenTrain(
  'harness-observation-mobile',
  2
);
const ACTION_TOKEN_SEQUENCE = seededTokenTrain('harness-action', 3);
const MOBILE_ACTION_TOKEN_SEQUENCE = seededTokenTrain('harness-action-mobile', 2);
const FINAL_GATE_TOKEN_SEQUENCE = seededTokenTrain('harness-final-gate', 2);
const MOBILE_FINAL_GATE_TOKEN_SEQUENCE = seededTokenTrain(
  'harness-final-gate-mobile',
  8
);

const HARNESS_FLOW_DURATION_MS = 11200;
const HARNESS_TOKEN_TIMING = {
  cycleMs: HARNESS_FLOW_DURATION_MS,
  travelMs: 860,
  fadeMs: 180,
  repeat: 'loop',
} as const;
const HARNESS_TOKEN_STAGGER = { mode: 'fixedStep', stepMs: 120 } as const;
const FINAL_GATE_START_MS = 9400;
const TOKEN_FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const DESKTOP_NODE_Y = 104;
const DESKTOP_SCOPE = {
  x: 48,
  y: DESKTOP_NODE_Y,
  width: 184,
  height: 112,
} as const;
const DESKTOP_AGENT = {
  x: 280,
  y: DESKTOP_NODE_Y,
  width: 216,
  height: 112,
} as const;
const DESKTOP_TOOLS = { x: 284, y: 260, width: 220 } as const;
const DESKTOP_GATE = {
  x: 536,
  y: DESKTOP_NODE_Y,
  width: 184,
  height: 112,
} as const;
const DESKTOP_AGENT_CENTER_X = DESKTOP_AGENT.x + DESKTOP_AGENT.width / 2;
const DESKTOP_AGENT_RIGHT_X = DESKTOP_AGENT.x + DESKTOP_AGENT.width;
const MOBILE_AGENT = { x: 52, y: 234, width: 236, height: 100 } as const;
const LOOP_STARTS = [1800, 4600, 7400] as const;
const RETURN_STARTS = [3150, 5750, 8350] as const;

function color(tone: Tone) {
  return COLORS[tone];
}

function tokenTone(tone: Tone) {
  if (tone === 'system') return 'cyan';
  if (tone === 'model') return 'violet';
  return tone;
}

function Flow({ children }: { step: FlowStep; children: React.ReactNode }) {
  return <g>{children}</g>;
}

function Card({
  x,
  y,
  width,
  height,
  tone,
  icon,
  eyebrow,
  title,
  detail,
  voice,
  step: _step,
  weight = 1,
}: CardProps) {
  return (
    <DiagramTile
      x={x}
      y={y}
      width={width}
      height={height}
      tone={tone}
      icon={icon}
      eyebrow={eyebrow}
      title={title}
      detail={detail}
      titleVoice={voice}
      variant="rich"
      fill="var(--surface-raised)"
      weight={weight}
      rectClassName={styles.vectorStroke}
      density={
        height < RICH_TILE_SCALE.mobileDensityMaxHeight ? 'mobile' : 'desktop'
      }
    />
  );
}

function HarnessAgent({
  x,
  y,
  width,
  height,
  step: _step,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  step: FlowStep;
}) {
  const compact = height <= 100;
  const gearSize = compact ? TILE_GRID * 4 : 36;
  const gearX = compact ? x + width / 2 - gearSize / 2 : x + TILE_GRID * 3;
  const gearY = compact ? y + TILE_GRID * 4 : y + TILE_GRID * 5;
  const labelX = compact ? x + width / 2 : gearX + gearSize + TILE_GRID * 2;
  const labelAnchor = compact ? 'middle' : 'start';
  const titleY = compact
    ? y + TILE_GRID * 9 + TILE_GRID / 2
    : y + TILE_GRID * 7 + TILE_GRID / 2;
  const detailY = titleY + TILE_GRID * 2 + (compact ? 0 : TILE_GRID / 2);

  return (
    <g>
      <ModelCallFrame
        x={x}
        y={y}
        width={width}
        height={height}
        tabLabel="AGENT LOOP"
        tabIcon={EMOJI.agent}
        fill="var(--surface-raised)"
        stroke="var(--visual-violet)"
        rectClassName={styles.vectorStroke}
      />
      <GearNode
        x={gearX}
        y={gearY}
        size={gearSize}
        className={styles.loopGearSpin}
      />
      <text
        x={labelX}
        y={titleY}
        textAnchor={labelAnchor}
        className={styles.title}
        fill="var(--text-heading)"
      >
        LLM inside harness
      </text>
      <text
        x={labelX}
        y={detailY}
        textAnchor={labelAnchor}
        className={styles.detail}
        fill="var(--text-muted)"
      >
        chooses tool turns
      </text>
    </g>
  );
}

function Arrow({
  d,
  tone,
  step,
  tokens,
  startDelayMs,
  label,
  labelX,
  labelY,
}: {
  d: string;
  tone: Tone;
  step: FlowStep;
  tokens: TokenSequence;
  startDelayMs?: number;
  label?: string;
  labelX?: number;
  labelY?: number;
}) {
  const c = color(tone);
  return (
    <Flow step={step}>
      <TokenArrowTrain
        d={d}
        tokens={tokens}
        timing={{ ...HARNESS_TOKEN_TIMING, startDelayMs }}
        stagger={HARNESS_TOKEN_STAGGER}
        size={TOKEN_FLOW_SIZE}
        tone={tokenTone(tone)}
        stroke={c.accent}
        pathClassName={styles.vectorStroke}
        label={label}
        labelX={labelX}
        labelY={labelY}
        labelClassName={styles.loopLabel}
        labelFill={c.label}
      />
    </Flow>
  );
}

function StageLabel({
  x,
  y,
  id,
  label,
}: {
  x: number;
  y: number;
  id: string;
  label: string;
}) {
  return (
    <g>
      <text x={x} y={y} className={styles.stageId} fill="var(--text-muted)">
        {id}
      </text>
      <text
        x={x + TILE_GRID * 3}
        y={y}
        className={styles.stageText}
        fill="var(--text-muted)"
      >
        {label}
      </text>
    </g>
  );
}

function stageLabelYAboveFrameTab(frameY: number) {
  return frameY - MODEL_CALL_FRAME_LAYOUT.tabHeight / 2 - TILE_GRID;
}

function ToolSurface({
  x,
  y,
  width,
  step,
  mobile = false,
}: {
  x: number;
  y: number;
  width: number;
  step: FlowStep;
  mobile?: boolean;
}) {
  const gap = mobile ? 8 : 10;
  const chipW = (width - 32 - gap * 2) / 3;
  return (
    <Flow step={step}>
      <rect
        x={x}
        y={y}
        width={width}
        height="104"
        rx={0}
        ry={0}
        fill="var(--surface-raised)"
        stroke="var(--visual-cyan)"
        strokeWidth={DIAGRAM_STROKE.default}
        strokeDasharray="4 4"
        className={styles.vectorStroke}
      />
      <text
        x={x + 16}
        y={y + 25}
        className={styles.eyebrow}
        fill="var(--visual-cyan)"
      >
        USE-CASE TOOLS
      </text>
      {TOOLS.map((tool, i) => (
        <ToolChip
          key={tool.label}
          x={x + 16 + i * (chipW + gap)}
          y={y + 44}
          width={chipW}
          {...tool}
        />
      ))}
      <text
        x={x + 16}
        y={y + 88}
        className={styles.detail}
        fill="var(--text-muted)"
      >
        {mobile ? 'tools fit product domain' : 'product-specific APIs'}
      </text>
    </Flow>
  );
}

function ToolChip({
  x,
  y,
  width,
  label,
  icon,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  icon: EmojiAsset;
}) {
  const isShell = label === 'bash';
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height="28"
        rx={0}
        ry={0}
        fill="var(--surface-page)"
        stroke="var(--visual-cyan)"
        className={styles.vectorStroke}
      />
      {isShell ? (
        <text
          x={x + 10}
          y={y + 18}
          className={styles.chipPrompt}
          fill="var(--visual-cyan)"
        >
          &gt;
        </text>
      ) : (
        <EmojiImage
          asset={icon}
          x={x + 8}
          y={y + 6}
          size={WORKBENCH_SCALE.toolIconSize}
        />
      )}
      <text
        x={x + (isShell ? 25 : 31)}
        y={y + 18}
        className={styles.chipText}
        fill="var(--visual-cyan)"
      >
        {label}
      </text>
    </g>
  );
}

function ReviewGate({
  x,
  y,
  width,
  height,
  step,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  step: FlowStep;
}) {
  return (
    <Card
      x={x}
      y={y}
      width={width}
      height={height}
      tone="warning"
      icon={EMOJI.question}
      eyebrow="APPROVAL GATE"
      title="proceed?"
      detail="allow · reject · revise"
      voice="spec"
      step={step}
      weight={2}
    />
  );
}

function DesktopDiagram() {
  return (
    <svg
      viewBox="0 0 760 432"
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.desktopDiagram)}
    >
      <rect
        x="24"
        y="24"
        width="712"
        height="384"
        rx={0}
        ry={0}
        fill="none"
        stroke="var(--border-subtle)"
        className={styles.vectorStroke}
      />
      <DesktopLabels />
      <DesktopConnectors />
      <DesktopNodes />
    </svg>
  );
}

function DesktopLabels() {
  return (
    <g>
      <text
        x="44"
        y="48"
        className={styles.frameLabel}
        fill="var(--visual-cyan)"
      >
        ROOT HARNESS CONTEXT
      </text>
      <text
        x="44"
        y="392"
        className={styles.contextNote}
        fill="var(--text-muted)"
      >
        one root orchestrator context
      </text>
      <StageLabel x={52} y={84} id="01" label="scope" />
      <StageLabel
        x={DESKTOP_AGENT.x + TILE_GRID}
        y={stageLabelYAboveFrameTab(DESKTOP_AGENT.y)}
        id="02"
        label="choose"
      />
      <StageLabel x={312} y={248} id="03" label="act" />
      <StageLabel x={546} y={84} id="04" label="gate" />
    </g>
  );
}

function DesktopNodes() {
  return (
    <g>
      <Card
        {...DESKTOP_SCOPE}
        tone="neutral"
        icon={EMOJI.operator}
        eyebrow="HUMAN CONTROL"
        title="scope"
        detail="intent · limits"
        voice="human"
        step={1}
        weight={1.5}
      />
      <HarnessAgent {...DESKTOP_AGENT} step={2} />
      <ToolSurface {...DESKTOP_TOOLS} step={3} />
      <ReviewGate {...DESKTOP_GATE} step={4} />
    </g>
  );
}

function DesktopConnectors() {
  return (
    <g>
      <Arrow
        d={`M ${DESKTOP_SCOPE.x + DESKTOP_SCOPE.width} 160 H ${DESKTOP_AGENT.x}`}
        tone="model"
        step={2}
        tokens={CONTEXT_TOKEN_SEQUENCE}
        startDelayMs={200}
      />
      {LOOP_STARTS.map((startDelayMs) => (
        <Arrow
          key={`desktop-loop-${startDelayMs}`}
          d={`M ${DESKTOP_AGENT_CENTER_X} ${DESKTOP_AGENT.y + DESKTOP_AGENT.height} V ${DESKTOP_TOOLS.y}`}
          tone="model"
          step={3}
          tokens={ACTION_TOKEN_SEQUENCE}
          startDelayMs={startDelayMs}
        />
      ))}
      {RETURN_STARTS.map((startDelayMs) => (
        <Arrow
          key={`desktop-return-${startDelayMs}`}
          d={`M ${DESKTOP_AGENT_CENTER_X + TILE_GRID * 4} ${DESKTOP_TOOLS.y} V ${DESKTOP_AGENT.y + DESKTOP_AGENT.height}`}
          tone="system"
          step={5}
          tokens={OBSERVATION_TOKEN_SEQUENCE}
          startDelayMs={startDelayMs}
          label={
            startDelayMs === RETURN_STARTS[0]
              ? 'LLM selects most next steps'
              : undefined
          }
          labelX={92}
          labelY={300}
        />
      ))}
      <Arrow
        d={`M ${DESKTOP_AGENT_RIGHT_X} 160 H ${DESKTOP_GATE.x}`}
        tone="warning"
        step={4}
        tokens={FINAL_GATE_TOKEN_SEQUENCE}
        startDelayMs={FINAL_GATE_START_MS}
        label="human approves or redirects"
        labelX={536}
        labelY={300}
      />
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg
      viewBox="0 0 340 704"
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.mobileDiagram)}
    >
      <rect
        x="18"
        y="20"
        width="304"
        height="664"
        rx={0}
        ry={0}
        fill="none"
        stroke="var(--border-subtle)"
        className={styles.vectorStroke}
      />
      <MobileLabels />
      <MobileConnectors />
      <MobileNodes />
    </svg>
  );
}

function MobileLabels() {
  return (
    <g>
      <text
        x="170"
        y="40"
        textAnchor="middle"
        className={styles.frameLabel}
        fill="var(--visual-cyan)"
      >
        ROOT HARNESS CONTEXT
      </text>
      <text
        x="170"
        y="664"
        textAnchor="middle"
        className={styles.contextNote}
        fill="var(--text-muted)"
      >
        one root orchestrator context
      </text>
      <StageLabel x={52} y={72} id="01" label="scope" />
      <StageLabel
        x={52}
        y={stageLabelYAboveFrameTab(MOBILE_AGENT.y)}
        id="02"
        label="choose"
      />
      <StageLabel x={52} y={356} id="03" label="act" />
      <StageLabel x={52} y={520} id="04" label="gate" />
    </g>
  );
}

function MobileNodes() {
  return (
    <g>
      <Card
        x={52}
        y={84}
        width={WORKBENCH_SCALE.mobileRichCard.width}
        height={WORKBENCH_SCALE.mobileRichCard.height}
        tone="neutral"
        icon={EMOJI.operator}
        eyebrow="HUMAN CONTROL"
        title="scope"
        detail="intent · limits"
        voice="human"
        step={1}
        weight={1.5}
      />
      <HarnessAgent {...MOBILE_AGENT} step={2} />
      <ToolSurface x={52} y={368} width={236} step={3} mobile />
      <ReviewGate
        x={52}
        y={532}
        width={WORKBENCH_SCALE.mobileRichCard.width}
        height={WORKBENCH_SCALE.mobileRichCard.height}
        step={4}
      />
    </g>
  );
}

function MobileConnectors() {
  return (
    <g>
      <Arrow
        d="M 170 196 V 226"
        tone="model"
        step={2}
        tokens={MOBILE_CONTEXT_TOKEN_SEQUENCE}
        startDelayMs={200}
      />
      {LOOP_STARTS.map((startDelayMs) => (
        <Arrow
          key={`mobile-loop-${startDelayMs}`}
          d="M 148 334 V 368"
          tone="model"
          step={3}
          tokens={MOBILE_ACTION_TOKEN_SEQUENCE}
          startDelayMs={startDelayMs}
        />
      ))}
      {RETURN_STARTS.map((startDelayMs) => (
        <Arrow
          key={`mobile-return-${startDelayMs}`}
          d="M 192 368 V 334"
          tone="system"
          step={5}
          tokens={MOBILE_OBSERVATION_TOKEN_SEQUENCE}
          startDelayMs={startDelayMs}
        />
      ))}
      <Arrow
        d="M 288 284 H 306 V 588 H 288"
        tone="warning"
        step={4}
        tokens={MOBILE_FINAL_GATE_TOKEN_SEQUENCE}
        startDelayMs={FINAL_GATE_START_MS}
        label="human approves or redirects"
        labelX={94}
        labelY={506}
      />
    </g>
  );
}

export default function InteractiveHarnessWorkbench() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
