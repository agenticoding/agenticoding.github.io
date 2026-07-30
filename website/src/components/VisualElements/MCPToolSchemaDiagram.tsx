import { useId, useState } from 'react';
import clsx from 'clsx';
import styles from './MCPToolSchemaDiagram.module.css';
import rangeStyles from './RangeControl.module.css';
import {
  ContextRegionScene,
  ContextZoneStrip,
  type RegionTile,
  // Explicit .tsx: on case-insensitive filesystems './ContextRegions' would
  // resolve to the sibling model file contextRegions.ts.
} from './ContextRegions.tsx';
import {
  CATALOG_LIMITS,
  contextContentWeight,
  eagerSchemasZone,
  eagerRows,
  lazyRows,
  modelMCPToolSchema,
  toolSearchRoundCount,
  windowFill,
  type AttentionZone,
  type MCPContextRow,
} from './MCPToolSchemaModel';

// Tradeoff figure on the ContextRegions foundation + the shared attention
// model: each panel's window FILL (content tokens over WINDOW_CAPACITY) drives
// its zone-band shading. Tiles stay neutral; position carries attention while
// accents distinguish payload types. The catalog slider expands both eager
// schema breadth and the selected lazy subset. Both sides retain the same
// ordinary task work, while lazy visibly pays Tool Search definition, full
// search/recovery turns, and schema-expansion overhead. Wider catalogs add whole Tool Search calls plus near-match and
// false-start artifacts, unlike eager's schema mass.
//
// Each panel is one contiguous accumulation: eager has the installed-schema
// prefix; lazy has a startup Tool Search definition, prompt, search/recovery
// turns, selected schemas, task work, final response, then headroom. Zone
// membership derives from row weights via zoneOfRow — never placed.
//
// Interactive widget: motion is user-driven only. Rows resize through the
// foundation's flex-grow transitions so slider drags animate smoothly and
// inactive mix slots collapse in place. No idle animation.

const DEFAULT_CATALOG_TOOLS = 20;
const STACK_HEIGHT = 264;

// Type grammar for tile accents (tiles themselves stay neutral): cyan =
// harness payload (core tools, startup prefix, schemas), emphasis = the
// human prompt, indigo = tool-work data, default = the agent's response.
function accentFor(row: MCPContextRow): string | undefined {
  if (row.spacer) return undefined;
  if (row.id === 'prompt') return 'var(--border-emphasis)';
  if (row.id.startsWith('work-')) return 'var(--visual-indigo)';
  if (row.id === 'final') return 'var(--border-default)';
  return 'var(--visual-cyan)';
}

function toTile(row: MCPContextRow): RegionTile {
  return {
    ...row,
    accent: accentFor(row),
    labelFontFamily: 'var(--font-mono-spec)',
  };
}

type PanelTradeoff = { label: string; detail: string };

function PanelIntro({
  title,
  mobileTitle,
  tradeoff,
}: {
  title: string;
  mobileTitle: string;
  tradeoff: PanelTradeoff;
}) {
  return (
    <div className={styles.panelIntro}>
      <div className={styles.panelHeader}>
        <span className={styles.desktopTitle}>{title}</span>
        <span className={styles.mobileTitle}>{mobileTitle}</span>
      </div>
      <p className={styles.panelTradeoff}>
        <strong>{tradeoff.label}</strong> {tradeoff.detail}
      </p>
    </div>
  );
}

function ContextPanel({
  title,
  mobileTitle,
  tradeoff,
  rows,
  fillRatio,
}: {
  title: string;
  mobileTitle: string;
  tradeoff: PanelTradeoff;
  rows: readonly RegionTile[];
  fillRatio: number;
}) {
  return (
    <section className={styles.panel}>
      <PanelIntro title={title} mobileTitle={mobileTitle} tradeoff={tradeoff} />
      <ContextRegionScene
        rows={rows}
        fallbackHeight={STACK_HEIGHT}
        fillRatio={fillRatio}
        className={styles.stackClip}
        stackClassName={styles.stack}
        companionClassName={styles.zoneStrip}
        renderCompanion={(frame) => (
          <ContextZoneStrip
            fillRatio={fillRatio}
            frame={frame}
            ariaLabel={`Attention zones for the ${title} context`}
          />
        )}
      />
    </section>
  );
}

function CatalogPanel({
  total,
  relevant,
}: {
  total: number;
  relevant: number;
}) {
  return (
    <section className={clsx(styles.panel, styles.catalogPanel)}>
      <div className={styles.panelHeader}>installed catalog</div>
      <div className={styles.catalogPipe} aria-hidden="true" />
      <div className={styles.catalogBody}>
        <div className={styles.catalogCount}>× {total} schemas</div>
        <div className={styles.meter}>
          <div
            className={styles.meterCatalog}
            style={{ width: `${(total / CATALOG_LIMITS.max) * 100}%` }}
          />
          <div
            className={styles.meterLoaded}
            style={{ width: `${(relevant / CATALOG_LIMITS.max) * 100}%` }}
          />
        </div>
        <div className={styles.meterLabels}>
          <span className={styles.catalogLoadedLabel}>
            {relevant} in context
          </span>
          <span className={styles.catalogDeferred}>
            {total - relevant} stay out
          </span>
        </div>
      </div>
    </section>
  );
}

function comparisonMessage(
  eager: readonly MCPContextRow[],
  lazy: readonly MCPContextRow[]
) {
  const difference = Math.round(
    contextContentWeight(eager) - contextContentWeight(lazy)
  );
  if (difference > 0)
    return {
      label: `Eager +${difference} ${difference === 1 ? 'unit' : 'units'}`,
      message: `Eager carries ${difference} more context units.`,
    };
  if (difference < 0)
    return {
      label: `Lazy +${-difference} ${difference === -1 ? 'unit' : 'units'}`,
      message: `Lazy discovery adds ${-difference} context units.`,
    };
  return {
    label: 'Equal context mass',
    message: 'Both traces carry the same context mass.',
  };
}

function attentionZoneDescription(zone: AttentionZone) {
  return (
    {
      primacy: 'high-attention start',
      middle: 'low-attention middle',
      recency: 'high-attention end',
    } satisfies Record<AttentionZone, string>
  )[zone];
}

function countLabel(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function searchRoundSummary(rounds: number) {
  const recoveryLoops = rounds - 1;
  return `${countLabel(rounds, 'Tool Search round')}; ${countLabel(recoveryLoops, 'recovery loop')} from near matches and false starts`;
}

function ariaSummary(
  catalogTools: number,
  relevant: number,
  deferred: number,
  schemasZone: AttentionZone,
  searchRounds: number,
  comparison: string
) {
  return `This representative task uses ${relevant} capabilities. Eager loading holds ${catalogTools} schemas between core tools and the user prompt; the definitions sit in the ${attentionZoneDescription(schemasZone)}. Lazy loading adds the Tool Search definition, then ${searchRoundSummary(searchRounds)}, before ${relevant} expanded schemas, the same ordinary tool work, and the final response; ${deferred} schemas stay outside the context window. ${comparison}`;
}

export default function MCPToolSchemaDiagram() {
  const catalogId = useId();
  const [catalogTools, setCatalogTools] = useState(DEFAULT_CATALOG_TOOLS);
  const layout = modelMCPToolSchema(catalogTools);
  const eagerModel = eagerRows(catalogTools);
  const lazyModel = lazyRows(catalogTools);
  const schemasZone = eagerSchemasZone(catalogTools);
  const searchRounds = toolSearchRoundCount(catalogTools);
  const comparison = comparisonMessage(eagerModel, lazyModel);
  const recoveryLoops = searchRounds - 1;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <label
          className={`${rangeStyles.row} ${styles.catalogControl}`}
          htmlFor={catalogId}
        >
          <span className={rangeStyles.label}>Installed MCP catalog</span>
          <span className={rangeStyles.control}>
            <input
              id={catalogId}
              type="range"
              min={CATALOG_LIMITS.min}
              max={CATALOG_LIMITS.max}
              value={catalogTools}
              onChange={(event) => setCatalogTools(Number(event.target.value))}
              className={rangeStyles.slider}
            />
          </span>
          <strong className={`${rangeStyles.value} ${styles.catalogValue}`}>
            {catalogTools} schemas
          </strong>
        </label>
        <div className={styles.relevanceNote}>
          <strong>{layout.lazySchemas.length} task schemas</strong>
          <span>load after Tool Search</span>
          <span>{countLabel(searchRounds, 'Tool Search round')}</span>
          <span>{countLabel(recoveryLoops, 'recovery loop')}</span>
          <span>{layout.deferredSchemas} stay out</span>
          <span className={styles.comparisonNote}>{comparison.label}</span>
        </div>
      </div>
      <div className={styles.panels}>
        <ContextPanel
          title="EAGER — SCHEMAS FIRST"
          mobileTitle="EAGER"
          tradeoff={{
            label: 'small + hot',
            detail: '— no discovery.',
          }}
          rows={eagerModel.map((row) => toTile(row))}
          fillRatio={windowFill(eagerModel)}
        />
        <ContextPanel
          title="LAZY — PROMPT FIRST"
          mobileTitle="LAZY"
          tradeoff={{
            label: 'broad + sparse',
            detail: '— defer the rest.',
          }}
          rows={lazyModel.map((row) => toTile(row))}
          fillRatio={windowFill(lazyModel)}
        />
        <CatalogPanel
          total={catalogTools}
          relevant={layout.lazySchemas.length}
        />
      </div>
      <p className={styles.liveRegion} aria-live="polite">
        {ariaSummary(
          catalogTools,
          layout.lazySchemas.length,
          layout.deferredSchemas,
          schemasZone,
          searchRounds,
          comparison.message
        )}
      </p>
    </div>
  );
}
