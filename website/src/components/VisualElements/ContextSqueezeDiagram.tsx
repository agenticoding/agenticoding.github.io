import clsx from 'clsx';
import styles from './ContextSqueezeDiagram.module.css';
import lensStyles from './ContextLensWindow.module.css';
import { ContextLensZoneBackdrop } from './ContextLensWindow';

// ViewBox 560×320 — The Fixed Prefix Stack.
// Context files are part of the always-loaded prefix. A larger prefix means the
// user task enters lower before the agent has done any work.

const WINDOW = { x: 34, y: 24, width: 292, height: 272 } as const;
const BLOCK_X = WINDOW.x + 18;
const BLOCK_W = WINDOW.width - 36;
const BLOCK_H = 24;
const TASK_LEAN_Y = 132;
const LABEL_OFFSET = 16;

const PREFIX_BLOCKS = [
  { label: 'System', y: 42, tone: 'neutral' },
  { label: 'Tools', y: 72, tone: 'neutral' },
  { label: 'AGENTS.md', y: 102, tone: 'cyan' },
  { label: 'Repo rules', y: 132, tone: 'cyan', className: styles.ruleOne },
  { label: 'Local rules', y: 162, tone: 'cyan', className: styles.ruleTwo },
] as const;

const STEPS = [
  { n: '1', label: 'Prefix loads first' },
  { n: '2', label: 'Rules insert above prompt' },
  { n: '3', label: 'Prompt starts lower' },
] as const;

type Tone = 'cyan' | 'neutral' | 'success' | 'warning';

type PrefixBlockProps = {
  label: string;
  y: number;
  tone: Tone;
  className?: string;
};

function toneColor(tone: Tone) {
  return `var(--visual-${tone})`;
}

function toneBg(tone: Tone) {
  return `var(--visual-bg-${tone})`;
}

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
      <rect className={styles.taskBaseline} x={BLOCK_X} y={TASK_LEAN_Y} width={BLOCK_W} height={BLOCK_H} rx={0} fill="none" stroke="var(--visual-success)" strokeWidth={1.5} strokeDasharray="5 4" />
      <g className={styles.taskShift}>
        <rect className={styles.taskRect} x={BLOCK_X} y={TASK_LEAN_Y} width={BLOCK_W} height={BLOCK_H} rx={0} strokeWidth={2} />
        <text x={BLOCK_X + 12} y={TASK_LEAN_Y + LABEL_OFFSET} className={lensStyles.blockLabel} fill="var(--text-body)">
          User Prompt
        </text>
      </g>
    </g>
  );
}

function StackBracket() {
  const x = BLOCK_X + BLOCK_W + 10;
  const y1 = PREFIX_BLOCKS[0].y;
  const y2 = PREFIX_BLOCKS[PREFIX_BLOCKS.length - 1].y + BLOCK_H;

  return (
    <g className={styles.bracket} aria-hidden="true">
      <path d={`M ${x + 8} ${y1} H ${x} V ${y2} H ${x + 8}`} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="butt" />
      <text x={x + 16} y={(y1 + y2) / 2 + 4} className={styles.sideLabel} fill="var(--text-muted)">
        fixed prefix
      </text>
    </g>
  );
}

function LensFrame() {
  return (
    <g>
      <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.width} height={WINDOW.height} rx={0} fill="var(--surface-page)" stroke="var(--border-default)" strokeWidth={1} />
      <ContextLensZoneBackdrop {...WINDOW} />
      <text x={WINDOW.x} y={18} className={styles.windowLabel} fill="var(--text-muted)">
        REQUEST CONTEXT
      </text>
    </g>
  );
}

function PushIndicators() {
  return (
    <g aria-hidden="true">
      <path className={styles.pushOne} d="M 188 132 v 18 m -6 -6 l 6 6 6 -6" />
      <path className={styles.pushTwo} d="M 188 162 v 18 m -6 -6 l 6 6 6 -6" />
    </g>
  );
}

function StepRow({ n, label, y }: { n: string; label: string; y: number }) {
  return (
    <g>
      <rect x={374} y={y - 13} width={18} height={18} rx={0} fill="var(--surface-muted)" stroke="var(--border-subtle)" />
      <text x={383} y={y} textAnchor="middle" className={styles.stepNumber} fill="var(--text-muted)">{n}</text>
      <text x={402} y={y} className={styles.stepText} fill="var(--text-body)">{label}</text>
    </g>
  );
}

function RightColumn() {
  return (
    <g className={styles.rightColumn}>
      <rect x={354} y={58} width={178} height={204} rx={0} fill="var(--surface-page)" stroke="var(--border-subtle)" />
      <text x={374} y={86} className={styles.panelTitle} fill="var(--text-muted)">STARTUP ORDER</text>
      {STEPS.map((step, index) => <StepRow key={step.n} {...step} y={116 + index * 32} />)}
      <path d="M 374 198 H 512" stroke="var(--border-subtle)" />
      <text x={374} y={222} className={styles.panelTitle} fill="var(--text-muted)">RESULT</text>
      <text x={374} y={246} className={styles.warningText} fill="var(--visual-warning)">prompt pays prefix cost</text>
    </g>
  );
}

export default function ContextSqueezeDiagram() {
  return (
    <svg
      viewBox="0 0 560 320"
      width="100%"
      role="img"
      aria-label="Context files load before the user prompt as part of the fixed prefix. New rules first push the user prompt down to make room, then the new context tile appears above it. The prompt starts lower and receives weaker attention."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
    >
      <LensFrame />
      {PREFIX_BLOCKS.map((block) => <PrefixBlock key={block.label} {...block} />)}
      <TaskBlock />
      <PushIndicators />
      <StackBracket />
      <RightColumn />
    </svg>
  );
}
