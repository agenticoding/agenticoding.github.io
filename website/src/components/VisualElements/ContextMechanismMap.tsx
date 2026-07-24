import styles from './ContextMechanismMap.module.css';
import {
  ContextLensMetrics,
  ContextLensSubAgent,
  ContextLensWindow,
  type ContextLensBlock,
  type ContextLensMetric,
  type ContextLensMetricValue,
  type ContextLensTone,
  type ContextLensZone,
} from './ContextLensWindow';

const VIEW_W = 960;
const VIEW_H = 392;
const CARD_Y = 24;
const CARD_W = 148;
const CARD_H = 344;
const CARD_GAP = 8;
const CARD_X0 = 24;
const CARD_INSET = 16;
const CARD_CONTENT_W = CARD_W - CARD_INSET * 2;

const LENS_Y = CARD_Y + 56;
const ROW_START_Y = CARD_Y + 160;
const ROW_GAP = 48;

type Card = {
  id: string;
  title: string;
  tone: ContextLensTone;
  loads: ContextLensMetricValue;
  lands: ContextLensMetricValue;
  cost: ContextLensMetricValue;
  useFor: ContextLensMetricValue;
  mobileLoads: string;
  mobileLands: string;
  mobileZone: ContextLensZone | 'separate';
  shape: 'window' | 'subagents';
  blocks: readonly ContextLensBlock[];
};

const CARDS: readonly Card[] = [
  {
    id: 'contextFiles',
    title: 'Context Files',
    tone: 'cyan',
    loads: 'Always',
    lands: 'Primacy zone',
    cost: 'High fixed',
    useFor: ['Durable project', 'rules'],
    mobileLoads: 'Always',
    mobileLands: 'Primacy',
    mobileZone: 'primacy',
    shape: 'window',
    blocks: [{ zone: 'primacy', label: 'rules', tone: 'cyan' }],
  },
  {
    id: 'mcpSchemas',
    title: 'MCP Schemas',
    tone: 'cyan',
    loads: ['Startup /', 'deferred'],
    lands: 'Tool definitions',
    cost: 'Can be huge',
    useFor: ['External', 'operations'],
    mobileLoads: 'Start / deferred',
    mobileLands: 'Tools',
    mobileZone: 'middle',
    shape: 'window',
    blocks: [{ zone: 'middle', label: 'schemas', tone: 'cyan' }],
  },
  {
    id: 'skills',
    title: 'Skills',
    tone: 'violet',
    loads: 'On demand',
    lands: 'Recency zone',
    cost: ['Catalog +', 'expansion'],
    useFor: ['Workflow', 'expertise'],
    mobileLoads: 'On demand',
    mobileLands: 'Recency',
    mobileZone: 'recency',
    shape: 'window',
    blocks: [{ zone: 'recency', label: 'skill', tone: 'violet' }],
  },
  {
    id: 'runtime',
    title: 'Compaction',
    tone: 'neutral',
    loads: ['At phase', 'boundary'],
    lands: 'Compressed state',
    cost: 'Recall loss',
    useFor: ['Cleaner', 'reasoning'],
    mobileLoads: 'At boundary',
    mobileLands: 'State',
    mobileZone: 'middle',
    shape: 'window',
    blocks: [
      { zone: 'middle', label: 'summary', tone: 'neutral', dashed: true },
    ],
  },
  {
    id: 'subAgents',
    title: 'Sub-agents',
    tone: 'magenta',
    loads: 'Forked task',
    lands: 'Separate window',
    cost: '0 parent tokens',
    useFor: ['Isolated', 'exploration'],
    mobileLoads: 'Forked task',
    mobileLands: 'Separate',
    mobileZone: 'separate',
    shape: 'subagents',
    blocks: [],
  },
  {
    id: 'retrieval',
    title: 'Retrieval',
    tone: 'indigo',
    loads: ['Harness /', 'on demand'],
    lands: ['Primacy or', 'conversation'],
    cost: 'Per chunk tokens',
    useFor: 'Grounded facts',
    mobileLoads: 'On demand',
    mobileLands: 'Conversation',
    mobileZone: 'primacy',
    shape: 'window',
    blocks: [
      { zone: 'primacy', label: 'harness RAG', tone: 'indigo', width: 70 },
      { zone: 'recency', label: 'search', tone: 'indigo', width: 70 },
    ],
  },
] as const;

function cardX(index: number) {
  return CARD_X0 + index * (CARD_W + CARD_GAP);
}

function LensShape({ card, x }: { card: Card; x: number }) {
  if (card.shape === 'subagents') {
    return (
      <ContextLensSubAgent
        x={x + CARD_INSET}
        y={LENS_Y}
        width={CARD_CONTENT_W}
        tone={card.tone}
      />
    );
  }

  return (
    <ContextLensWindow
      x={x + CARD_INSET}
      y={LENS_Y}
      width={CARD_CONTENT_W}
      height={88}
      tone={card.tone}
      blocks={card.blocks}
    />
  );
}

const MOBILE_ZONES: readonly ContextLensZone[] = [
  'primacy',
  'middle',
  'recency',
];

function SeparateWindowMarker({
  x,
  y,
  color,
  bg,
}: {
  x: number;
  y: number;
  color: string;
  bg: string;
}) {
  return (
    <g aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={16}
        height={48}
        rx={0}
        fill="var(--surface-muted)"
        stroke="var(--border-default)"
        strokeWidth={1}
      />
      <path
        d={`M ${x + 20} ${y + 24} H ${x + 28}`}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={1}
        strokeDasharray="3 2"
      />
      <rect
        x={x + 32}
        y={y}
        width={16}
        height={48}
        rx={0}
        fill={bg}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="3 2"
      />
    </g>
  );
}

function LandingMarker({ card, x, y }: { card: Card; x: number; y: number }) {
  const color = `var(--visual-${card.tone})`;
  const bg = `var(--visual-bg-${card.tone})`;

  if (card.mobileZone === 'separate')
    return <SeparateWindowMarker x={x} y={y} color={color} bg={bg} />;

  const selectedIndex = MOBILE_ZONES.indexOf(card.mobileZone);

  return (
    <g aria-hidden="true">
      {MOBILE_ZONES.map((zone, index) => {
        const selected = zone === card.mobileZone;
        return (
          <rect
            key={zone}
            x={x}
            y={y + index * 16}
            width={48}
            height={16}
            rx={0}
            fill={selected ? bg : 'var(--surface-muted)'}
            stroke={selected ? color : 'var(--border-subtle)'}
            strokeWidth={1}
          />
        );
      })}
      <rect
        x={x}
        y={y + selectedIndex * 16}
        width={48}
        height={16}
        rx={0}
        fill="none"
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

function MobileMetric({
  label,
  value,
  x,
  y,
}: {
  label: string;
  value: string;
  x: number;
  y: number;
}) {
  return (
    <text x={x} y={y} className={styles.mobileMetric} fill="var(--text-body)">
      <tspan className={styles.mobileMetricLabel} fill="var(--text-muted)">
        {label}
      </tspan>
      <tspan dx={8}>{value}</tspan>
    </text>
  );
}

function MobileMechanismRow({ card, index }: { card: Card; index: number }) {
  const y = 32 + index * 72;
  const color = `var(--visual-${card.tone})`;

  return (
    <g>
      <rect
        x={8}
        y={y}
        width={344}
        height={64}
        rx={0}
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth={1}
      />
      <rect x={8} y={y} width={3} height={64} rx={0} fill={color} />
      <text
        x={16}
        y={y + 36}
        className={styles.mobileTitle}
        fill="var(--text-heading)"
      >
        {card.title}
      </text>
      <LandingMarker card={card} x={112} y={y + 8} />
      <MobileMetric label="LOADS" value={card.mobileLoads} x={176} y={y + 24} />
      <MobileMetric label="LANDS" value={card.mobileLands} x={176} y={y + 48} />
    </g>
  );
}

function MobileDiagram() {
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 0 360 472"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x={8}
        y={18}
        className={styles.mobileEyebrow}
        fill="var(--text-muted)"
      >
        WHEN TOKENS LOAD → WHERE THEY LAND
      </text>
      {CARDS.map((card, index) => (
        <MobileMechanismRow key={card.id} card={card} index={index} />
      ))}
    </svg>
  );
}

function metricRows(card: Card): ContextLensMetric[] {
  return [
    { label: 'Loads', value: card.loads },
    { label: 'Lands', value: card.lands },
    { label: 'Cost', value: card.cost },
    { label: 'Use for', value: card.useFor },
  ];
}

function MechanismCard({ card, index }: { card: Card; index: number }) {
  const x = cardX(index);
  const color = `var(--visual-${card.tone})`;
  const bg = `var(--visual-bg-${card.tone})`;

  return (
    <g>
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
      <rect x={x} y={CARD_Y} width={3} height={CARD_H} rx={0} fill={color} />
      <text
        x={x + CARD_INSET}
        y={CARD_Y + 26}
        className={styles.cardTitle}
        fill="var(--text-heading)"
      >
        {card.title}
      </text>
      <rect
        x={x + CARD_INSET}
        y={CARD_Y + 38}
        width={56}
        height={4}
        rx={0}
        fill={bg}
        stroke={color}
        strokeWidth={1}
      />
      <LensShape card={card} x={x} />
      <ContextLensMetrics
        rows={metricRows(card)}
        x={x + CARD_INSET}
        y={ROW_START_Y}
        rowGap={ROW_GAP}
      />
    </g>
  );
}

const ARIA_LABEL =
  'Six context mechanisms compared by when tokens load and where they land: context files load always into primacy; MCP schemas at startup or deferred into tool definitions; skills on demand near recency; compaction at a phase boundary into compressed state; sub-agents for a forked task in a separate window; and retrieval on demand into primacy or conversation.';

export default function ContextMechanismMap() {
  return (
    <div className={styles.container} role="img" aria-label={ARIA_LABEL}>
      <svg
        className={`${styles.diagram} ${styles.desktopDiagram}`}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        {CARDS.map((card, index) => (
          <MechanismCard key={card.id} card={card} index={index} />
        ))}
      </svg>
      <MobileDiagram />
    </div>
  );
}
