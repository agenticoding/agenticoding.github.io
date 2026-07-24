import { useId, useState } from 'react';
import styles from './MCPToolSchemaDiagram.module.css';
import lensStyles from './ContextLensWindow.module.css';
import {
  ContextLensFrame,
  ContextLensZoneLabels,
  toneBg,
  toneColor,
  type ContextLensTone,
} from './ContextLensWindow';
import { modelMCPToolSchema } from './MCPToolSchemaModel';

const MIN_CATALOG_TOOLS = 4;
const MAX_CATALOG_TOOLS = 40;
const DEFAULT_CATALOG_TOOLS = 20;
const WINDOW = { y: 32, width: 248, height: 408 } as const;
const BLOCK_X_OFFSET = 12;
const BLOCK_WIDTH = 166;
const BLOCK_HEIGHT = 18;

type BlockTone = Extract<
  ContextLensTone,
  'cyan' | 'indigo' | 'violet' | 'neutral'
>;

type ContextBlock = {
  label: string;
  y: number;
  tone: BlockTone;
  dashed?: boolean;
  height?: number;
  shift?: number;
  className?: string;
  hidden?: boolean;
};

function Label({ x, children }: { x: number; children: string }) {
  return (
    <text x={x} y={16} className={styles.lensTitle}>
      {children}
    </text>
  );
}

function Block({
  x,
  label,
  y,
  tone,
  dashed,
  height = BLOCK_HEIGHT,
  shift = 0,
  className,
  hidden,
}: ContextBlock & { x: number }) {
  return (
    <g
      aria-hidden={hidden || undefined}
      className={`${styles.contextBlock} ${className ?? ''}`}
      style={{ transform: shift ? `translateY(${shift}px)` : undefined }}
    >
      <rect
        x={x + BLOCK_X_OFFSET}
        y={y}
        width={BLOCK_WIDTH}
        height={height}
        rx={0}
        fill={toneBg(tone)}
        stroke={toneColor(tone)}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      <text
        x={x + BLOCK_X_OFFSET + 8}
        y={y + 12}
        className={lensStyles.blockLabel}
        fill={toneColor(tone)}
      >
        {label}
      </text>
    </g>
  );
}

function Panel({
  x,
  title,
  blocks,
  footer,
}: {
  x: number;
  title: string;
  blocks: readonly ContextBlock[];
  footer?: string;
}) {
  return (
    <g>
      <Label x={x}>{title}</Label>
      <ContextLensFrame x={x} {...WINDOW} />
      <ContextLensZoneLabels x={x} {...WINDOW} />
      {blocks.map((block, index) => (
        <Block key={`${block.label}-${index}`} x={x} {...block} />
      ))}
      {footer ? (
        <text
          x={x + BLOCK_X_OFFSET}
          y={WINDOW.y + WINDOW.height + 22}
          className={styles.detailText}
        >
          {footer}
        </text>
      ) : null}
    </g>
  );
}

function eagerBlocks(catalogTools: number): ContextBlock[] {
  const schemaHeight =
    28 +
    ((catalogTools - MIN_CATALOG_TOOLS) /
      (MAX_CATALOG_TOOLS - MIN_CATALOG_TOOLS)) *
      72;
  const push = schemaHeight - 28;

  return [
    { label: 'core tools', y: WINDOW.y + 12, tone: 'cyan' },
    {
      label: `installed schemas × ${catalogTools}`,
      y: WINDOW.y + 38,
      height: schemaHeight,
      tone: 'indigo',
    },
    {
      label: 'USER PROMPT',
      y: WINDOW.y + 104,
      tone: 'neutral',
      dashed: true,
      shift: push,
    },
    { label: 'tool call', y: WINDOW.y + 132, tone: 'cyan', shift: push },
    { label: 'tool result', y: WINDOW.y + 160, tone: 'indigo', shift: push },
    {
      label: 'current agent prompt',
      y: WINDOW.y + 272,
      tone: 'neutral',
      dashed: true,
      shift: push,
    },
  ];
}

function lazyBlocks(relevantSchemas: number): ContextBlock[] {
  const cycles = Array.from({ length: 4 }, (_, index) => {
    const y = WINDOW.y + 76 + index * 72;
    const hidden = index >= relevantSchemas;
    const className = hidden ? styles.lazyHidden : styles.lazyVisible;

    return [
      {
        label: `Tool Search query ${index + 1}`,
        y,
        tone: 'violet' as const,
        className,
        hidden,
      },
      {
        label: `loaded schema ${index + 1}`,
        y: y + 20,
        tone: 'violet' as const,
        className,
        hidden,
      },
      {
        label: 'tool call + result',
        y: y + 40,
        tone: 'cyan' as const,
        className,
        hidden,
      },
      {
        label: 'follow-up prompt',
        y: y + 60,
        tone: 'neutral' as const,
        dashed: true,
        className,
        hidden,
      },
    ];
  });

  return [
    { label: 'Tool Search + core tools', y: WINDOW.y + 12, tone: 'cyan' },
    { label: 'USER PROMPT', y: WINDOW.y + 46, tone: 'neutral', dashed: true },
    ...cycles.flat(),
    {
      label: 'current agent prompt',
      y: WINDOW.y + 384,
      tone: 'neutral',
      dashed: true,
    },
  ];
}

function Diagram({
  catalogTools,
  relevantSchemas,
  deferredSchemas,
  mobile = false,
}: {
  catalogTools: number;
  relevantSchemas: number;
  deferredSchemas: number;
  mobile?: boolean;
}) {
  const label = `Eager loading puts ${catalogTools} schemas before the user prompt. Lazy Tool Search starts with the user prompt, then appends discovery, ${relevantSchemas} loaded schemas, a tool call, result, and later prompts; ${deferredSchemas} schemas remain outside the context.`;

  return (
    <svg
      className={`${styles.diagram} ${mobile ? styles.mobileDiagram : styles.desktopDiagram}`}
      viewBox={mobile ? '0 0 280 940' : '0 0 600 480'}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Panel
        x={32}
        title="EAGER — STARTUP"
        blocks={eagerBlocks(catalogTools)}
      />
      {mobile ? (
        <g transform="translate(-304 476)">
          <Panel
            x={320}
            title="LAZY TOOL SEARCH"
            blocks={lazyBlocks(relevantSchemas)}
            footer={`${deferredSchemas} schemas stay deferred`}
          />
        </g>
      ) : (
        <Panel
          x={320}
          title="LAZY TOOL SEARCH"
          blocks={lazyBlocks(relevantSchemas)}
          footer={`${deferredSchemas} schemas stay deferred`}
        />
      )}
    </svg>
  );
}

export default function MCPToolSchemaDiagram() {
  const catalogId = useId();
  const [catalogTools, setCatalogTools] = useState(DEFAULT_CATALOG_TOOLS);
  const layout = modelMCPToolSchema(catalogTools);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <label className={styles.catalogControl} htmlFor={catalogId}>
          <span>Installed MCP catalog</span>
          <strong>{catalogTools} schemas</strong>
          <input
            id={catalogId}
            type="range"
            min={MIN_CATALOG_TOOLS}
            max={MAX_CATALOG_TOOLS}
            value={catalogTools}
            onChange={(event) => setCatalogTools(Number(event.target.value))}
          />
        </label>
        <p className={styles.relevanceNote}>
          <strong>{layout.lazySchemas.length} relevant schemas</strong> enter
          after the prompt; {layout.deferredSchemas} stay out of context.
        </p>
      </div>
      <Diagram
        catalogTools={catalogTools}
        relevantSchemas={layout.lazySchemas.length}
        deferredSchemas={layout.deferredSchemas}
      />
      <Diagram
        catalogTools={catalogTools}
        relevantSchemas={layout.lazySchemas.length}
        deferredSchemas={layout.deferredSchemas}
        mobile
      />
      <p className={styles.liveRegion} aria-live="polite">
        Eager loading puts {catalogTools} schemas before the user prompt. Tool
        Search loads {layout.lazySchemas.length} relevant schemas after it and
        leaves {layout.deferredSchemas} deferred.
      </p>
    </div>
  );
}
