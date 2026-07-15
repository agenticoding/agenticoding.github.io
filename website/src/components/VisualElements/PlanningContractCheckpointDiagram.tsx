import React from 'react';
import { EmojiImage } from './ActorNodes';
import { AgentTile, agentIconSize } from './AgentTile';
import { DiagramArrow, DiagramArrowMarkers } from './DiagramArrow';
import { DiagramTile, DiagramTileSurface } from './DiagramTile';
import { EMOJI } from './emojiAssets';
import type { EmojiAsset } from './emojiAssets';
import { TokenArrowTrain } from './TokenArrowTrain';
import type { TokenSequence } from './AnimatedTokenFlow';
import type { TokenTrainTiming } from './TokenTrainTiming';
import type { WorkingAgentActivation } from './WorkingAgentNode';
import styles from './PlanningContractCheckpointDiagram.module.css';

const ARIA_LABEL =
  'Planning contract checkpoint diagram: grounded facts assemble a draft execution contract. Human review either returns it for revision or approves the only path that enables agent execution.';

const FACTS = ['architecture', 'constraints', 'tests'] as const;
const PLAN_ROWS = [
  { icon: EMOJI.compass, label: 'scope + boundaries' },
  { icon: EMOJI.tools, label: 'one coherent unit' },
  { icon: EMOJI.check, label: 'verification + tests' },
] as const;
const FACT_TOKENS = [
  { modality: 'text', signal: 'ordinary' },
  { modality: 'code', signal: 'salient' },
] as const satisfies TokenSequence;
const DRAFT_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'generic', signal: 'salient' },
] as const satisfies TokenSequence;
const APPROVED_TOKENS = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'generic', signal: 'salient' },
  { modality: 'code', signal: 'ordinary' },
] as const satisfies TokenSequence;
const CYCLE_MS = 7200;
const FLOW_TRAVEL_MS = 1080;
const REVIEW_START_MS = 1500;
const REVIEW_READ_MS = 2700;
const APPROVAL_START_MS = 4200;
// Execution begins as soon as its approval input begins moving.
const EXECUTION_ACTIVATION = {
  activeMs: CYCLE_MS - APPROVAL_START_MS,
  cycleMs: CYCLE_MS,
  delayMs: APPROVAL_START_MS,
  turnScale: 0.4,
} as const satisfies WorkingAgentActivation;
const FLOW_STAGGER = { mode: 'pathSpacing', spacingPx: 24 } as const;

type Point = { x: number; y: number };
type Box = Point & { width: number; height: number };
type FlowTone = 'indigo' | 'warning' | 'success';

export default function PlanningContractCheckpointDiagram() {
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
      <DiagramArrowMarkers
        prefix="planning-contract-desktop"
        tones={['warning']}
      />
      <Flow
        d="M 180 188 L 212 188"
        tokens={FACT_TOKENS}
        stroke="var(--visual-indigo)"
        tone="indigo"
        startDelayMs={0}
      />
      <Flow
        d="M 412 188 L 456 188"
        tokens={DRAFT_TOKENS}
        stroke="var(--visual-warning)"
        tone="warning"
        startDelayMs={REVIEW_START_MS}
      />
      <Flow
        d="M 576 188 L 632 188"
        tokens={APPROVED_TOKENS}
        stroke="var(--visual-success)"
        tone="success"
        startDelayMs={APPROVAL_START_MS}
        label="approve"
        labelX={584}
        labelY={176}
        laneOrientation="below"
      />
      <DiagramArrow
        d="M 516 244 V 284 H 312 V 268"
        markerIdPrefix="planning-contract-desktop"
        tone="warning"
        label="revise"
        labelX={404}
        labelY={298}
        labelClassName={styles.flowLabel}
        className={styles.revisionFlow}
      />
      <FactsBlock x={48} y={136} width={132} height={104} />
      <ContractCard x={212} y={108} width={200} height={160} />
      <ReviewGate x={456} y={132} width={120} height={112} />
      <ExecutionAgentTile x={632} y={124} width={112} height={128} />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 0 340 764"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <DiagramArrowMarkers
        prefix="planning-contract-mobile"
        tones={['warning']}
      />
      <Flow
        d="M 170 150 L 170 192"
        tokens={FACT_TOKENS}
        stroke="var(--visual-indigo)"
        tone="indigo"
        startDelayMs={0}
        laneOrientation="below"
      />
      <Flow
        d="M 170 344 L 170 401"
        tokens={DRAFT_TOKENS}
        stroke="var(--visual-warning)"
        tone="warning"
        startDelayMs={REVIEW_START_MS}
        laneOrientation="below"
      />
      <Flow
        d="M 170 513 L 170 558"
        tokens={APPROVED_TOKENS}
        stroke="var(--visual-success)"
        tone="success"
        startDelayMs={APPROVAL_START_MS}
        label="approve"
        labelX={184}
        labelY={544}
        laneOrientation="above"
      />
      <DiagramArrow
        d="M 70 457 H 24 V 272 H 50"
        markerIdPrefix="planning-contract-mobile"
        tone="warning"
        label="revise"
        labelX={32}
        labelY={360}
        labelClassName={styles.flowLabel}
        className={styles.revisionFlow}
      />
      <FactsBlock x={70} y={56} width={200} height={94} compact />
      <ContractCard x={50} y={192} width={240} height={152} compact />
      <ReviewGate x={70} y={401} width={200} height={112} compact />
      <ExecutionAgentTile x={100} y={558} width={140} height={128} compact />
    </svg>
  );
}

function Flow(props: {
  d: string;
  tokens: TokenSequence;
  stroke: string;
  tone: FlowTone;
  startDelayMs: number;
  laneOrientation?: 'above' | 'below';
  label?: string;
  labelX?: number;
  labelY?: number;
}) {
  return (
    <TokenArrowTrain
      d={props.d}
      tokens={props.tokens}
      stroke={props.stroke}
      tone={props.tone}
      timing={flowTiming(props.startDelayMs)}
      stagger={FLOW_STAGGER}
      laneOrientation={props.laneOrientation ?? 'above'}
      label={props.label}
      labelX={props.labelX}
      labelY={props.labelY}
      labelClassName={styles.flowLabel}
      className={styles.flowTrain}
      pathClassName={styles.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

function flowTiming(startDelayMs: number): TokenTrainTiming {
  return {
    cycleMs: CYCLE_MS,
    travelMs: FLOW_TRAVEL_MS,
    fadeMs: 160,
    repeat: 'loop',
    startDelayMs,
  };
}

function FactsBlock(props: Box & { compact?: boolean }) {
  const rowGap = props.compact ? 16 : 24;
  return (
    <g>
      <DiagramTileSurface
        {...props}
        tone="indigo"
        weight={1.5}
        className={styles.vectorStroke}
      />
      <text
        x={props.x + 16}
        y={props.y + 24}
        fill="var(--visual-indigo)"
        className={styles.nodeEyebrow}
      >
        GROUNDED FACTS
      </text>
      {FACTS.map((fact, index) => (
        <DiagramListRow
          key={fact}
          x={props.x + 18}
          y={props.y + 48 + index * rowGap}
          label={fact}
          tone="var(--visual-indigo)"
        />
      ))}
    </g>
  );
}

function DiagramListRow({
  x,
  y,
  label,
  tone,
  icon,
}: Point & { label: string; tone: string; icon?: EmojiAsset }) {
  return (
    <g>
      {icon ? (
        <EmojiImage asset={icon} x={x} y={y - 16} size={16} />
      ) : (
        <rect x={x} y={y - 8} width={8} height={8} fill={tone} />
      )}
      <text
        x={x + (icon ? 24 : 16)}
        y={y}
        fill="var(--text-body)"
        className={styles.cardText}
      >
        {label}
      </text>
    </g>
  );
}

function ContractCard(props: Box & { compact?: boolean }) {
  return (
    <g>
      <DiagramTileSurface
        {...props}
        tone="neutral"
        weight={1.5}
        className={styles.vectorStroke}
      />
      <ContractHeader x={props.x} y={props.y} width={props.width} />
      <PlanSummary x={props.x + 18} y={props.y + (props.compact ? 72 : 80)} />
    </g>
  );
}

function ContractHeader({ x, y, width }: Point & { width: number }) {
  return (
    <>
      <text
        x={x + 18}
        y={y + 28}
        fill="var(--text-heading)"
        className={styles.cardTitle}
      >
        PLAN
      </text>
      <EmojiImage
        asset={EMOJI.documentTabs}
        x={x + width - 124}
        y={y + 10}
        size={24}
      />
      <StatusBadge x={x + width - 70} y={y + 12} label="DRAFT" tone="warning" />
      <text
        x={x + 18}
        y={y + 48}
        fill="var(--text-muted)"
        className={styles.contractSubtitle}
      >
        proposed execution contract
      </text>
      <line
        x1={x + 18}
        y1={y + 60}
        x2={x + width - 18}
        y2={y + 60}
        stroke="var(--border-subtle)"
        className={styles.vectorStroke}
      />
    </>
  );
}

function StatusBadge({
  x,
  y,
  label,
  tone,
}: Point & { label: string; tone: 'warning' }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={52}
        height={18}
        rx={0}
        fill={`var(--visual-bg-${tone})`}
        stroke={`var(--visual-${tone})`}
        className={styles.vectorStroke}
      />
      <text
        x={x + 26}
        y={y + 13}
        textAnchor="middle"
        fill={`var(--visual-${tone})`}
        className={styles.badgeText}
      >
        {label}
      </text>
    </g>
  );
}

function PlanSummary({ x, y }: Point) {
  return (
    <g>
      {PLAN_ROWS.map((row, index) => (
        <DiagramListRow
          key={row.label}
          x={x}
          y={y + index * 24}
          icon={row.icon}
          label={row.label}
          tone="var(--text-body)"
        />
      ))}
    </g>
  );
}

function ReviewGate(props: Box & { compact?: boolean }) {
  return (
    <DiagramTile
      {...props}
      tone="warning"
      icon={EMOJI.operator}
      eyebrow={props.compact ? 'HUMAN DECISION' : 'HUMAN'}
      title="review"
      detail={['approve', 'revise']}
      detailGap={15}
      titleVoice="human"
      variant="rich"
      fill="var(--surface-raised)"
      weight={2}
      rectClassName={`${styles.vectorStroke} idle-status-pulse ${styles.reviewSurface}`}
      iconClassName={`idle-eye-read ${styles.reviewOperator}`}
      style={
        {
          '--review-start': `${REVIEW_START_MS}ms`,
          '--review-read': `${REVIEW_READ_MS}ms`,
        } as React.CSSProperties
      }
      density={props.compact ? 'mobile' : 'desktop'}
    />
  );
}

function ExecutionAgentTile(props: Box & { compact?: boolean }) {
  return (
    <AgentTile
      {...props}
      tone="success"
      title="Agent"
      eyebrow="EXECUTION ENABLED"
      detail="after approval"
      gearActivation={EXECUTION_ACTIVATION}
      iconSize={agentIconSize(props.compact)}
      rectClassName={styles.vectorStroke}
    />
  );
}
