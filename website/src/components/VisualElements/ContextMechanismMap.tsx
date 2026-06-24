import styles from './ContextMechanismMap.module.css';

const VIEW_W = 960;
const VIEW_H = 408;
const CARD_Y = 56;
const CARD_W = 176;
const CARD_H = 328;
const CARD_GAP = 8;
const CARD_X0 = 24;

const THUMB_Y = CARD_Y + 56;
const THUMB_W = 144;
const THUMB_H = 64;
const ROW_START_Y = CARD_Y + 144;
const ROW_GAP = 48;

// Design system border-radius tokens (px values for SVG rx attributes)

const CARDS = [
  {
    id: 'contextFiles',
    title: 'Context Files',
    color: 'cyan',
    loads: 'Always',
    lands: 'Primacy zone',
    cost: 'High fixed',
    useFor: 'Durable project rules',
    thumbnail: 'primacy',
  },
  {
    id: 'mcpSchemas',
    title: 'MCP Schemas',
    color: 'indigo',
    loads: 'Startup / deferred',
    lands: 'Tool definitions',
    cost: 'Can be huge',
    useFor: 'External operations',
    thumbnail: 'tools',
  },
  {
    id: 'skills',
    title: 'Skills',
    color: 'violet',
    loads: 'On demand',
    lands: 'Recency zone',
    cost: 'Catalog always, instructions on demand',
    useFor: 'Workflow expertise',
    thumbnail: 'recency',
  },
  {
    id: 'runtime',
    title: 'Context Compaction',
    color: 'neutral',
    loads: 'At phase boundary',
    lands: 'Compressed state',
    cost: 'Recall loss',
    useFor: 'Cleaner reasoning',
    thumbnail: 'runtime',
  },
  {
    id: 'subAgents',
    title: 'Sub-agents',
    color: 'magenta',
    loads: 'Forked task',
    lands: 'Separate window',
    cost: '0 parent tokens',
    useFor: 'Isolated exploration',
    thumbnail: 'subagents',
  },
] as const;



type Card = (typeof CARDS)[number];
type Thumbnail = Card['thumbnail'];

function cardX(index: number) {
  return CARD_X0 + index * (CARD_W + CARD_GAP);
}

function ContextThumbnail({ card, x, y, delay }: { card: Card; x: number; y: number; delay: number }) {
  const color = `var(--visual-${card.color})`;
  const bg = `var(--visual-bg-${card.color})`;

  if (card.thumbnail === 'subagents') {
    return (
      <g aria-hidden="true">
        <rect x={x} y={y + 8} width={76} height={48} rx={0} fill="var(--surface-page)" stroke="var(--border-default)" strokeWidth={1} />
        <rect x={x + 10} y={y + 18} width={56} height={7} rx={0} fill="var(--surface-muted)" />
        <rect x={x + 10} y={y + 30} width={40} height={7} rx={0} fill="var(--surface-muted)" />
        <path d={`M ${x + 82} ${y + 32} C ${x + 92} ${y + 24}, ${x + 96} ${y + 24}, ${x + 104} ${y + 24}`} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" />
        <rect x={x + 104} y={y + 8} width={40} height={48} rx={0} fill={bg} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" className="idle-landing-glow" style={{ animationDelay: `${delay}ms` }} />
        <text x={x + 124} y={y + 38} textAnchor="middle" className={styles.zeroLabel} fill={color}>0</text>
      </g>
    );
  }

  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={THUMB_W} height={THUMB_H} rx={0} fill="var(--surface-page)" stroke="var(--border-default)" strokeWidth={1} />
      <rect x={x + 10} y={y + 10} width={124} height={10} rx={0} fill="var(--surface-muted)" />
      <rect x={x + 10} y={y + 26} width={124} height={10} rx={0} fill="var(--surface-muted)" />
      <rect x={x + 10} y={y + 42} width={124} height={10} rx={0} fill="var(--surface-muted)" />
      {renderHighlight(card.thumbnail, x, y, color, bg, delay)}
    </g>
  );
}

function renderHighlight(kind: Thumbnail, x: number, y: number, color: string, bg: string, delay: number) {
  switch (kind) {
    case 'primacy':
      return <rect x={x + 10} y={y + 10} width={124} height={10} rx={0} fill={bg} stroke={color} strokeWidth={1.5} className="idle-landing-glow" style={{ animationDelay: `${delay}ms` }} />;
    case 'tools':
      return <rect x={x + 10} y={y + 26} width={124} height={10} rx={0} fill={bg} stroke={color} strokeWidth={1.5} className="idle-landing-glow" style={{ animationDelay: `${delay}ms` }} />;
    case 'recency':
      return <rect x={x + 10} y={y + 42} width={124} height={10} rx={0} fill={bg} stroke={color} strokeWidth={1.5} className="idle-landing-glow" style={{ animationDelay: `${delay}ms` }} />;
    case 'runtime':
      return (
        <g className="idle-landing-glow" style={{ animationDelay: `${delay}ms` }}>
          <rect x={x + 10} y={y + 26} width={124} height={26} rx={0} fill="transparent" stroke={color} strokeWidth={1.5} strokeDasharray="5 3" />
          <path d={`M ${x + 24} ${y + 21} L ${x + 24} ${y + 57} M ${x + 120} ${y + 21} L ${x + 120} ${y + 57}`} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

function LensRows({ card, x }: { card: Card; x: number }) {
  const rows = [
    ['Loads', card.loads],
    ['Lands', card.lands],
    ['Cost', card.cost],
    ['Use for', card.useFor],
  ] as const;

  return (
    <g>
      {rows.map(([label, value], index) => {
        const y = ROW_START_Y + index * ROW_GAP;
        return (
          <g key={label}>
            <text x={x + 16} y={y} className={styles.rowLabel} fill="var(--text-muted)">{label}</text>
            <text x={x + 16} y={y + 16} className={styles.rowValue} fill="var(--text-body)">{value}</text>
          </g>
        );
      })}
    </g>
  );
}

function MechanismCard({
  card,
  index,
}: {
  card: Card;
  index: number;
}) {
  const x = cardX(index);
  const color = `var(--visual-${card.color})`;
  const bg = `var(--visual-bg-${card.color})`;
  const delay = index * 600;

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
      <rect x={x} y={CARD_Y} width={3} height={CARD_H} rx={0} fill={color} className="idle-landing-glow" style={{ animationDelay: `${delay}ms` }} />
      <text x={x + 16} y={CARD_Y + 26} className={styles.cardTitle} fill="var(--text-heading)">{card.title}</text>
      <rect x={x + 16} y={CARD_Y + 38} width={56} height={4} rx={0} fill={bg} stroke={color} strokeWidth={1} />
      <ContextThumbnail card={card} x={x + 16} y={THUMB_Y} delay={delay} />
      <LensRows card={card} x={x} />
    </g>
  );
}

export default function ContextMechanismMap() {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="Five equal cards compare context files, MCP schemas, skills, runtime management, and sub-agents through the same four lenses: when each loads, where it lands in context, parent-context cost, and best-fit use."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '960px', margin: '0 auto' }}
    >
      <text x={VIEW_W / 2} y={28} textAnchor="middle" className={styles.figureTitle} fill="var(--text-heading)">
        Five Mechanisms, Same Lens
      </text>

      {CARDS.map((card, index) => (
        <MechanismCard key={card.id} card={card} index={index} />
      ))}
    </svg>
  );
}
