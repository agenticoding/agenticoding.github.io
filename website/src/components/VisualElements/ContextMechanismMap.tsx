import styles from './ContextMechanismMap.module.css';
import { ContextLensMetrics, ContextLensSubAgent, ContextLensWindow, type ContextLensBlock, type ContextLensMetric, type ContextLensMetricValue, type ContextLensTone } from './ContextLensWindow';

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
    shape: 'window',
    blocks: [{ zone: 'middle', label: 'summary', tone: 'neutral', dashed: true }],
  },
  {
    id: 'subAgents',
    title: 'Sub-agents',
    tone: 'magenta',
    loads: 'Forked task',
    lands: 'Separate window',
    cost: '0 parent tokens',
    useFor: ['Isolated', 'exploration'],
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
    return <ContextLensSubAgent x={x + CARD_INSET} y={LENS_Y} width={CARD_CONTENT_W} tone={card.tone} />;
  }

  return <ContextLensWindow x={x + CARD_INSET} y={LENS_Y} width={CARD_CONTENT_W} height={88} tone={card.tone} blocks={card.blocks} />;
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
      <rect x={x} y={CARD_Y} width={CARD_W} height={CARD_H} rx={0} fill="var(--surface-raised)" stroke="var(--border-default)" strokeWidth={1} />
      <rect x={x} y={CARD_Y} width={3} height={CARD_H} rx={0} fill={color} />
      <text x={x + CARD_INSET} y={CARD_Y + 26} className={styles.cardTitle} fill="var(--text-heading)">{card.title}</text>
      <rect x={x + CARD_INSET} y={CARD_Y + 38} width={56} height={4} rx={0} fill={bg} stroke={color} strokeWidth={1} />
      <LensShape card={card} x={x} />
      <ContextLensMetrics rows={metricRows(card)} x={x + CARD_INSET} y={ROW_START_Y} rowGap={ROW_GAP} />
    </g>
  );
}

export default function ContextMechanismMap() {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      role="img"
      aria-label="Six context mechanisms shown through the same context-window lens: context files land in primacy, retrieval injects grounded facts via harness RAG or tool-call search, MCP schemas land as tool definitions, skills expand near recency, compaction creates compressed state, and sub-agents use a separate context window with zero parent tokens."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '960px', margin: '0 auto' }}
    >
      {CARDS.map((card, index) => (
        <MechanismCard key={card.id} card={card} index={index} />
      ))}
    </svg>
  );
}
