import React from 'react';
import clsx from 'clsx';
import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { AnimatedTokenFlow, tokenFlowSpecs } from './AnimatedTokenFlow';
import { DiagramTile } from './DiagramTile';
import styles from './InteractiveHarnessWorkbench.module.css';

const ARIA_LABEL = 'Interactive harness flow inside one root harness context: the human sets generic guardrails, the LLM chooses most tool-loop turns, use-case tools execute, and the human reviews or redirects the result.';

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

const COLORS: Record<Tone, { accent: string; border: string; fill: string; label: string; title: string }> = {
  model: { accent: 'var(--visual-violet)', border: 'var(--visual-violet)', fill: 'var(--surface-raised)', label: 'var(--visual-violet)', title: 'var(--text-heading)' },
  system: { accent: 'var(--visual-cyan)', border: 'var(--visual-cyan)', fill: 'var(--surface-raised)', label: 'var(--visual-cyan)', title: 'var(--text-heading)' },
  warning: { accent: 'var(--visual-warning)', border: 'var(--visual-warning)', fill: 'var(--surface-raised)', label: 'var(--visual-warning)', title: 'var(--text-heading)' },
  neutral: { accent: 'var(--text-muted)', border: 'var(--border-default)', fill: 'var(--surface-raised)', label: 'var(--text-muted)', title: 'var(--text-heading)' },
};

const TOOLS = [
  { label: 'bash', icon: EMOJI.magnify },
  { label: 'LSP', icon: EMOJI.documentTabs },
  { label: 'FX', icon: EMOJI.check },
] as const;

const CONTEXT_TOKEN_SEQUENCE = [
  { modality: 'text', signal: 'salient' },
  { modality: 'code', signal: 'compressed' },
  { modality: 'generic' },
] as const;

const LOOP_CONTEXT_TOKEN_SEQUENCE = [
  { modality: 'text', signal: 'compressed' },
  { modality: 'generic' },
  { modality: 'code', signal: 'compressed' },
  { modality: 'text' },
  { modality: 'generic', signal: 'salient' },
  { modality: 'code' },
  { modality: 'text', signal: 'compressed' },
  { modality: 'generic' },
  { modality: 'text' },
] as const;

const ACTION_TOKEN_SEQUENCE = [
  { modality: 'code', signal: 'salient' },
  { modality: 'generic' },
  { modality: 'text', signal: 'compressed' },
] as const;

const HARNESS_FLOW_DURATION_MS = 11200;
const LOOP_STARTS = [1800, 4300, 6800] as const;
const RETURN_STARTS = [2700, 5200, 7700] as const;

function repeatedTokenFlows(tokens: Parameters<typeof tokenFlowSpecs>[0], starts: readonly number[], stepMs: number) {
  return starts.flatMap((start) => tokenFlowSpecs(tokens, start, stepMs));
}

const SCOPE_TO_CHOOSE_TOKENS = tokenFlowSpecs(CONTEXT_TOKEN_SEQUENCE, 200, 520);
const LLM_TO_TOOLS_TOKENS = repeatedTokenFlows(ACTION_TOKEN_SEQUENCE, LOOP_STARTS, 150);
const TOOLS_TO_LLM_TOKENS = repeatedTokenFlows(LOOP_CONTEXT_TOKEN_SEQUENCE, RETURN_STARTS, 110);
const FINAL_GATE_TOKENS = tokenFlowSpecs(ACTION_TOKEN_SEQUENCE, 10200, 150);

function color(tone: Tone) {
  return COLORS[tone];
}

function Flow({ step, children }: { step: FlowStep; children: React.ReactNode }) {
  return <g className={clsx(styles.flowPulse, styles[`step${step}`])}>{children}</g>;
}

function Markers() {
  return <defs>{(Object.keys(COLORS) as Tone[]).map((tone) => <Marker key={tone} tone={tone} />)}</defs>;
}

function Marker({ tone }: { tone: Tone }) {
  return (
    <marker id={`ih-${tone}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <polygon points="0 0, 6 3, 0 6" fill={color(tone).accent} />
    </marker>
  );
}

function Card({ x, y, width, height, tone, icon, eyebrow, title, detail, voice, step, weight = 1 }: CardProps) {
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
      className={clsx(styles.flowPulse, styles[`step${step}`])}
      rectClassName={styles.vectorStroke}
      density={height < 108 ? 'mobile' : 'desktop'}
    />
  );
}

function Arrow({ d, tone, step, label, labelX, labelY }: { d: string; tone: Tone; step: FlowStep; label?: string; labelX?: number; labelY?: number }) {
  const c = color(tone);
  return (
    <Flow step={step}>
      <path d={d} fill="none" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" markerEnd={`url(#ih-${tone})`} className={styles.vectorStroke} />
      {label && <text x={labelX} y={labelY} className={styles.loopLabel} fill={c.label}>{label}</text>}
    </Flow>
  );
}

function StageLabel({ x, y, id, label }: { x: number; y: number; id: string; label: string }) {
  return (
    <g>
      <text x={x} y={y} className={styles.stageId} fill="var(--text-muted)">{id}</text>
      <text x={x + 24} y={y} className={styles.stageText} fill="var(--text-muted)">{label}</text>
    </g>
  );
}

function ToolSurface({ x, y, width, step, mobile = false }: { x: number; y: number; width: number; step: FlowStep; mobile?: boolean }) {
  const gap = mobile ? 8 : 10;
  const chipW = (width - 32 - gap * 2) / 3;
  return (
    <Flow step={step}>
      <rect x={x} y={y} width={width} height="104" rx={0} ry={0} fill="var(--surface-raised)" stroke="var(--visual-cyan)" strokeWidth="1.5" strokeDasharray="4 4" className={styles.vectorStroke} />
      <text x={x + 16} y={y + 25} className={styles.eyebrow} fill="var(--visual-cyan)">USE-CASE TOOLS</text>
      {TOOLS.map((tool, i) => <ToolChip key={tool.label} x={x + 16 + i * (chipW + gap)} y={y + 44} width={chipW} {...tool} />)}
      <text x={x + 16} y={y + 88} className={styles.detail} fill="var(--text-muted)">{mobile ? 'tools fit product domain' : 'product-specific APIs'}</text>
    </Flow>
  );
}

function ToolChip({ x, y, width, label, icon }: { x: number; y: number; width: number; label: string; icon: EmojiAsset }) {
  const isShell = label === 'bash';
  return (
    <g>
      <rect x={x} y={y} width={width} height="28" rx={0} ry={0} fill="var(--surface-page)" stroke="var(--visual-cyan)" className={styles.vectorStroke} />
      {isShell ? <text x={x + 10} y={y + 18} className={styles.chipPrompt} fill="var(--visual-cyan)">&gt;</text> : <EmojiImage asset={icon} x={x + 8} y={y + 6} size={14} />}
      <text x={x + (isShell ? 25 : 31)} y={y + 18} className={styles.chipText} fill="var(--visual-cyan)">{label}</text>
    </g>
  );
}

function DesktopTokenStreams() {
  return (
    <g>
      <AnimatedTokenFlow x={226} y={140} tokens={SCOPE_TO_CHOOSE_TOKENS} variant="input" size={12} travelX={56} durationMs={HARNESS_FLOW_DURATION_MS} />
      <AnimatedTokenFlow x={382} y={220} tokens={LLM_TO_TOOLS_TOKENS} variant="burstVerticalInput" size={12} travelY={32} durationMs={HARNESS_FLOW_DURATION_MS} />
      <AnimatedTokenFlow x={428} y={242} tokens={TOOLS_TO_LLM_TOKENS} variant="burstVerticalOutput" size={10} tone="cyan" travelY={-24} durationMs={HARNESS_FLOW_DURATION_MS} />
      <AnimatedTokenFlow x={482} y={140} tokens={FINAL_GATE_TOKENS} variant="burstOutput" size={12} tone="warning" travelX={48} durationMs={HARNESS_FLOW_DURATION_MS} />
    </g>
  );
}

function MobileTokenStreams() {
  return (
    <g>
      <AnimatedTokenFlow x={176} y={188} tokens={SCOPE_TO_CHOOSE_TOKENS} variant="verticalInput" size={10} travelY={18} durationMs={HARNESS_FLOW_DURATION_MS} />
      <AnimatedTokenFlow x={154} y={322} tokens={LLM_TO_TOOLS_TOKENS} variant="burstVerticalInput" size={10} travelY={24} durationMs={HARNESS_FLOW_DURATION_MS} />
      <AnimatedTokenFlow x={200} y={344} tokens={TOOLS_TO_LLM_TOKENS} variant="burstVerticalOutput" size={7} tone="cyan" travelY={-24} durationMs={HARNESS_FLOW_DURATION_MS} />
      <AnimatedTokenFlow x={312} y={278} tokens={FINAL_GATE_TOKENS} variant="burstVerticalOutput" size={10} tone="warning" travelY={270} durationMs={HARNESS_FLOW_DURATION_MS} />
    </g>
  );
}

function ReviewGate({ x, y, width, height, step }: { x: number; y: number; width: number; height: number; step: FlowStep }) {
  return (
    <Card x={x} y={y} width={width} height={height} tone="warning" icon={EMOJI.question} eyebrow="APPROVAL GATE" title="proceed?" detail="allow · reject · revise" voice="spec" step={step} weight={2} />
  );
}

function DesktopDiagram() {
  return (
    <svg viewBox="0 0 760 432" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.desktopDiagram)}>
      <Markers />
      <rect x="24" y="24" width="712" height="384" rx={0} ry={0} fill="none" stroke="var(--border-subtle)" className={styles.vectorStroke} />
      <DesktopLabels />
      <DesktopConnectors />
      <DesktopNodes />
      <DesktopTokenStreams />
    </svg>
  );
}

function DesktopLabels() {
  return (
    <g>
      <text x="44" y="48" className={styles.frameLabel} fill="var(--visual-cyan)">ROOT HARNESS CONTEXT</text>
      <text x="44" y="392" className={styles.contextNote} fill="var(--text-muted)">one root orchestrator context</text>
      <StageLabel x={52} y={84} id="01" label="scope" />
      <StageLabel x={296} y={84} id="02" label="choose" />
      <StageLabel x={312} y={248} id="03" label="act" />
      <StageLabel x={546} y={84} id="04" label="gate" />
    </g>
  );
}

function DesktopNodes() {
  return (
    <g>
      <Card x={48} y={104} width={184} height={112} tone="neutral" icon={EMOJI.operator} eyebrow="HUMAN CONTROL" title="scope" detail="intent · limits" voice="human" step={1} weight={1.5} />
      <Card x={288} y={104} width={200} height={112} tone="model" icon={EMOJI.agent} eyebrow="MODEL FREEDOM" title="LLM chooser" detail="chooses loop turns" voice="ai" step={2} weight={1.5} />
      <ToolSurface x={284} y={260} width={220} step={3} />
      <ReviewGate x={536} y={104} width={184} height={112} step={4} />
    </g>
  );
}

function DesktopConnectors() {
  return (
    <g>
      <Arrow d="M 232 160 H 288" tone="model" step={2} />
      <Arrow d="M 372 216 V 260" tone="model" step={3} />
      <Arrow d="M 420 260 V 216" tone="system" step={5} label="LLM selects most next steps" labelX={92} labelY={300} />
      <Arrow d="M 488 160 H 536" tone="warning" step={4} label="human approves or redirects" labelX={536} labelY={300} />
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg viewBox="0 0 340 704" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.mobileDiagram)}>
      <Markers />
      <rect x="18" y="20" width="304" height="664" rx={0} ry={0} fill="none" stroke="var(--border-subtle)" className={styles.vectorStroke} />
      <MobileLabels />
      <MobileConnectors />
      <MobileNodes />
      <MobileTokenStreams />
    </svg>
  );
}

function MobileLabels() {
  return (
    <g>
      <text x="170" y="40" textAnchor="middle" className={styles.frameLabel} fill="var(--visual-cyan)">ROOT HARNESS CONTEXT</text>
      <text x="170" y="664" textAnchor="middle" className={styles.contextNote} fill="var(--text-muted)">one root orchestrator context</text>
      <StageLabel x={52} y={72} id="01" label="scope" />
      <StageLabel x={52} y={206} id="02" label="choose" />
      <StageLabel x={52} y={340} id="03" label="act" />
      <StageLabel x={52} y={496} id="04" label="gate" />
    </g>
  );
}

function MobileNodes() {
  return (
    <g>
      <Card x={52} y={84} width={236} height={100} tone="neutral" icon={EMOJI.operator} eyebrow="HUMAN CONTROL" title="scope" detail="intent · limits" voice="human" step={1} weight={1.5} />
      <Card x={52} y={218} width={236} height={100} tone="model" icon={EMOJI.agent} eyebrow="MODEL FREEDOM" title="LLM chooser" detail="chooses loop turns" voice="ai" step={2} weight={1.5} />
      <ToolSurface x={52} y={352} width={236} step={3} mobile />
      <ReviewGate x={52} y={508} width={236} height={100} step={4} />
    </g>
  );
}

function MobileConnectors() {
  return (
    <g>
      <Arrow d="M 170 184 V 210" tone="model" step={2} />
      <Arrow d="M 148 318 V 352" tone="model" step={3} />
      <Arrow d="M 192 352 V 318" tone="system" step={5} />
      <Arrow d="M 288 268 H 306 V 558 H 288" tone="warning" step={4} label="human approves or redirects" labelX={94} labelY={482} />
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
