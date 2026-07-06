import type { ReactNode } from 'react';
import styles from './MCPToolSchemaDiagram.module.css';
import { ContextLensMetrics, ContextLensWindow, type ContextLensMetric } from './ContextLensWindow';

const VW = 816;
const VH = 500;

const CARD_Y = 32;
const CARD_W = 352;
const CARD_H = 432;
const LEFT_X = 48;
const RIGHT_X = 416;
const PAD = 24;

type LoadingMode = 'eager' | 'deferred';

type CardSpec = {
  mode: LoadingMode;
  x: number;
  title: string;
  subtitle: string;
  rows: ContextLensMetric[];
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

function ContextWindow({ mode, x, y }: { mode: LoadingMode; x: number; y: number }) {
  const blocks = mode === 'eager'
    ? [
        { zone: 'primacy' as const, label: 'schemas', tone: 'indigo' as const },
        { zone: 'middle' as const, label: 'user task', tone: 'neutral' as const },
      ]
    : [
        { zone: 'primacy' as const, label: 'ToolSearch', tone: 'indigo' as const },
        { zone: 'middle' as const, label: 'user task', tone: 'neutral' as const },
        { zone: 'recency' as const, label: 'schema', tone: 'indigo' as const, dashed: true },
      ];

  return <ContextLensWindow x={x} y={y} width={136} height={104} tone="indigo" blocks={blocks} />;
}

function AnnotationStack({ mode, x, y }: { mode: LoadingMode; x: number; y: number }) {
  const lines = mode === 'eager'
    ? ['schemas consume primacy', 'task starts lower', 'call is already known']
    : ['catalog stays compact', 'task stays near top', 'schema enters at runtime'];

  return (
    <g aria-hidden="true">
      {lines.map((line, index) => (
        <g key={line}>
          <circle cx={x} cy={y + index * 24} r={4} fill={index === 2 ? 'var(--visual-indigo)' : 'var(--text-muted)'} />
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
      <rect x={x} y={y} width={w} height={32} rx={0} fill={semantic ? 'var(--visual-bg-indigo)' : 'var(--surface-page)'} stroke={semantic ? 'var(--visual-indigo)' : 'var(--border-default)'} strokeWidth={1.5} />
      <SvgText x={x + w / 2} y={y + 16} anchor="middle" baseline="middle" className={styles.behaviorLabel} fill={semantic ? 'var(--visual-indigo)' : 'var(--text-body)'}>
        {label}
      </SvgText>
    </g>
  );
}

function BehaviorArrow({ x1, x2, y, semantic = false }: { x1: number; x2: number; y: number; semantic?: boolean }) {
  return (
    <path d={`M ${x1} ${y} C ${x1 + 8} ${y}, ${x2 - 8} ${y}, ${x2} ${y}`} fill="none" stroke={semantic ? 'var(--visual-indigo)' : 'var(--text-muted)'} strokeWidth={1.5} strokeLinecap="butt" markerEnd={semantic ? 'url(#arrowIndigo)' : 'url(#arrowNeutral)'} aria-hidden="true" />
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

function LoadingCard({ card }: { card: CardSpec }) {
  const { x, mode } = card;
  const contentX = x + PAD;

  return (
    <g>
      <rect x={x} y={CARD_Y} width={CARD_W} height={CARD_H} rx={0} fill="var(--surface-raised)" stroke="var(--border-default)" strokeWidth={1} />
      <rect x={x} y={CARD_Y} width={3} height={CARD_H} rx={0} fill="var(--visual-indigo)" />

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

      <ContextLensMetrics rows={card.rows} x={contentX} y={CARD_Y + 328} columns={2} columnGap={160} rowGap={40} />
    </g>
  );
}

export default function MCPToolSchemaDiagram() {
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
        <marker id="arrowNeutral" viewBox="0 0 6 6" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--text-muted)" />
        </marker>
        <marker id="arrowIndigo" viewBox="0 0 6 6" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--visual-indigo)" />
        </marker>
      </defs>

      {CARDS.map((card) => (
        <LoadingCard key={card.mode} card={card} />
      ))}

      <SvgText x={VW / 2} y={488} anchor="middle" className={styles.rule} fill="var(--text-body)">
        Small + frequent → eager. Large + occasional → deferred.
      </SvgText>
    </svg>
  );
}
