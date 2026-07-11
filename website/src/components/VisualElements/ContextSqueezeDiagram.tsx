import clsx from 'clsx';
import styles from './ContextSqueezeDiagram.module.css';
import lensStyles from './ContextLensWindow.module.css';
import { ContextLensFrame, ContextLensRegionNotes, toneBg, toneColor, type ContextLensTone } from './ContextLensWindow';

// ViewBox 560×300 — The Fixed Prefix Stack.
// The ghost prompt marks the primacy start; inserted rules occupy that space and
// force the live prompt into the middle zone before any agent work begins.

const WINDOW = { x: 54, y: 24, width: 270, height: 264 } as const;
const BLOCK_X = WINDOW.x + 18;
const BLOCK_W = WINDOW.width - 36;
const BLOCK_H = 24;
const TASK_LEAN_Y = 84;
const LABEL_OFFSET = 16;

const PREFIX_BLOCKS = [
  { label: 'System', y: 32, tone: 'neutral' },
  { label: 'Tools', y: 58, tone: 'neutral' },
  { label: 'AGENTS.md', y: 86, tone: 'cyan', className: styles.ruleOne },
  { label: 'Repo rules', y: 114, tone: 'cyan', className: styles.ruleTwo },
] as const;

const PANEL = { x: 360, y: 24, width: 188, height: 264 } as const;
const STEP_NUMBER_X = PANEL.x + 20;
const STEP_TEXT_X = PANEL.x + 44;
const STEP_YS = [85, 133, 177] as const;
const STEPS = [
  { n: '1', label: 'Prefix loads first', className: styles.stepOne },
  { n: '2', label: ['Rules insert', 'above prompt'], className: styles.stepTwo },
  { n: '3', label: ['Prompt leaves', 'primacy'], className: styles.stepThree },
] as const;

type PrefixBlockProps = {
  label: string;
  y: number;
  tone: ContextLensTone;
  className?: string;
};

function PrefixBlock({ label, y, tone, className }: PrefixBlockProps) {
  return (
    <g className={clsx(styles.prefixBlock, className)}>
      <rect x={BLOCK_X} y={y} width={BLOCK_W} height={BLOCK_H} rx={0} fill={toneBg(tone)} stroke={toneColor(tone)} strokeWidth={1.5} />
      <text x={BLOCK_X + 12} y={y + LABEL_OFFSET} className={lensStyles.blockLabel} fill={toneColor(tone)}>
        {label}
      </text>
    </g>
  );
}

function TaskBlock() {
  return (
    <g>
      <g className={styles.taskShift}>
        <rect className={styles.taskRect} x={BLOCK_X} y={TASK_LEAN_Y} width={BLOCK_W} height={BLOCK_H} rx={0} strokeWidth={2} />
        <text x={BLOCK_X + 12} y={TASK_LEAN_Y + LABEL_OFFSET} className={lensStyles.blockLabel} fill="var(--text-body)">
          User Prompt
        </text>
      </g>
    </g>
  );
}

function LensFrame() {
  return (
    <g>
      <ContextLensFrame {...WINDOW} />
      <ContextLensRegionNotes {...WINDOW} side="left" notes={{ primacy: 'top', middle: 'middle', recency: 'latest' }} />
      <text x={WINDOW.x} y={18} className={styles.windowLabel} fill="var(--text-muted)">
        REQUEST CONTEXT
      </text>
    </g>
  );
}

function PushIndicators() {
  return (
    <g aria-hidden="true">
      <path className={styles.pushOne} d="M 188 92 v 18 m -6 -6 l 6 6 6 -6" />
      <path className={styles.pushTwo} d="M 188 122 v 18 m -6 -6 l 6 6 6 -6" />
    </g>
  );
}

function StepRow({ n, label, y, className }: { n: string; label: string | readonly string[]; y: number; className: string }) {
  const lines = Array.isArray(label) ? label : [label];

  return (
    <g className={clsx(styles.stepRow, className)}>
      <rect className={styles.stepBox} x={STEP_NUMBER_X - 9} y={y - 13} width={18} height={18} rx={0} />
      <text x={STEP_NUMBER_X} y={y} textAnchor="middle" className={styles.stepNumber}>{n}</text>
      <text x={STEP_TEXT_X} y={y} className={styles.stepText}>
        {lines.map((line, index) => <tspan key={line} x={STEP_TEXT_X} dy={index === 0 ? 0 : 14}>{line}</tspan>)}
      </text>
    </g>
  );
}

function RightColumn() {
  return (
    <g className={styles.rightColumn}>
      <rect x={PANEL.x} y={PANEL.y} width={PANEL.width} height={PANEL.height} rx={0} fill="var(--surface-page)" stroke="var(--border-subtle)" />
      <text x={PANEL.x + 20} y={49} className={styles.panelTitle} fill="var(--text-muted)">STARTUP ORDER</text>
      {STEPS.map((step, index) => <StepRow key={step.n} {...step} y={STEP_YS[index]} />)}
      <path d={`M ${PANEL.x + 20} 209 H ${PANEL.x + PANEL.width - 20}`} stroke="var(--border-subtle)" />
      <text x={PANEL.x + 20} y={231} className={styles.panelTitle} fill="var(--text-muted)">RESULT</text>
      <text x={PANEL.x + 20} y={253} className={styles.warningText} fill="var(--visual-warning)">
        <tspan x={PANEL.x + 20}>task enters</tspan>
        <tspan x={PANEL.x + 20} dy={18}>middle zone</tspan>
      </text>
    </g>
  );
}

export default function ContextSqueezeDiagram() {
  return (
    <svg
      viewBox="0 0 560 300"
      width="100%"
      role="img"
      aria-label="Context files load before the user prompt as part of the fixed prefix. New rules occupy the prompt's primacy-zone starting slot and push the live prompt into the middle zone, where it receives weaker attention."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
    >
      <LensFrame />
      {PREFIX_BLOCKS.map((block) => <PrefixBlock key={block.label} {...block} />)}
      <TaskBlock />
      <PushIndicators />
      <RightColumn />
    </svg>
  );
}
