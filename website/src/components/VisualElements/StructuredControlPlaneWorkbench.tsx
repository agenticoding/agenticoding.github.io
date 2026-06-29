import React from 'react';
import clsx from 'clsx';
import { EmojiImage } from './ActorNodes';
import { AnimatedTokenFlow, tokenFlowSpecs } from './AnimatedTokenFlow';
import { DiagramTile } from './DiagramTile';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import type { DiagramTone, DiagramVoice } from './diagramTileLayout';
import styles from './StructuredControlPlaneWorkbench.module.css';

const ARIA_LABEL = 'Structured control-plane pipeline: a trigger enters a code-owned orchestrator, deterministic workflow steps do most of the work, three small bounded LLM calls happen at specific junctions, and code validates the result before commit.';

type Tone = Extract<DiagramTone, 'model' | 'system' | 'warning' | 'success' | 'neutral'>;
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
  voice: DiagramVoice;
  step: FlowStep;
  weight?: number;
};

const COLORS: Record<Tone, { accent: string; label: string }> = {
  model: { accent: 'var(--visual-violet)', label: 'var(--visual-violet)' },
  system: { accent: 'var(--visual-cyan)', label: 'var(--visual-cyan)' },
  warning: { accent: 'var(--visual-warning)', label: 'var(--visual-warning)' },
  success: { accent: 'var(--visual-success)', label: 'var(--visual-success)' },
  neutral: { accent: 'var(--text-muted)', label: 'var(--text-muted)' },
};

const WORKFLOW_STEPS = ['collect', 'rank', 'classify', 'draft', 'verify'] as const;
const DESKTOP_STEP_X = 293;
const DESKTOP_STEP_Y = 310;
const DESKTOP_STEP_GAP = 72;
const MOBILE_STEP_X = 76;
const MOBILE_STEP_Y = 370;
const MOBILE_STEP_GAP = 44;
const LLM_CALLS = [
  { stepIndex: 2, label: 'classify', context: 'intent' },
  { stepIndex: 3, label: 'write', context: 'answer' },
  { stepIndex: 4, label: 'check', context: 'citations' },
] as const;

const TOKEN_PAIR = [{ modality: 'text', signal: 'salient' }, { modality: 'generic' }] as const;
const CODE_PAIR = [{ modality: 'code', signal: 'salient' }, { modality: 'generic' }] as const;
const FLOW_DURATION_MS = 9200;
const STEP_GAP_MS = 820;
const STREAM_STEP_MS = 140;

function tokensAt(startDelayMs: number) {
  return tokenFlowSpecs(TOKEN_PAIR, startDelayMs, STREAM_STEP_MS);
}

function codeTokensAt(startDelayMs: number) {
  return tokenFlowSpecs(CODE_PAIR, startDelayMs, STREAM_STEP_MS);
}

function color(tone: Tone) {
  return COLORS[tone];
}

function desktopCallX(stepIndex: number) {
  return DESKTOP_STEP_X + stepIndex * DESKTOP_STEP_GAP + 2;
}

function desktopCallCenterX(stepIndex: number) {
  return desktopCallX(stepIndex) + 29;
}

function mobileCallY(stepIndex: number) {
  return MOBILE_STEP_Y + stepIndex * MOBILE_STEP_GAP - 44;
}

function mobileCallCenterY(stepIndex: number) {
  return mobileCallY(stepIndex) + 58;
}

function Flow({ step, children }: { step: FlowStep; children: React.ReactNode }) {
  return <g className={clsx(styles.flowPulse, styles[`step${step}`])}>{children}</g>;
}

function Markers() {
  return <defs>{(Object.keys(COLORS) as Tone[]).map((tone) => <Marker key={tone} tone={tone} />)}</defs>;
}

function Marker({ tone }: { tone: Tone }) {
  return <marker id={`scp-${tone}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill={color(tone).accent} /></marker>;
}

function Card(props: CardProps) {
  return (
    <DiagramTile
      {...props}
      titleVoice={props.voice}
      variant="rich"
      fill="var(--surface-raised)"
      className={clsx(styles.flowPulse, styles[`step${props.step}`])}
      rectClassName={styles.vectorStroke}
      density={props.height < 108 ? 'mobile' : 'desktop'}
    />
  );
}

function Arrow({ d, tone, step, label, labelX, labelY }: { d: string; tone: Tone; step: FlowStep; label?: string; labelX?: number; labelY?: number }) {
  return (
    <Flow step={step}>
      <path d={d} fill="none" stroke={color(tone).accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" markerEnd={`url(#scp-${tone})`} className={styles.vectorStroke} />
      {label && <text x={labelX} y={labelY} className={styles.loopLabel} fill={color(tone).label}>{label}</text>}
    </Flow>
  );
}

function StageLabel({ x, y, id, label }: { x: number; y: number; id: string; label: string }) {
  return <g><text x={x} y={y} className={styles.stageId} fill="var(--text-muted)">{id}</text><text x={x + 24} y={y} className={styles.stageText} fill="var(--text-muted)">{label}</text></g>;
}

function DesktopDiagram() {
  return (
    <svg viewBox="0 0 760 510" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.desktopDiagram)}>
      <Markers />
      <rect x="24" y="24" width="712" height="462" rx={0} ry={0} fill="none" stroke="var(--border-subtle)" className={styles.vectorStroke} />
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
      <text x="44" y="48" className={styles.frameLabel} fill="var(--visual-cyan)">ROOT ORCHESTRATION CONTEXT</text>
      <text x="44" y="474" className={styles.contextNote} fill="var(--text-muted)">code owns the pipeline; LLM calls are small junctions inside it</text>
      <StageLabel x={52} y={84} id="01" label="trigger" />
      <StageLabel x={236} y={84} id="02" label="orchestrate" />
      <StageLabel x={536} y={84} id="03" label="gate" />
    </g>
  );
}

function DesktopNodes() {
  return (
    <g>
      <Card x={48} y={104} width={152} height={112} tone="neutral" icon={EMOJI.plug} eyebrow="INPUT" title="trigger" detail="event · request" voice="spec" step={1} />
      <Card x={236} y={104} width={248} height={112} tone="system" icon={EMOJI.gear} eyebrow="CODE CONTROL" title="orchestrator" detail="state · routing · budget" voice="spec" step={2} weight={1.5} />
      <WorkflowSurface />
      <ReviewGate x={536} y={104} width={184} height={112} step={5} />
    </g>
  );
}

function ReviewGate({ x, y, width, height, step }: { x: number; y: number; width: number; height: number; step: FlowStep }) {
  return <Card x={x} y={y} width={width} height={height} tone="warning" icon={EMOJI.question} eyebrow="APPROVAL GATE" title="proceed?" detail="allow · reject · revise" voice="spec" step={step} weight={2} />;
}

function WorkflowSurface() {
  return (
    <Flow step={2}>
      <rect x="236" y="270" width="464" height="176" rx={0} ry={0} fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)" strokeWidth="1.5" strokeDasharray="4 4" className={styles.vectorStroke} />
      <text x="252" y="294" className={styles.eyebrow} fill="var(--visual-cyan)">DETERMINISTIC WORKFLOW</text>
      {WORKFLOW_STEPS.map((label, i) => <StepChip key={label} x={DESKTOP_STEP_X + i * DESKTOP_STEP_GAP} y={DESKTOP_STEP_Y} label={label} />)}
      {LLM_CALLS.map((call, i) => <LlmSlot key={call.label} x={desktopCallX(call.stepIndex)} y={342} label={call.label} context={call.context} step={(i + 2) as FlowStep} />)}
    </Flow>
  );
}

function StepChip({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width="62" height="28" rx={0} ry={0} fill="var(--surface-page)" stroke="var(--visual-cyan)" className={styles.vectorStroke} />
      <text x={x + 31} y={y + 18} textAnchor="middle" className={styles.chipText} fill="var(--visual-cyan)">{label}</text>
    </g>
  );
}

function LlmSlot({ x, y, label, context, step }: { x: number; y: number; label: string; context: string; step: FlowStep }) {
  return (
    <Flow step={step}>
      <rect x={x} y={y + 36} width="58" height="44" rx={0} ry={0} fill="var(--surface-raised)" stroke="var(--visual-violet)" strokeWidth="1.5" className={styles.vectorStroke} />
      <text x={x + 29} y={y + 50} textAnchor="middle" className={styles.ticketDetail} fill="var(--visual-violet)">{context}</text>
      <EmojiImage asset={EMOJI.agent} x={x + 22} y={y + 54} size={14} />
      <text x={x + 29} y={y + 74} textAnchor="middle" className={styles.ticketTitle} fill="var(--text-heading)">{label}</text>
    </Flow>
  );
}

function DesktopConnectors() {
  return (
    <g>
      <Arrow d="M 200 160 H 236" tone="system" step={2} />
      <Arrow d="M 360 216 V 270" tone="system" step={2} label="most work happens here" labelX={390} labelY={254} />
      <Arrow d="M 628 270 V 216" tone="warning" step={5} />
      {LLM_CALLS.map((call, i) => <LlmCallArrows key={call.label} x={desktopCallCenterX(call.stepIndex)} step={(i + 2) as FlowStep} />)}
    </g>
  );
}

function LlmCallArrows({ x, step }: { x: number; step: FlowStep }) {
  return (
    <g>
      <Arrow d={`M ${x - 8} 338 V 378`} tone="model" step={step} />
      <Arrow d={`M ${x + 8} 378 V 338`} tone="model" step={step} />
    </g>
  );
}

function DesktopTokenStreams() {
  return (
    <g>
      <AnimatedTokenFlow x={204} y={154} tokens={codeTokensAt(0)} variant="input" size={8} tone="cyan" travelX={28} durationMs={FLOW_DURATION_MS} />
      <AnimatedTokenFlow x={356} y={222} tokens={codeTokensAt(STEP_GAP_MS)} variant="verticalInput" size={8} tone="cyan" travelY={44} durationMs={FLOW_DURATION_MS} />
      {LLM_CALLS.map((call, index) => {
        const x = desktopCallCenterX(call.stepIndex);
        const inputDelay = STEP_GAP_MS * (index * 2 + 2);
        const outputDelay = STEP_GAP_MS * (index * 2 + 3);
        return (
          <React.Fragment key={call.label}>
            <AnimatedTokenFlow x={x - 11} y={340} tokens={tokensAt(inputDelay)} variant="verticalInput" size={7} travelY={38} durationMs={FLOW_DURATION_MS} />
            <AnimatedTokenFlow x={x + 5} y={374} tokens={tokensAt(outputDelay)} variant="verticalOutput" size={7} travelY={-38} durationMs={FLOW_DURATION_MS} />
          </React.Fragment>
        );
      })}
      <AnimatedTokenFlow x={624} y={266} tokens={codeTokensAt(STEP_GAP_MS * 8)} variant="verticalOutput" size={8} tone="warning" travelY={-44} durationMs={FLOW_DURATION_MS} />
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg viewBox="0 0 340 800" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.mobileDiagram)}>
      <Markers />
      <rect x="18" y="20" width="304" height="760" rx={0} ry={0} fill="none" stroke="var(--border-subtle)" className={styles.vectorStroke} />
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
      <text x="170" y="40" textAnchor="middle" className={styles.frameLabel} fill="var(--visual-cyan)">ROOT ORCHESTRATION CONTEXT</text>
      <text x="170" y="764" textAnchor="middle" className={styles.contextNote} fill="var(--text-muted)">code owns the pipeline; LLM calls are small junctions</text>
      <StageLabel x={52} y={72} id="01" label="trigger" />
      <StageLabel x={52} y={188} id="02" label="orchestrate" />
      <StageLabel x={52} y={624} id="03" label="gate" />
    </g>
  );
}

function MobileNodes() {
  return (
    <g>
      <Card x={52} y={84} width={236} height={88} tone="neutral" icon={EMOJI.plug} eyebrow="INPUT" title="trigger" detail="event · request" voice="spec" step={1} />
      <Card x={52} y={200} width={236} height={96} tone="system" icon={EMOJI.gear} eyebrow="CODE CONTROL" title="orchestrator" detail="state · routing · budget" voice="spec" step={2} weight={1.5} />
      <MobileWorkflowSurface />
      <ReviewGate x={52} y={636} width={236} height={100} step={5} />
    </g>
  );
}

function MobileWorkflowSurface() {
  return (
    <Flow step={2}>
      <rect x="52" y="328" width="236" height="276" rx={0} ry={0} fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)" strokeWidth="1.5" strokeDasharray="4 4" className={styles.vectorStroke} />
      <text x="68" y="352" className={styles.eyebrow} fill="var(--visual-cyan)">DETERMINISTIC WORKFLOW</text>
      {WORKFLOW_STEPS.map((label, i) => <StepChip key={label} x={MOBILE_STEP_X} y={MOBILE_STEP_Y + i * MOBILE_STEP_GAP} label={label} />)}
      {LLM_CALLS.map((call, i) => <LlmSlot key={call.label} x={184} y={mobileCallY(call.stepIndex)} label={call.label} context={call.context} step={(i + 2) as FlowStep} />)}
    </Flow>
  );
}

function MobileConnectors() {
  return (
    <g>
      <Arrow d="M 170 172 V 200" tone="system" step={2} />
      <Arrow d="M 170 296 V 328" tone="system" step={2} label="most work" labelX={96} labelY={316} />
      {LLM_CALLS.map((call, i) => <MobileLlmCallArrows key={call.label} y={mobileCallCenterY(call.stepIndex)} step={(i + 2) as FlowStep} />)}
      <Arrow d="M 170 604 V 636" tone="warning" step={5} />
    </g>
  );
}

function MobileLlmCallArrows({ y, step }: { y: number; step: FlowStep }) {
  return (
    <g>
      <Arrow d={`M 138 ${y - 6} H 184`} tone="model" step={step} />
      <Arrow d={`M 184 ${y + 6} H 138`} tone="model" step={step} />
    </g>
  );
}

function MobileTokenStreams() {
  return (
    <g>
      <AnimatedTokenFlow x={164} y={300} tokens={codeTokensAt(STEP_GAP_MS)} variant="verticalInput" size={8} tone="cyan" travelY={24} durationMs={FLOW_DURATION_MS} />
      {LLM_CALLS.map((call, index) => {
        const y = mobileCallCenterY(call.stepIndex);
        const inputDelay = STEP_GAP_MS * (index * 2 + 2);
        const outputDelay = STEP_GAP_MS * (index * 2 + 3);
        return (
          <React.Fragment key={call.label}>
            <AnimatedTokenFlow x={142} y={y - 10} tokens={tokensAt(inputDelay)} variant="input" size={7} travelX={38} durationMs={FLOW_DURATION_MS} />
            <AnimatedTokenFlow x={180} y={y + 2} tokens={tokensAt(outputDelay)} variant="output" size={7} travelX={-38} durationMs={FLOW_DURATION_MS} />
          </React.Fragment>
        );
      })}
      <AnimatedTokenFlow x={164} y={632} tokens={codeTokensAt(STEP_GAP_MS * 8)} variant="verticalInput" size={8} tone="warning" travelY={-24} durationMs={FLOW_DURATION_MS} />
    </g>
  );
}

export default function StructuredControlPlaneWorkbench() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}
