import { ResponsiveDiagram } from './ResponsiveDiagram';
import styles from './ContextMechanismMap.module.css';
import {
  ContextLensMetrics,
  type ContextLensBlock,
  type ContextLensMetric,
  type ContextLensMetricValue,
  type ContextLensTone,
  type ContextLensZone,
} from './ContextLensWindow';
import {
  CONTEXT_MECHANISM_LAYOUT,
  CONTEXT_MECHANISM_VISUAL,
  contextMechanismCardX,
  contextMechanismGeometry,
  contextMechanismTileY,
} from './contextMechanismMapModel';

const VIEW_H = 392;
const CARD_Y = 24;
const CARD_H = 344;
const {
  viewWidth: VIEW_W,
  cardWidth: CARD_W,
  cardInset: CARD_INSET,
} = CONTEXT_MECHANISM_LAYOUT;
const { contextWidth: CARD_CONTENT_W } = contextMechanismGeometry;

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
  separateWindow?: boolean;
  blocks: readonly ContextLensBlock[];
};

type MechanismTileLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function mechanismColor(tone: ContextLensTone) {
  return `var(--visual-${tone})`;
}

function mechanismBg(tone: ContextLensTone) {
  return `var(--visual-bg-${tone})`;
}

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
    separateWindow: true,
    blocks: [{ zone: 'primacy', label: 'forked task', tone: 'magenta' }],
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
    blocks: [
      { zone: 'primacy', label: 'harness RAG', tone: 'indigo' },
      { zone: 'recency', label: 'search', tone: 'indigo' },
    ],
  },
] as const;

function MechanismZoneBands({ x }: { x: number }) {
  return contextMechanismGeometry.zones.map((band) => (
    <rect
      key={band.zone}
      x={x}
      y={LENS_Y + band.y}
      width={CARD_CONTENT_W}
      height={band.height}
      rx={0}
      fill={CONTEXT_MECHANISM_VISUAL.zoneFill[band.zone]}
      opacity={CONTEXT_MECHANISM_VISUAL.zoneOpacity[band.zone]}
    />
  ));
}

function MechanismZoneSeparators({ x }: { x: number }) {
  return contextMechanismGeometry.zones
    .slice(1)
    .map((band) => (
      <line
        key={band.zone}
        x1={x}
        y1={LENS_Y + band.y}
        x2={x + CARD_CONTENT_W}
        y2={LENS_Y + band.y}
        stroke={CONTEXT_MECHANISM_VISUAL.separatorStroke}
        strokeWidth={1}
      />
    ));
}

function MechanismFrameOutline({ card, x }: { card: Card; x: number }) {
  const stroke = card.separateWindow
    ? mechanismColor(card.tone)
    : 'var(--border-default)';
  return (
    <rect
      x={x}
      y={LENS_Y}
      width={CARD_CONTENT_W}
      height={CONTEXT_MECHANISM_LAYOUT.lensHeight}
      rx={0}
      fill="none"
      stroke={stroke}
      strokeWidth={1}
      strokeDasharray={card.separateWindow ? '4 3' : undefined}
    />
  );
}

function MechanismFrame({ card, x }: { card: Card; x: number }) {
  return (
    <>
      <MechanismZoneBands x={x} />
      <MechanismZoneSeparators x={x} />
      <MechanismFrameOutline card={card} x={x} />
    </>
  );
}

function mechanismTileLayout(block: ContextLensBlock, x: number) {
  return {
    x: x + CONTEXT_MECHANISM_LAYOUT.tileInset,
    y: LENS_Y + contextMechanismTileY(block.zone),
    width: contextMechanismGeometry.tileWidth,
    height: CONTEXT_MECHANISM_LAYOUT.tileHeight,
  };
}

function MechanismTileRect({
  block,
  color,
  layout,
}: {
  block: ContextLensBlock;
  color: string;
  layout: MechanismTileLayout;
}) {
  return (
    <rect
      {...layout}
      rx={0}
      fill="var(--surface-page)"
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray={block.dashed ? '4 3' : undefined}
    />
  );
}

function MechanismTileLabel({
  block,
  color,
  layout,
}: {
  block: ContextLensBlock;
  color: string;
  layout: MechanismTileLayout;
}) {
  return (
    <text
      x={layout.x + layout.width / 2}
      y={layout.y + layout.height / 2 + 3}
      textAnchor="middle"
      className={styles.blockLabel}
      fill={color}
    >
      {block.label}
    </text>
  );
}

function MechanismTile({
  block,
  fallbackTone,
  x,
}: {
  block: ContextLensBlock;
  fallbackTone: ContextLensTone;
  x: number;
}) {
  const color = mechanismColor(block.tone ?? fallbackTone);
  const layout = mechanismTileLayout(block, x);
  return (
    <g>
      <MechanismTileRect block={block} color={color} layout={layout} />
      <MechanismTileLabel block={block} color={color} layout={layout} />
    </g>
  );
}

function LensShape({ card, x }: { card: Card; x: number }) {
  const lensX = x + CARD_INSET;
  return (
    <g aria-hidden="true">
      <MechanismFrame card={card} x={lensX} />
      {card.blocks.map((block, index) => (
        <MechanismTile
          key={`${block.zone}-${index}`}
          block={block}
          fallbackTone={card.tone}
          x={lensX}
        />
      ))}
    </g>
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
  const color = mechanismColor(card.tone);
  const bg = mechanismBg(card.tone);

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
  const color = mechanismColor(card.tone);

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
  const x = contextMechanismCardX(index);
  const color = mechanismColor(card.tone);
  const bg = mechanismBg(card.tone);

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
    <ResponsiveDiagram
      className={styles.container}
      breakpoint="560px"
      mode="container"
      ariaLabel={ARIA_LABEL}
      desktop={
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
      }
      mobile={<MobileDiagram />}
    />
  );
}
