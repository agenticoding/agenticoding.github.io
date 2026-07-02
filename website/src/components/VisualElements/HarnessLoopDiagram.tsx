import React from 'react';
import clsx from 'clsx';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';
import { useMounted } from '../../hooks/useMounted';
import { DiagramTile } from './DiagramTile';
import styles from './HarnessLoopDiagram.module.css';

const ACTS = [
  { id: 'context', threshold: 0.00 },
  { id: 'model', threshold: 0.16 },
  { id: 'validate', threshold: 0.32 },
  { id: 'execute', threshold: 0.48 },
  { id: 'observe', threshold: 0.64 },
  { id: 'decide', threshold: 0.80 },
] as const;

const ARROW = '-8,-4 0,0 -8,4';
const BOX = { width: 104, height: 48 } as const;
const MOBILE_BOX = { width: 184, height: 44 } as const;
const ARIA_LABEL = 'Agent harness loop: assemble context, call the model, parse and validate output, execute outside the model, append observation, then stop or iterate.';

type ActId = (typeof ACTS)[number]['id'];
type Tone = 'context' | 'model' | 'system' | 'warning' | 'success' | 'neutral';
type Step = { id: ActId; label: string; sublabel: string; x: number; y: number; tone: Tone };

type Visibility = Record<ActId, boolean>;

type BoxProps = Step & { visible: boolean; width?: number; height?: number };

const COLORS: Record<Tone, { stroke: string; fill: string; text: string }> = {
  context: { stroke: 'var(--visual-indigo)', fill: 'var(--visual-bg-indigo)', text: 'var(--visual-indigo)' },
  model: { stroke: 'var(--visual-violet)', fill: 'var(--visual-bg-violet)', text: 'var(--visual-violet)' },
  system: { stroke: 'var(--visual-cyan)', fill: 'var(--visual-bg-cyan)', text: 'var(--visual-cyan)' },
  warning: { stroke: 'var(--visual-warning)', fill: 'var(--visual-bg-warning)', text: 'var(--visual-warning)' },
  success: { stroke: 'var(--visual-success)', fill: 'var(--visual-bg-success)', text: 'var(--visual-success)' },
  neutral: { stroke: 'var(--border-default)', fill: 'var(--surface-raised)', text: 'var(--text-muted)' },
};

const DESKTOP_STEPS: readonly Step[] = [
  { id: 'context', label: 'assemble', sublabel: 'context', x: 32, y: 72, tone: 'context' },
  { id: 'model', label: 'call', sublabel: 'model', x: 184, y: 72, tone: 'model' },
  { id: 'validate', label: 'parse', sublabel: 'validate', x: 336, y: 72, tone: 'warning' },
  { id: 'execute', label: 'execute', sublabel: 'outside LLM', x: 488, y: 72, tone: 'system' },
  { id: 'observe', label: 'append', sublabel: 'observation', x: 336, y: 216, tone: 'context' },
  { id: 'decide', label: 'stop', sublabel: 'or iterate', x: 184, y: 216, tone: 'success' },
];

const MOBILE_STEPS: readonly Step[] = [
  { id: 'context', label: 'assemble', sublabel: 'context', x: 68, y: 40, tone: 'context' },
  { id: 'model', label: 'call', sublabel: 'model', x: 68, y: 112, tone: 'model' },
  { id: 'validate', label: 'parse', sublabel: 'validate', x: 68, y: 184, tone: 'warning' },
  { id: 'execute', label: 'execute', sublabel: 'outside LLM', x: 68, y: 256, tone: 'system' },
  { id: 'observe', label: 'append', sublabel: 'observation', x: 68, y: 328, tone: 'context' },
  { id: 'decide', label: 'stop', sublabel: 'or iterate', x: 68, y: 400, tone: 'success' },
];

function StepBox({ label, sublabel, x, y, tone, visible, width = BOX.width, height = BOX.height }: BoxProps) {
  return (
    <DiagramTile
      x={x}
      y={y}
      width={width}
      height={height}
      tone={tone}
      title={label}
      detail={sublabel}
      variant="compact"
      className={clsx(styles.box, visible && styles.visible)}
    />
  );
}

function Arrow({ d, end, visible, tone = 'neutral' }: { d: string; end: string; visible: boolean; tone?: Tone }) {
  const stroke = tone === 'neutral' ? 'var(--text-muted)' : COLORS[tone].stroke;

  return (
    <g className={clsx(styles.arrow, visible && styles.visible)}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={ARROW} transform={end} fill={stroke} />
    </g>
  );
}

function LaneLabels({ visible }: { visible: boolean }) {
  return (
    <>
      <text x="70" y="32" className={clsx(styles.laneLabel, visible && styles.visible)} fill="var(--visual-cyan)">harness / control loop</text>
      <text x="212" y="32" className={clsx(styles.laneLabel, visible && styles.visible)} fill="var(--visual-violet)">model boundary</text>
      <line x1="164" y1="48" x2="164" y2="288" className={clsx(styles.boundary, visible && styles.visible)} stroke="var(--border-default)" strokeDasharray="4 4" />
      <line x1="320" y1="48" x2="320" y2="288" className={clsx(styles.boundary, visible && styles.visible)} stroke="var(--border-default)" strokeDasharray="4 4" />
    </>
  );
}

function DesktopDiagram({ visible }: { visible: Visibility }) {
  const allVisible = visible.context;

  return (
    <svg viewBox="0 0 640 320" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.desktopDiagram)}>
      <LaneLabels visible={allVisible} />
      {DESKTOP_STEPS.map((step) => <StepBox key={step.id} {...step} visible={visible[step.id]} />)}
      <Arrow d="M 136 96 H 176" end="translate(184,96)" visible={visible.model} tone="model" />
      <Arrow d="M 288 96 H 328" end="translate(336,96)" visible={visible.validate} tone="warning" />
      <Arrow d="M 440 96 H 480" end="translate(488,96)" visible={visible.execute} tone="system" />
      <Arrow d="M 540 120 V 176 C 540 204 464 220 448 230" end="translate(440,234) rotate(155)" visible={visible.observe} tone="context" />
      <Arrow d="M 336 240 H 296" end="translate(288,240) rotate(180)" visible={visible.decide} />
      <Arrow d="M 184 240 C 112 232 84 178 84 128" end="translate(84,120) rotate(-90)" visible={visible.decide} />
      <Arrow d="M 288 264 H 408" end="translate(416,264)" visible={visible.decide} tone="success" />
      <text x="116" y="178" className={clsx(styles.branchLabel, visible.decide && styles.visible)} fill="var(--text-muted)">iterate</text>
      <text x="358" y="286" className={clsx(styles.branchLabel, visible.decide && styles.visible)} fill="var(--visual-success)">final</text>
    </svg>
  );
}

function MobileDiagram({ visible }: { visible: Visibility }) {
  return (
    <svg viewBox="0 0 320 488" width="100%" aria-hidden="true" className={clsx(styles.diagram, styles.mobileDiagram)}>
      <text x="160" y="20" className={clsx(styles.laneLabel, visible.context && styles.visible)} textAnchor="middle" fill="var(--visual-cyan)">harness controls model calls</text>
      {MOBILE_STEPS.map((step) => <StepBox key={step.id} {...step} {...MOBILE_BOX} visible={visible[step.id]} />)}
      <Arrow d="M 160 84 V 104" end="translate(160,112) rotate(90)" visible={visible.model} tone="model" />
      <Arrow d="M 160 156 V 176" end="translate(160,184) rotate(90)" visible={visible.validate} tone="warning" />
      <Arrow d="M 160 228 V 248" end="translate(160,256) rotate(90)" visible={visible.execute} tone="system" />
      <Arrow d="M 160 300 V 320" end="translate(160,328) rotate(90)" visible={visible.observe} tone="context" />
      <Arrow d="M 160 372 V 392" end="translate(160,400) rotate(90)" visible={visible.decide} />
      <Arrow d="M 68 422 H 32 V 62 H 60" end="translate(68,62)" visible={visible.decide} />
      <Arrow d="M 252 422 H 288" end="translate(296,422)" visible={visible.decide} tone="success" />
      <text x="44" y="250" className={clsx(styles.branchLabel, visible.decide && styles.visible)} fill="var(--text-muted)" transform="rotate(-90 44 250)">iterate</text>
      <text x="270" y="410" className={clsx(styles.branchLabel, visible.decide && styles.visible)} fill="var(--visual-success)">final</text>
    </svg>
  );
}

export default function HarnessLoopDiagram() {
  const phase = useStaticAnimationPhase();
  const { wasReached } = useActs(ACTS, phase);
  const mounted = useMounted();
  const visible = Object.fromEntries(ACTS.map(({ id }) => [id, mounted && wasReached(id)])) as Visibility;

  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <DesktopDiagram visible={visible} />
      <MobileDiagram visible={visible} />
    </div>
  );
}
