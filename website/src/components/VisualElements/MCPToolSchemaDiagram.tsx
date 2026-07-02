import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './MCPToolSchemaDiagram.module.css';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';
import { useMounted } from '../../hooks/useMounted';

const VW = 816;
const VH = 568;

const CARD_Y = 80;
const CARD_W = 352;
const CARD_H = 432;
const LEFT_X = 48;
const RIGHT_X = 416;
const PAD = 24;

// SVG equivalents of design-system radius tokens.

const ACTS = [
  { id: 'frame', threshold: 0.0 },
  // The diagram must be complete even when anchor navigation lands directly here.
  { id: 'cards', threshold: 0.0 },
  { id: 'rule', threshold: 0.0 },
] as const;

type LoadingMode = 'eager' | 'deferred';

type LensRow = {
  label: string;
  value: string;
};

type CardSpec = {
  mode: LoadingMode;
  x: number;
  title: string;
  subtitle: string;
  rows: LensRow[];
};

const CARDS: CardSpec[] = [
  {
    mode: 'eager',
    x: LEFT_X,
    title: 'Eager loading',
    subtitle: 'full schemas at startup',
    rows: [
      { label: 'Loads', value: 'Startup' },
      { label: 'Lands', value: 'Primacy before task' },
      { label: 'Cost', value: 'High fixed' },
      { label: 'Use for', value: 'Small hot toolsets' },
      { label: 'Fails when', value: 'Catalog buries task' },
    ],
  },
  {
    mode: 'deferred',
    x: RIGHT_X,
    title: 'Deferred loading',
    subtitle: 'search first, schema later',
    rows: [
      { label: 'Loads', value: 'Search first' },
      { label: 'Lands', value: 'Startup + runtime' },
      { label: 'Cost', value: 'Extra hop' },
      { label: 'Use for', value: 'Large broad catalogs' },
      { label: 'Fails when', value: 'Discovery is poor' },
    ],
  },
];

function SvgText({ x, y, children, className, fill = 'var(--text-body)', anchor = 'start', baseline }: {
  x: number;
  y: number;
  children: ReactNode;
  className: string;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  baseline?: 'middle';
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline={baseline} className={className} fill={fill}>
      {children}
    </text>
  );
}

function ContextBlock({
  x,
  y,
  w,
  h,
  label,
  semantic = false,
  dashed = false,
  className,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  semantic?: boolean;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <g aria-hidden="true" className={className}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={0}
        fill={semantic ? 'var(--visual-bg-cyan)' : 'var(--surface-raised)'}
        stroke={semantic ? 'var(--visual-cyan)' : 'var(--border-default)'}
        strokeWidth={semantic ? 1.5 : 1}
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      <SvgText x={x + w / 2} y={y + h / 2} anchor="middle" baseline="middle" className={styles.windowLabel} fill={semantic ? 'var(--visual-cyan)' : 'var(--text-body)'}>
        {label}
      </SvgText>
    </g>
  );
}

function ContextWindow({ mode, x, y }: { mode: LoadingMode; x: number; y: number }) {
  const windowW = 136;
  const windowH = 104;

  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={windowW} height={windowH} rx={0} fill="var(--surface-page)" stroke="var(--border-default)" strokeWidth={1} />

      {mode === 'eager' ? (
        <>
          <ContextBlock x={x + 16} y={y + 16} w={104} h={40} label="MCP schemas" semantic className={clsx(styles.schemaPulse, 'idle-alternating-emphasis')} />
          <ContextBlock x={x + 16} y={y + 72} w={104} h={24} label="user task" className={clsx(styles.taskPulse, 'idle-alternating-emphasis')} />
        </>
      ) : (
        <>
          <ContextBlock x={x + 16} y={y + 8} w={104} h={24} label="ToolSearch" semantic />
          <ContextBlock x={x + 16} y={y + 40} w={104} h={24} label="user task" className={clsx(styles.taskPulse, 'idle-alternating-emphasis')} />
          <ContextBlock x={x + 16} y={y + 72} w={104} h={24} label="schema later" semantic dashed className={clsx(styles.schemaPulse, 'idle-alternating-emphasis')} />
        </>
      )}
    </g>
  );
}

function AnnotationStack({ mode, x, y }: { mode: LoadingMode; x: number; y: number }) {
  const lines = mode === 'eager'
    ? ['schemas consume primacy', 'task starts lower', 'call is already known']
    : ['catalog stays compact', 'task stays near top', 'schema enters at runtime'];

  return (
    <g aria-hidden="true">
      {lines.map((line, index) => (
        <g key={line}>
          <circle cx={x} cy={y + index * 24} r={4} fill={index === 2 ? 'var(--visual-cyan)' : 'var(--text-muted)'} />
          <SvgText x={x + 16} y={y + index * 24} baseline="middle" className={styles.annotation} fill="var(--text-body)">
            {line}
          </SvgText>
        </g>
      ))}
    </g>
  );
}

function BehaviorNode({ x, y, w, label, semantic = false }: { x: number; y: number; w: number; label: string; semantic?: boolean }) {
  return (
    <g aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={w}
        height={32}
        rx={0}
        fill={semantic ? 'var(--visual-bg-cyan)' : 'var(--surface-page)'}
        stroke={semantic ? 'var(--visual-cyan)' : 'var(--border-default)'}
        strokeWidth={1.5}
      />
      <SvgText x={x + w / 2} y={y + 16} anchor="middle" baseline="middle" className={styles.behaviorLabel} fill={semantic ? 'var(--visual-cyan)' : 'var(--text-body)'}>
        {label}
      </SvgText>
    </g>
  );
}

function BehaviorArrow({ x1, x2, y, semantic = false }: { x1: number; x2: number; y: number; semantic?: boolean }) {
  return (
    <path
      d={`M ${x1} ${y} C ${x1 + 8} ${y}, ${x2 - 8} ${y}, ${x2} ${y}`}
      fill="none"
      stroke={semantic ? 'var(--visual-cyan)' : 'var(--text-muted)'}
      strokeWidth={1.5}
      strokeLinecap="round"
      markerEnd={semantic ? 'url(#arrowCyan)' : 'url(#arrowNeutral)'}
      aria-hidden="true"
    />
  );
}

function BehaviorPath({ mode, x, y }: { mode: LoadingMode; x: number; y: number }) {
  if (mode === 'eager') {
    return (
      <g>
        <BehaviorNode x={x} y={y} w={96} label="Plan" />
        <BehaviorArrow x1={x + 104} x2={x + 128} y={y + 16} semantic />
        <BehaviorNode x={x + 136} y={y} w={128} label="Call directly" semantic />
      </g>
    );
  }

  return (
    <g>
      <BehaviorNode x={x} y={y} w={48} label="Plan" />
      <BehaviorArrow x1={x + 56} x2={x + 72} y={y + 16} />
      <BehaviorNode x={x + 80} y={y} w={64} label="Search" semantic />
      <BehaviorArrow x1={x + 152} x2={x + 168} y={y + 16} semantic />
      <BehaviorNode x={x + 176} y={y} w={48} label="Load" semantic />
      <BehaviorArrow x1={x + 232} x2={x + 248} y={y + 16} semantic />
      <BehaviorNode x={x + 256} y={y} w={48} label="Call" semantic />
    </g>
  );
}

function LensRows({ rows, x, y }: { rows: LensRow[]; x: number; y: number }) {
  const positions = [
    [0, 0],
    [160, 0],
    [0, 40],
    [160, 40],
    [0, 80],
  ] as const;

  return (
    <g>
      {rows.map((row, index) => {
        const [dx, dy] = positions[index];
        return (
          <g key={row.label}>
            <SvgText x={x + dx} y={y + dy} className={styles.rowLabel} fill="var(--text-muted)">
              {row.label}
            </SvgText>
            <SvgText x={x + dx} y={y + dy + 16} className={styles.rowValue} fill="var(--text-body)">
              {row.value}
            </SvgText>
          </g>
        );
      })}
    </g>
  );
}

function LoadingCard({ card, reached }: { card: CardSpec; reached: boolean }) {
  const { x, mode } = card;
  const contentX = x + PAD;

  return (
    <g className={clsx(styles.card, reached && styles.cardIn)}>
      <rect
        x={x}
        y={CARD_Y}
        width={CARD_W}
        height={CARD_H}
        rx={0}
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth={1}
      />
      <rect x={x} y={CARD_Y} width={3} height={CARD_H} rx={0} fill="var(--visual-cyan)" />

      <SvgText x={contentX} y={CARD_Y + 32} className={styles.cardTitle} fill="var(--text-heading)">
        {card.title}
      </SvgText>
      <SvgText x={contentX} y={CARD_Y + 56} className={styles.cardSubtitle} fill="var(--text-muted)">
        {card.subtitle}
      </SvgText>

      <SvgText x={contentX} y={CARD_Y + 88} className={styles.sectionLabel} fill="var(--text-muted)">
        Context mechanics
      </SvgText>
      <ContextWindow mode={mode} x={contentX} y={CARD_Y + 104} />
      <AnnotationStack mode={mode} x={x + 192} y={CARD_Y + 128} />

      <SvgText x={x + CARD_W / 2} y={CARD_Y + 224} anchor="middle" className={styles.causalCue} fill="var(--text-muted)">
        Context shape ↓ behavior
      </SvgText>

      <SvgText x={contentX} y={CARD_Y + 248} className={styles.sectionLabel} fill="var(--text-muted)">
        Resulting behavior
      </SvgText>
      <BehaviorPath mode={mode} x={contentX} y={CARD_Y + 264} />

      <LensRows rows={card.rows} x={contentX} y={CARD_Y + 328} />
    </g>
  );
}

export default function MCPToolSchemaDiagram() {
  const phase = useStaticAnimationPhase();
  const mounted = useMounted();
  const { wasReached } = useActs(ACTS, phase);

  const frame = !mounted || wasReached('frame');
  const cards = !mounted || wasReached('cards');
  const rule = !mounted || wasReached('rule');

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label="MCP schema loading comparison. Eager loading places full MCP schemas in the primacy zone before the user task, so the agent can plan and call directly but pays high fixed context cost. Deferred loading places only ToolSearch up front, keeps the user task nearer the top, then searches, loads a schema at runtime, and calls the tool."
      className={styles.diagram}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: `${VW}px`, margin: '0 auto' }}
    >
      <defs>
        <marker id="arrowNeutral" viewBox="0 0 6 6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--text-muted)" />
        </marker>
        <marker id="arrowCyan" viewBox="0 0 6 6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--visual-cyan)" />
        </marker>
      </defs>

      <SvgText x={VW / 2} y={32} anchor="middle" className={clsx(styles.title, frame && styles.titleIn)} fill="var(--text-heading)">
        MCP schemas change context shape before they change behavior
      </SvgText>
      <SvgText x={VW / 2} y={56} anchor="middle" className={clsx(styles.kicker, frame && styles.kickerIn)} fill="var(--text-body)">
        Where tool definitions land determines whether the agent calls directly or searches first.
      </SvgText>

      {CARDS.map((card) => (
        <LoadingCard key={card.mode} card={card} reached={cards} />
      ))}

      <SvgText x={VW / 2} y={544} anchor="middle" className={clsx(styles.rule, rule && styles.ruleIn)} fill="var(--text-body)">
        Small + frequent → eager. Large + occasional → deferred.
      </SvgText>
    </svg>
  );
}
