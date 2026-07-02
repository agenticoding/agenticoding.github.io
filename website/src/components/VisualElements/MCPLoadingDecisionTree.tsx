import styles from './MCPLoadingDecisionTree.module.css';

const W = 720;
const H = 296;

function Label({ x, y, text, className, fill = 'var(--text-body)', anchor = 'middle' }: {
  x: number;
  y: number;
  text: string;
  className: string;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className={className} fill={fill}>
      {text}
    </text>
  );
}

function MultilineLabel({ x, y, lines, className, fill = 'var(--text-body)', anchor = 'middle', lineGap = 18 }: {
  x: number;
  y: number;
  lines: string[];
  className: string;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  lineGap?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className={className} fill={fill}>
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? 0 : lineGap}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Node({ x, y, w, h, lines, semantic = false }: {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  semantic?: boolean;
}) {
  const centerY = y + h / 2 - (lines.length - 1) * 9;

  return (
    <g aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={0}
        fill={semantic ? 'var(--visual-bg-cyan)' : 'var(--surface-raised)'}
        stroke={semantic ? 'var(--visual-cyan)' : 'var(--border-default)'}
        strokeWidth={1.5}
      />
      <MultilineLabel
        x={x + w / 2}
        y={centerY}
        lines={lines}
        className={styles.nodeLabel}
        fill={semantic ? 'var(--visual-cyan)' : 'var(--text-heading)'}
      />
    </g>
  );
}

export default function MCPLoadingDecisionTree() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Decision tree for choosing MCP loading mode. Few tools and hot-path actions favor eager loading. Large or multi-server catalogs favor deferred loading. If only a few actions are hot inside a large catalog, expose a thin wrapper eagerly and defer the rest."
      className={styles.diagram}
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: `${W}px` }}
    >
      <defs>
        <marker id="mcp-tree-arrow" viewBox="0 0 6 6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--text-muted)" />
        </marker>
      </defs>

      <Label x={W / 2} y={24} text="Choose the loading mode by catalog shape" className={styles.title} fill="var(--text-heading)" />

      <Node x={240} y={56} w={240} h={48} lines={["How big is the", "tool catalog?"]} />

      <path d="M 360 104 C 360 128, 216 128, 216 152" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" markerEnd="url(#mcp-tree-arrow)" />
      <path d="M 360 104 C 360 128, 504 128, 504 152" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeLinecap="round" markerEnd="url(#mcp-tree-arrow)" />
      <Label x={248} y={128} text="few tools" className={styles.edgeLabel} />
      <Label x={472} y={128} text="many tools / many servers" className={styles.edgeLabel} />

      <Node x={104} y={152} w={224} h={48} lines={["Use eager loading"]} semantic />
      <Node x={392} y={152} w={224} h={48} lines={["Use deferred loading"]} semantic />

      <MultilineLabel x={216} y={222} lines={["Schemas stay resident;", "calls stay simple."]} className={styles.note} lineGap={16} />
      <MultilineLabel x={504} y={216} lines={["Protect the task from", "schema pressure."]} className={styles.note} lineGap={16} />
      <MultilineLabel x={504} y={248} lines={["Search and load only", "when needed."]} className={styles.note} lineGap={16} />

      <path d="M 504 200 L 504 256" fill="none" stroke="var(--visual-cyan)" strokeWidth={1.5} strokeDasharray="4 4" />
      <path d="M 504 256 C 504 272, 360 272, 360 272" fill="none" stroke="var(--visual-cyan)" strokeWidth={1.5} strokeDasharray="4 4" markerEnd="url(#mcp-tree-arrow)" />
      <Label x={104} y={272} text="Large catalog, but only a few actions are hot?" className={styles.edgeLabel} anchor="start" fill="var(--visual-cyan)" />
      <Label x={104} y={288} text="Expose a thin wrapper eagerly; defer the rest." className={styles.note} anchor="start" fill="var(--visual-cyan)" />
    </svg>
  );
}
