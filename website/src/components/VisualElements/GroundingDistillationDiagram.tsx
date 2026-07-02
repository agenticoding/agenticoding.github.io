import React from 'react';
import type { TokenSequence } from './AnimatedTokenFlow';
import { DIAGRAM_ICON_SIZE, DIAGRAM_TOKEN_SIZE } from './diagramScale';
import { TokenArrowTrain } from './TokenArrowTrain';
import { seededTokenTrain } from './TokenTrainSequence';
import { WorkingAgentNode } from './WorkingAgentNode';
import styles from './GroundingDistillationDiagram.module.css';

const ARIA_LABEL =
  'Grounding distillation diagram: raw code, documentation, git history, and constraints stay inside an isolated grounding agent context. The grounding agent searches and synthesizes them into compact facts for the root orchestrator context, where the root agent consumes those facts.';

const FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const TOKEN_TRAIN_TIMING = {
  cycleMs: 7200,
  travelMs: 820,
  fadeMs: 160,
  repeat: 'loop',
} as const;
const TOKEN_TRAIN_STAGGER = { mode: 'fixedStep', stepMs: 110 } as const;
const GROUNDING_AGENT_ICON_SIZE = DIAGRAM_ICON_SIZE.primary;
const GROUNDING_AGENT_ICON_SIZE_COMPACT = DIAGRAM_ICON_SIZE.secondary;
const ROOT_AGENT_ICON_SIZE = DIAGRAM_ICON_SIZE.actor;
const ROOT_AGENT_ICON_SIZE_COMPACT = DIAGRAM_ICON_SIZE.primary;
const SOURCE_TOKENS = seededTokenTrain('grounding-source', 2);
const FACT_TOKENS = seededTokenTrain('grounding-facts', 2);

const SOURCES = [
  { label: 'Codebase / patterns', tone: 'cyan', y: 76, tokenY: 96 },
  { label: 'Docs / current APIs', tone: 'indigo', y: 124, tokenY: 144 },
  { label: 'Git history / decisions', tone: 'indigo', y: 172, tokenY: 192 },
  { label: 'Specs / constraints', tone: 'indigo', y: 220, tokenY: 240 },
] as const;
const FACTS = [
  'task goal',
  'module pattern',
  'API constraint',
  'prior decision',
] as const;
const MOBILE_SOURCE_Y = [76, 132, 188, 244] as const;

type Tone = 'cyan' | 'indigo';
type BoxProps = { x: number; y: number; width: number; height: number };

export default function GroundingDistillationDiagram() {
  return (
    <div className={styles.container}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}

function DesktopDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      viewBox="0 0 760 360"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <Frame
        width={760}
        height={360}
        title="GROUNDING AGENT → ROOT ORCHESTRATOR"
      />
      <GroundingBoundary x={24} y={48} width={320} height={256} />
      <DesktopFlows />
      {SOURCES.map((source, index) => (
        <Source key={source.label} {...source} x={40} width={172} />
      ))}
      <GroundingAgent x={238} y={132} width={86} height={88} />
      <RootContext x={398} y={82} width={178} facts={FACTS} />
      <RootAgent x={672} y={172} />
      <FallbackNote x={400} y={296} />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 0 340 760"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <Frame width={340} height={760} title="GROUNDING → ROOT" />
      <GroundingBoundary x={24} y={48} width={292} height={310} />
      <MobileFlows />
      {SOURCES.map((source, index) => (
        <Source
          key={source.label}
          label={source.label}
          tone={source.tone}
          x={44}
          y={MOBILE_SOURCE_Y[index]}
          width={252}
        />
      ))}
      <GroundingAgent x={90} y={286} width={160} height={64} compact />
      <RootContext x={42} y={446} width={256} facts={FACTS} />
      <RootAgent x={170} y={700} compact />
      <FallbackNote x={54} y={386} />
    </svg>
  );
}

function Frame({
  width,
  height,
  title,
}: {
  width: number;
  height: number;
  title: string;
}) {
  return (
    <>
      <rect
        x={0.5}
        y={0.5}
        width={width - 1}
        height={height - 1}
        fill="var(--surface-page)"
        stroke="var(--border-subtle)"
        className={styles.vectorStroke}
      />
      <text
        x={24}
        y={26}
        fill="var(--text-muted)"
        className={styles.frameLabel}
      >
        {title}
      </text>
    </>
  );
}

function GroundingBoundary({ x, y, width, height }: BoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="var(--surface-muted)"
        stroke="var(--border-default)"
        className={styles.groundingBoundary}
      />
      <text
        x={x + 14}
        y={y + 22}
        fill="var(--text-muted)"
        className={styles.nodeEyebrow}
      >
        ISOLATED GROUNDING AGENT CONTEXT
      </text>
    </g>
  );
}

function Source({
  label,
  tone,
  x,
  y,
  width,
}: {
  label: string;
  tone: Tone;
  x: number;
  y: number;
  width: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={36}
        fill="var(--surface-raised)"
        stroke={`var(--visual-${tone})`}
        strokeWidth={1.25}
        className={styles.sourceRect}
      />
      <text
        x={x + 12}
        y={y + 23}
        fill="var(--text-heading)"
        className={styles.sourceLabel}
      >
        {label}
      </text>
    </g>
  );
}

function GroundingAgent({
  x,
  y,
  width,
  height,
  compact = false,
}: BoxProps & { compact?: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="var(--visual-bg-violet)"
        stroke="var(--visual-violet)"
        strokeWidth={1.5}
        className={styles.agentRect}
      />
      <WorkingAgentNode
        x={x + width / 2}
        y={compact ? y + 13 : y + 22}
        size={
          compact
            ? GROUNDING_AGENT_ICON_SIZE_COMPACT
            : GROUNDING_AGENT_ICON_SIZE
        }
      />
      <text
        x={x + width / 2}
        y={y + (compact ? 40 : height - 30)}
        textAnchor="middle"
        fill="var(--visual-violet)"
        className={styles.nodeEyebrow}
      >
        GROUNDING AGENT
      </text>
      <text
        x={x + width / 2}
        y={y + (compact ? 56 : height - 12)}
        textAnchor="middle"
        fill="var(--text-heading)"
        className={compact ? styles.agentTitleCompact : styles.nodeTitle}
      >
        Search + synthesize
      </text>
    </g>
  );
}

function RootContext({
  x,
  y,
  width,
  facts,
}: {
  x: number;
  y: number;
  width: number;
  facts: readonly string[];
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={172}
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth={1.5}
        className={styles.contextRect}
      />
      <text
        x={x + 14}
        y={y + 26}
        fill="var(--text-heading)"
        className={styles.nodeEyebrow}
      >
        ROOT ORCHESTRATOR CONTEXT
      </text>
      <text
        x={x + 14}
        y={y + 46}
        fill="var(--text-muted)"
        className={styles.noteText}
      >
        distilled facts only
      </text>
      {facts.map((fact, index) => (
        <FactChip
          key={fact}
          x={x + 14}
          y={y + 64 + index * 24}
          width={width - 28}
          label={fact}
        />
      ))}
    </g>
  );
}

function FactChip({
  x,
  y,
  width,
  label,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={18}
        fill="var(--surface-page)"
        stroke="var(--border-subtle)"
        className={styles.factRect}
      />
      <text
        x={x + 10}
        y={y + 13}
        fill="var(--text-body)"
        className={styles.factText}
      >
        {label}
      </text>
    </g>
  );
}

function RootAgent({
  x,
  y,
  compact = false,
}: {
  x: number;
  y: number;
  compact?: boolean;
}) {
  return (
    <g>
      <WorkingAgentNode
        x={x}
        y={y}
        size={compact ? ROOT_AGENT_ICON_SIZE_COMPACT : ROOT_AGENT_ICON_SIZE}
      />
      <text
        x={x}
        y={y + (compact ? 36 : 44)}
        textAnchor="middle"
        fill="var(--text-heading)"
        className={styles.nodeTitle}
      >
        Root agent
      </text>
      <text
        x={x}
        y={y + (compact ? 52 : 62)}
        textAnchor="middle"
        fill="var(--text-muted)"
        className={styles.noteText}
      >
        uses facts
      </text>
    </g>
  );
}

function DesktopFlows() {
  return (
    <g>
      {SOURCES.map((source, index) => (
        <DesktopSourceFlow
          key={source.label}
          y={source.tokenY}
          tone={source.tone}
          delay={index * 360}
        />
      ))}
      <FlowPath
        d="M 324 176 L 394 176"
        tokenPathD="M 342 176 L 394 176"
        tokens={FACT_TOKENS}
        startDelayMs={1880}
        tone="violet"
      />
      <FlowPath
        d="M 576 176 L 640 176"
        tokenPathD="M 594 176 L 640 176"
        tokens={FACT_TOKENS}
        startDelayMs={2600}
        tone="violet"
      />
    </g>
  );
}

function MobileFlows() {
  return (
    <g>
      {SOURCES.map((source, index) => (
        <MobileSourceFlow
          key={source.label}
          y={MOBILE_SOURCE_Y[index] + 28}
          tone={source.tone}
          delay={index * 360}
        />
      ))}
      <FlowPath
        d="M 170 350 L 170 442"
        tokenPathD="M 170 366 L 170 438"
        tokens={FACT_TOKENS}
        startDelayMs={1880}
        tone="violet"
      />
      <FlowPath
        d="M 170 618 L 170 672"
        tokenPathD="M 170 634 L 170 672"
        tokens={FACT_TOKENS}
        startDelayMs={2600}
        tone="violet"
      />
    </g>
  );
}

function FlowPath({
  d,
  tone,
  tokens,
  tokenPathD,
  startDelayMs,
}: {
  d: string;
  tone: Tone | 'violet';
  tokens: TokenSequence;
  tokenPathD?: string;
  startDelayMs: number;
}) {
  return (
    <TokenArrowTrain
      d={d}
      tokenPathD={tokenPathD}
      tokens={tokens}
      timing={{ ...TOKEN_TRAIN_TIMING, startDelayMs }}
      stagger={TOKEN_TRAIN_STAGGER}
      tone={tone}
      stroke={`var(--visual-${tone})`}
      size={FLOW_SIZE}
      pathClassName={styles.connector}
    />
  );
}

function DesktopSourceFlow({
  y,
  tone,
  delay,
}: {
  y: number;
  tone: Tone;
  delay: number;
}) {
  const travelY = 176 - y;
  return (
    <FlowPath
      d={`M 212 ${y} L 236 176`}
      tokenPathD={`M 226 ${y} L 236 176`}
      tokens={SOURCE_TOKENS}
      startDelayMs={delay}
      tone={tone}
    />
  );
}

function MobileSourceFlow({
  y,
  tone,
  delay,
}: {
  y: number;
  tone: Tone;
  delay: number;
}) {
  return (
    <FlowPath
      d={`M 296 ${y} L 306 ${y} L 306 286 L 252 286`}
      tokens={SOURCE_TOKENS}
      startDelayMs={delay}
      tone={tone}
    />
  );
}

function FallbackNote({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y} fill="var(--text-muted)" className={styles.noteText}>
      research artifact → fresh context
    </text>
  );
}
