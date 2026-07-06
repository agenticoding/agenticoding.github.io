import React from 'react';
import clsx from 'clsx';
import type { TokenSequence, TokenTrainOrientation } from './AnimatedTokenFlow';
import { TokenArrowTrain } from './TokenArrowTrain';
import { seededTokenTrain } from './TokenTrainSequence';
import { DiagramTile } from './DiagramTile';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { GearNode } from './GearNode';
import { ModelCallFrame } from './ModelCallFrame';
import { centerIn } from './diagramGeometry';
import { delayStyle } from './diagramMotion';
import {
  DIAGRAM_STROKE,
  DIAGRAM_TOKEN_SIZE,
  RICH_TILE_SCALE,
  WORKBENCH_SCALE,
} from './diagramScale';
import type { DiagramTone, DiagramVoice } from './diagramTileLayout';
import styles from './StructuredControlPlaneWorkbench.module.css';

const ARIA_LABEL =
  'Structured control-plane pipeline: a trigger enters a code-owned orchestrator, deterministic workflow steps do most of the work, three small bounded LLM calls happen at specific junctions, and code validates the result before commit.';

type Tone = Extract<
  DiagramTone,
  'model' | 'system' | 'warning' | 'success' | 'neutral'
>;
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

const WORKFLOW_STEPS = [
  'collect',
  'rank',
  'classify',
  'draft',
  'verify',
] as const;
const DESKTOP_STEP_X = 293;
const DESKTOP_STEP_Y = 310;
const DESKTOP_STEP_GAP = 72;
const MOBILE_STEP_X = 76;
const MOBILE_STEP_Y = 410;
const MOBILE_STEP_GAP = 66;
const MOBILE_WORKFLOW_BOTTOM = 756;
const MOBILE_GATE_Y = 788;
const LLM_CALLS = [
  { stepIndex: 2, label: 'classify', context: 'intent', callSlot: 6 },
  { stepIndex: 3, label: 'draft', context: 'answer', callSlot: 9 },
  { stepIndex: 4, label: 'verify', context: 'citations', callSlot: 12 },
] as const;
const CONTROL_PLANE_NOTE_LINES = [
  'code owns the pipeline',
  'LLM calls stay bounded inside it',
] as const;
const TOKEN_PAIR = seededTokenTrain('control-plane-token', 2);
const CODE_PAIR = seededTokenTrain('control-plane-code', 2);
const SEQUENCE_BEAT_MS = 820;
const FLOW_DURATION_MS = SEQUENCE_BEAT_MS * 17;
const STEP_GAP_MS = SEQUENCE_BEAT_MS;
const TOKEN_TRAIN_TIMING = {
  cycleMs: FLOW_DURATION_MS,
  travelMs: 520,
  fadeMs: 120,
  repeat: 'loop',
} as const;
const TOKEN_FLOW_SIZE = DIAGRAM_TOKEN_SIZE.flow;
const MOBILE_TOKEN_FLOW_SIZE = TOKEN_FLOW_SIZE * 0.6;
const DESKTOP_LLM_ARROW_PAIR_OFFSET_X = 8;
const MOBILE_LLM_ARROW_PAIR_OFFSET_Y = 6;
const PIPELINE_START_SLOT = 3;
const FINAL_GATE_SLOT = 15;
const WORKFLOW_CHIP_DELAYS_MS = [PIPELINE_START_SLOT, 4, 5, 8, 11].map(
  (slot) => slot * SEQUENCE_BEAT_MS
);

function color(tone: Tone) {
  return COLORS[tone];
}

function tokenTone(tone: Tone) {
  if (tone === 'system' || tone === 'success') return 'cyan';
  if (tone === 'model') return 'violet';
  return tone;
}

function desktopCallX(stepIndex: number) {
  return DESKTOP_STEP_X + stepIndex * DESKTOP_STEP_GAP + 2;
}

function desktopCallCenterX(stepIndex: number) {
  return desktopCallX(stepIndex) + WORKBENCH_SCALE.llmSlot.width / 2;
}

function mobileCallY(stepIndex: number) {
  return MOBILE_STEP_Y + stepIndex * MOBILE_STEP_GAP - 44;
}

function mobileCallCenterY(stepIndex: number) {
  return (
    mobileCallY(stepIndex) +
    WORKBENCH_SCALE.llmSlot.topOffset +
    WORKBENCH_SCALE.llmSlot.height / 2
  );
}

function Flow({
  step,
  children,
}: {
  step: FlowStep;
  children: React.ReactNode;
}) {
  return (
    <g className={clsx(styles.flowPulse, styles[`step${step}`])}>{children}</g>
  );
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
      density={
        props.height < RICH_TILE_SCALE.mobileDensityMaxHeight
          ? 'mobile'
          : 'desktop'
      }
    />
  );
}

function Arrow({
  d,
  tone,
  step,
  tokens,
  startDelayMs,
  spacingPx,
  size,
  laneOrientation,
  label,
  labelX,
  labelY,
}: {
  d: string;
  tone: Tone;
  step: FlowStep;
  tokens: TokenSequence;
  startDelayMs?: number;
  spacingPx: number;
  size: number;
  laneOrientation?: TokenTrainOrientation;
  label?: string;
  labelX?: number;
  labelY?: number;
}) {
  return (
    <Flow step={step}>
      <TokenArrowTrain
        d={d}
        tokens={tokens}
        timing={{ ...TOKEN_TRAIN_TIMING, startDelayMs }}
        stagger={{ mode: 'pathSpacing', spacingPx }}
        size={size}
        tone={tokenTone(tone)}
        stroke={color(tone).accent}
        laneOrientation={laneOrientation}
        pathClassName={styles.vectorStroke}
        label={label}
        labelX={labelX}
        labelY={labelY}
        labelClassName={styles.loopLabel}
        labelFill={color(tone).label}
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
        x={x + 24}
        y={y}
        className={styles.stageText}
        fill="var(--text-muted)"
      >
        {label}
      </text>
    </g>
  );
}

function ContextNote({
  x,
  y,
  textAnchor = 'start',
}: {
  x: number;
  y: number;
  textAnchor?: 'start' | 'middle';
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      className={styles.contextNote}
      fill="var(--text-muted)"
    >
      {CONTROL_PLANE_NOTE_LINES.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function DesktopDiagram() {
  return (
    <svg
      viewBox="0 0 760 510"
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.desktopDiagram)}
    >
      <rect
        x="24"
        y="24"
        width="712"
        height="462"
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
        ROOT ORCHESTRATION CONTEXT
      </text>
      <ContextNote x={44} y={462} />
      <StageLabel x={52} y={84} id="01" label="trigger" />
      <StageLabel x={236} y={84} id="02" label="orchestrate" />
      <StageLabel x={536} y={84} id="03" label="gate" />
    </g>
  );
}

function DesktopNodes() {
  return (
    <g>
      <Card
        x={48}
        y={104}
        width={152}
        height={112}
        tone="neutral"
        icon={EMOJI.plug}
        eyebrow="INPUT"
        title="trigger"
        detail="event · request"
        voice="spec"
        step={1}
      />
      <Card
        x={236}
        y={104}
        width={248}
        height={112}
        tone="system"
        icon={EMOJI.agent}
        eyebrow="AGENT CONTROL"
        title="orchestrator"
        detail="state · routing · budget"
        voice="ai"
        step={2}
        weight={1.5}
      />
      <WorkflowSurface />
      <ReviewGate x={536} y={104} width={184} height={112} step={5} />
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

function WorkflowSurface() {
  return (
    <Flow step={2}>
      <ModelCallFrame
        x={236}
        y={270}
        width={464}
        height={192}
        tabLabel="DETERMINISTIC WORKFLOW"
        tabIcon={EMOJI.agent}
        fill="var(--visual-bg-cyan)"
        stroke="var(--visual-cyan)"
        rectClassName={styles.vectorStroke}
      />
      {WORKFLOW_STEPS.map((label, i) => (
        <StepChip
          key={label}
          x={DESKTOP_STEP_X + i * DESKTOP_STEP_GAP}
          y={DESKTOP_STEP_Y}
          label={label}
          delayMs={WORKFLOW_CHIP_DELAYS_MS[i]}
        />
      ))}
      {LLM_CALLS.map((call, i) => (
        <LlmSlot
          key={call.label}
          x={desktopCallX(call.stepIndex)}
          y={342}
          label={call.label}
          context={call.context}
          step={(i + 2) as FlowStep}
          delayMs={call.callSlot * SEQUENCE_BEAT_MS}
        />
      ))}
    </Flow>
  );
}

function StepChip({
  x,
  y,
  label,
  delayMs,
}: {
  x: number;
  y: number;
  label: string;
  delayMs: number;
}) {
  return (
    <g className={styles.pipelineChip} style={delayStyle(delayMs)}>
      <rect
        x={x}
        y={y}
        width={WORKBENCH_SCALE.chip.width}
        height={WORKBENCH_SCALE.chip.height}
        rx={0}
        ry={0}
        fill="var(--surface-page)"
        stroke="var(--visual-cyan)"
        className={styles.vectorStroke}
      />
      <text
        x={x + 31}
        y={y + 18}
        textAnchor="middle"
        className={styles.chipText}
        fill="var(--visual-cyan)"
      >
        {label}
      </text>
    </g>
  );
}

function LlmSlot({
  x,
  y,
  label,
  context,
  step,
  delayMs,
}: {
  x: number;
  y: number;
  label: string;
  context: string;
  step: FlowStep;
  delayMs: number;
}) {
  return (
    <Flow step={step}>
      <g className={styles.llmCallTile} style={delayStyle(delayMs)}>
        <rect
          x={x}
          y={y + WORKBENCH_SCALE.llmSlot.topOffset}
          width={WORKBENCH_SCALE.llmSlot.width}
          height={WORKBENCH_SCALE.llmSlot.height}
          rx={0}
          ry={0}
          fill="var(--surface-raised)"
          stroke="var(--visual-violet)"
          strokeWidth={DIAGRAM_STROKE.default}
          className={styles.vectorStroke}
        />
        <text
          x={x + WORKBENCH_SCALE.llmSlot.width / 2}
          y={
            y +
            WORKBENCH_SCALE.llmSlot.topOffset +
            WORKBENCH_SCALE.llmSlot.contextOffset
          }
          textAnchor="middle"
          className={styles.ticketDetail}
          fill="var(--visual-violet)"
        >
          {context}
        </text>
        <GearNode
          x={
            x +
            centerIn(
              WORKBENCH_SCALE.llmSlot.width,
              WORKBENCH_SCALE.llmSlot.gearSize
            )
          }
          y={
            y +
            WORKBENCH_SCALE.llmSlot.topOffset +
            centerIn(
              WORKBENCH_SCALE.llmSlot.height,
              WORKBENCH_SCALE.llmSlot.gearSize
            )
          }
          size={WORKBENCH_SCALE.llmSlot.gearSize}
          className={styles.llmGearSpin}
          style={delayStyle(delayMs)}
        />
        <text
          x={x + WORKBENCH_SCALE.llmSlot.width / 2}
          y={
            y +
            WORKBENCH_SCALE.llmSlot.topOffset +
            WORKBENCH_SCALE.llmSlot.titleOffset
          }
          textAnchor="middle"
          className={styles.ticketTitle}
          fill="var(--text-heading)"
        >
          {label}
        </text>
      </g>
    </Flow>
  );
}

function DesktopConnectors() {
  return (
    <g>
      <Arrow
        d="M 200 160 H 236"
        tone="system"
        step={2}
        tokens={CODE_PAIR}
        spacingPx={22}
        size={TOKEN_FLOW_SIZE}
      />
      <Arrow
        d="M 360 216 V 270"
        tone="system"
        step={2}
        tokens={CODE_PAIR}
        startDelayMs={STEP_GAP_MS}
        spacingPx={22}
        size={TOKEN_FLOW_SIZE}
        label="most work happens here"
        labelX={500}
        labelY={294}
      />
      <Arrow
        d="M 628 270 V 216"
        tone="warning"
        step={5}
        tokens={CODE_PAIR}
        startDelayMs={FINAL_GATE_SLOT * SEQUENCE_BEAT_MS}
        spacingPx={22}
        size={TOKEN_FLOW_SIZE}
      />
      {LLM_CALLS.map((call, i) => (
        <LlmCallArrows
          key={call.label}
          x={desktopCallCenterX(call.stepIndex)}
          step={(i + 2) as FlowStep}
        />
      ))}
    </g>
  );
}

function LlmCallArrows({ x, step }: { x: number; step: FlowStep }) {
  const call = LLM_CALLS[step - 2];
  const inputDelay = call.callSlot * SEQUENCE_BEAT_MS;
  return (
    <g>
      <Arrow
        d={`M ${x - DESKTOP_LLM_ARROW_PAIR_OFFSET_X} 338 V 378`}
        tone="model"
        step={step}
        tokens={TOKEN_PAIR}
        startDelayMs={inputDelay}
        spacingPx={22}
        size={TOKEN_FLOW_SIZE}
        laneOrientation="above"
      />
      <Arrow
        d={`M ${x + DESKTOP_LLM_ARROW_PAIR_OFFSET_X} 378 V 338`}
        tone="model"
        step={step}
        tokens={TOKEN_PAIR}
        startDelayMs={inputDelay + SEQUENCE_BEAT_MS}
        spacingPx={22}
        size={TOKEN_FLOW_SIZE}
        laneOrientation="below"
      />
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg
      viewBox="0 0 340 956"
      width="100%"
      aria-hidden="true"
      className={clsx(styles.diagram, styles.mobileDiagram)}
    >
      <rect
        x="18"
        y="20"
        width="304"
        height="916"
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
        ROOT ORCHESTRATION CONTEXT
      </text>
      <ContextNote x={170} y={908} textAnchor="middle" />
      <StageLabel x={52} y={72} id="01" label="trigger" />
      <StageLabel x={52} y={212} id="02" label="orchestrate" />
      <StageLabel x={52} y={776} id="03" label="gate" />
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
        icon={EMOJI.plug}
        eyebrow="INPUT"
        title="trigger"
        detail="event · request"
        voice="spec"
        step={1}
      />
      <Card
        x={52}
        y={224}
        width={WORKBENCH_SCALE.mobileRichCard.width}
        height={WORKBENCH_SCALE.mobileRichCard.height}
        tone="system"
        icon={EMOJI.agent}
        eyebrow="AGENT CONTROL"
        title="orchestrator"
        detail="state · routing · budget"
        voice="ai"
        step={2}
        weight={1.5}
      />
      <MobileWorkflowSurface />
      <ReviewGate
        x={52}
        y={MOBILE_GATE_Y}
        width={WORKBENCH_SCALE.mobileRichCard.width}
        height={WORKBENCH_SCALE.mobileRichCard.height}
        step={5}
      />
    </g>
  );
}

function MobileWorkflowSurface() {
  return (
    <Flow step={2}>
      <ModelCallFrame
        x={52}
        y={368}
        width={236}
        height={388}
        tabLabel="DETERMINISTIC WORKFLOW"
        tabIcon={EMOJI.agent}
        fill="var(--visual-bg-cyan)"
        stroke="var(--visual-cyan)"
        tabWidth={228}
        rectClassName={styles.vectorStroke}
      />
      {WORKFLOW_STEPS.map((label, i) => (
        <StepChip
          key={label}
          x={MOBILE_STEP_X}
          y={MOBILE_STEP_Y + i * MOBILE_STEP_GAP}
          label={label}
          delayMs={WORKFLOW_CHIP_DELAYS_MS[i]}
        />
      ))}
      {LLM_CALLS.map((call, i) => (
        <LlmSlot
          key={call.label}
          x={184}
          y={mobileCallY(call.stepIndex)}
          label={call.label}
          context={call.context}
          step={(i + 2) as FlowStep}
          delayMs={call.callSlot * SEQUENCE_BEAT_MS}
        />
      ))}
    </Flow>
  );
}

function MobileConnectors() {
  return (
    <g>
      <Arrow
        d="M 170 196 V 224"
        tone="system"
        step={2}
        tokens={CODE_PAIR}
        spacingPx={16}
        size={MOBILE_TOKEN_FLOW_SIZE}
      />
      <Arrow
        d="M 170 336 V 368"
        tone="system"
        step={2}
        tokens={CODE_PAIR}
        startDelayMs={STEP_GAP_MS}
        spacingPx={16}
        size={MOBILE_TOKEN_FLOW_SIZE}
      />
      {LLM_CALLS.map((call, i) => (
        <MobileLlmCallArrows
          key={call.label}
          y={mobileCallCenterY(call.stepIndex)}
          step={(i + 2) as FlowStep}
        />
      ))}
      <Arrow
        d={`M 170 ${MOBILE_WORKFLOW_BOTTOM} V ${MOBILE_GATE_Y}`}
        tone="warning"
        step={5}
        tokens={CODE_PAIR}
        startDelayMs={FINAL_GATE_SLOT * SEQUENCE_BEAT_MS}
        spacingPx={16}
        size={MOBILE_TOKEN_FLOW_SIZE}
      />
    </g>
  );
}

function MobileLlmCallArrows({ y, step }: { y: number; step: FlowStep }) {
  const call = LLM_CALLS[step - 2];
  const inputDelay = call.callSlot * SEQUENCE_BEAT_MS;
  return (
    <g>
      <Arrow
        d={`M 138 ${y - MOBILE_LLM_ARROW_PAIR_OFFSET_Y} H 184`}
        tone="model"
        step={step}
        tokens={TOKEN_PAIR}
        startDelayMs={inputDelay}
        spacingPx={16}
        size={MOBILE_TOKEN_FLOW_SIZE}
        laneOrientation="above"
      />
      <Arrow
        d={`M 184 ${y + MOBILE_LLM_ARROW_PAIR_OFFSET_Y} H 138`}
        tone="model"
        step={step}
        tokens={TOKEN_PAIR}
        startDelayMs={inputDelay + SEQUENCE_BEAT_MS}
        spacingPx={16}
        size={MOBILE_TOKEN_FLOW_SIZE}
        laneOrientation="below"
      />
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
