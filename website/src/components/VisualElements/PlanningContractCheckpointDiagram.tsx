import React from 'react';
import { EmojiImage, OperatorNode } from './ActorNodes';
import { AgentTile } from './AgentTile';
import { DiagramTileSurface } from './DiagramTile';
import { EMOJI } from './emojiAssets';
import { TokenArrowTrain } from './TokenArrowTrain';
import type { TokenSequence } from './AnimatedTokenFlow';
import type { TokenTrainTiming } from './TokenTrainTiming';
import styles from './PlanningContractCheckpointDiagram.module.css';

const ARIA_LABEL =
  'Planning contract checkpoint diagram: grounded facts assemble a draft execution contract. The draft waits at a human review gate, approval converts it into an approved contract, and only then is agent execution enabled.';

const FACTS = ['architecture', 'constraints', 'tests'] as const;
const PLAN_ROWS = ['scope', 'boundaries', 'checks'] as const;
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
    <svg className={`${styles.diagram} ${styles.desktopDiagram}`} viewBox="0 0 760 360" role="img" aria-label={ARIA_LABEL}>
      <Flow d="M 180 188 L 212 188" tokens={FACT_TOKENS} stroke="var(--visual-indigo)" tone="indigo" startDelayMs={0} />
      <Flow d="M 452 188 L 480 188" tokens={DRAFT_TOKENS} stroke="var(--visual-warning)" tone="warning" startDelayMs={1500} />
      <Flow d="M 600 188 L 624 188" tokens={APPROVED_TOKENS} stroke="var(--visual-success)" tone="success" startDelayMs={4200} />
      <FactsBlock x={48} y={136} width={132} height={104} />
      <ContractCard x={212} y={96} width={240} height={204} />
      <ReviewGate x={480} y={136} width={120} height={108} />
      <ExecutionAgentTile x={624} y={136} width={112} height={104} />
    </svg>
  );
}

function MobileDiagram() {
  return (
    <svg className={`${styles.diagram} ${styles.mobileDiagram}`} viewBox="0 0 340 764" role="img" aria-label={ARIA_LABEL}>
      <Flow d="M 170 150 L 170 178" tokens={FACT_TOKENS} stroke="var(--visual-indigo)" tone="indigo" startDelayMs={0} laneOrientation="below" />
      <Flow d="M 170 456 L 170 494" tokens={DRAFT_TOKENS} stroke="var(--visual-warning)" tone="warning" startDelayMs={1500} laneOrientation="below" />
      <Flow d="M 170 588 L 170 634" tokens={APPROVED_TOKENS} stroke="var(--visual-success)" tone="success" startDelayMs={4200} laneOrientation="below" />
      <FactsBlock x={70} y={56} width={200} height={94} compact />
      <ContractCard x={50} y={224} width={240} height={232} compact />
      <ReviewGate x={70} y={494} width={200} height={94} compact />
      <ExecutionAgentTile x={100} y={634} width={140} height={104} compact />
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
      className={styles.flowTrain}
      pathClassName={styles.connector}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

function flowTiming(startDelayMs: number): TokenTrainTiming {
  return { cycleMs: CYCLE_MS, travelMs: 1080, fadeMs: 160, repeat: 'loop', startDelayMs };
}

function FactsBlock(props: Box & { compact?: boolean }) {
  const rowGap = props.compact ? 18 : 22;
  return (
    <g className={styles.factBeat}>
      <rect {...props} rx={0} fill="var(--surface-raised)" stroke="var(--visual-indigo)" strokeWidth={1.5} className={styles.vectorStroke} />
      <text x={props.x + 16} y={props.y + 24} fill="var(--visual-indigo)" className={styles.nodeEyebrow}>GROUNDED FACTS</text>
      {FACTS.map((fact, index) => <FactRow key={fact} x={props.x + 18} y={props.y + 48 + index * rowGap} label={fact} />)}
    </g>
  );
}

function FactRow({ x, y, label }: Point & { label: string }) {
  return (
    <g>
      <rect x={x} y={y - 8} width={8} height={8} rx={0} fill="var(--visual-indigo)" />
      <text x={x + 16} y={y} fill="var(--text-body)" className={styles.cardText}>{label}</text>
    </g>
  );
}

function ContractCard(props: Box & { compact?: boolean }) {
  return (
    <g className={styles.contractWait}>
      <rect {...props} rx={0} fill="var(--surface-raised)" stroke="var(--border-default)" strokeWidth={1.5} className={styles.vectorStroke} />
      <StatusBadge x={props.x + props.width - 70} y={props.y + 16} label="DRAFT" tone="warning" />
      <ContractHeader x={props.x} y={props.y} width={props.width} />
      <PlanSummary x={props.x + 18} y={props.y + 96} width={props.width - 36} compact={props.compact} />
      <WaitingStrip x={props.x} y={props.y + props.height - 34} width={props.width} compact={props.compact} />
    </g>
  );
}

function StatusBadge({ x, y, label, tone }: Point & { label: string; tone: 'warning' | 'success' }) {
  return (
    <g>
      <rect x={x} y={y} width={52} height={18} rx={0} fill={`var(--visual-bg-${tone})`} stroke={`var(--visual-${tone})`} className={styles.vectorStroke} />
      <text x={x + 26} y={y + 13} textAnchor="middle" fill={`var(--visual-${tone})`} className={styles.badgeText}>{label}</text>
    </g>
  );
}

function ContractHeader({ x, y, width }: Point & { width: number }) {
  return (
    <>
      <EmojiImage asset={EMOJI.documentTabs} x={x + width - 102} y={y + 30} size={24} className={styles.contractIcon} />
      <text x={x + 18} y={y + 30} fill="var(--text-heading)" className={styles.cardTitle}>Plan</text>
      <text x={x + 18} y={y + 48} fill="var(--text-muted)" className={styles.cardText}>execution contract</text>
      <line x1={x + 18} y1={y + 64} x2={x + width - 18} y2={y + 64} stroke="var(--border-subtle)" className={styles.vectorStroke} />
    </>
  );
}

function PlanSummary({ x, y, width }: Point & { width: number; compact?: boolean }) {
  return (
    <g>
      {PLAN_ROWS.map((label, index) => <PlanRow key={label} x={x} y={y + index * 28} width={width} label={label} />)}
    </g>
  );
}

function PlanRow({ x, y, width, label }: Point & { width: number; label: string }) {
  const labelWidth = 76;
  const ruleY = y - 5;
  return (
    <g>
      <text x={x} y={y} fill="var(--text-muted)" className={styles.nodeEyebrow}>{label.toUpperCase()}</text>
      <line x1={x + labelWidth} y1={ruleY} x2={x + width} y2={ruleY} stroke="var(--border-subtle)" className={styles.vectorStroke} />
    </g>
  );
}

function WaitingStrip({ x, y, width, compact }: Point & { width: number; compact?: boolean }) {
  const label = compact ? 'HUMAN REVIEW REQUIRED' : 'WAITING FOR HUMAN REVIEW';
  return (
    <g className={styles.waitingStrip}>
      <rect x={x} y={y} width={width} height={34} rx={0} fill="var(--visual-bg-warning)" />
      <OperatorNode x={x + 18} y={y + 8} size={18} />
      <text x={x + 42} y={y + 22} fill="var(--visual-warning)" className={styles.badgeText}>{label}</text>
    </g>
  );
}

function ReviewGate(props: Box & { compact?: boolean }) {
  const layout = reviewGateLayout(props);
  return (
    <g className={styles.approvalBeat}>
      <DiagramTileSurface
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        tone="warning"
        fill="var(--surface-raised)"
        weight={2}
        className={styles.gateTileRect}
      />
      <text x={layout.textX} y={props.y + 22} fill="var(--visual-warning)" className={styles.gateEyebrow}>{props.compact ? 'HUMAN REVIEW' : 'HUMAN'}</text>
      <OperatorNode x={layout.iconX} y={layout.iconY} size={layout.iconSize} />
      <text x={layout.textX} y={layout.titleY} fill="var(--text-heading)" className={styles.gateTitle}>review</text>
      <line x1={layout.textX} y1={layout.ruleY} x2={props.x + props.width - 16} y2={layout.ruleY} stroke="var(--visual-warning)" opacity={0.45} className={styles.vectorStroke} />
      <text x={layout.textX} y={layout.detailY} fill="var(--text-muted)" className={styles.gateDetail}>approve</text>
      <text x={layout.textX} y={layout.detailY + 13} fill="var(--text-muted)" className={styles.gateDetail}>revise</text>
    </g>
  );
}

function reviewGateLayout(props: Box & { compact?: boolean }) {
  return {
    iconX: props.x + (props.compact ? 20 : 18),
    iconY: props.y + (props.compact ? 43 : 46),
    iconSize: props.compact ? 30 : 32,
    textX: props.x + (props.compact ? 66 : 56),
    titleY: props.y + (props.compact ? 44 : 48),
    ruleY: props.y + (props.compact ? 54 : 58),
    detailY: props.y + (props.compact ? 70 : 74),
  };
}

function ExecutionAgentTile(props: Box & { compact?: boolean }) {
  return (
    <AgentTile
      {...props}
      className={styles.executionEnabled}
      tone="success"
      title="Agent"
      eyebrow="EXECUTION ENABLED"
      detail="after approval"
      gearActivation={{ delayMs: 4700, durationMs: 900 }}
      iconSize={28}
      rectClassName={styles.vectorStroke}
      textClasses={{
        eyebrow: styles.agentEyebrow,
        title: styles.agentTitle,
        detail: styles.agentDetail,
      }}
    />
  );
}
