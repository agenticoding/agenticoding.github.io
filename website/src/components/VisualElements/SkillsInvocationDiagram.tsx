import { useId, useState } from 'react';
import clsx from 'clsx';
import styles from './SkillsInvocationDiagram.module.css';
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
  autoRows,
  contextContentWeight,
  discardedSkillZone,
  manualRows,
  matchedSkillZone,
  modelSkillsInvocation,
  windowFill,
  type AttentionZone,
  type SkillsContextRow,
} from './SkillsInvocationModel';

// Tradeoff figure on the ContextRegions foundation + the shared attention
// model: each panel's window FILL (content tokens over WINDOW_CAPACITY) drives
// its zone-band shading. Tiles stay neutral; position carries attention while
// accents distinguish payload types. The catalog slider grows the discovery
// metadata both prefixes carry; the procedure bodies stay out until something
// activates them. Only the AUTO panel carries wrong-path rows, because the
// manual path cannot mis-select — that is the whole tradeoff this section
// makes: reliability versus friction, priced in wrong-path artifacts. The
// near match is unconditional: a direct match reproduces the manual trace
// exactly, so the figure shows the risk the auto path actually prices.
//
// Each panel is one contiguous accumulation: core tools, skill metadata,
// prompt, the activated procedure, ordinary task work, final response, then
// headroom. Zone membership derives from row weights via zoneOfRow — never
// placed.
//
// Interactive widget: motion is user-driven only. Rows resize through the
// foundation's flex-grow transitions so slider drags animate smoothly and
// wrong-path rows collapse in place. No idle animation.

const DEFAULT_CATALOG_SKILLS = 6;
const STACK_HEIGHT = 264;

// Type grammar for tile accents (tiles themselves stay neutral): cyan =
// harness payload (core tools, discovery metadata), emphasis = the human
// prompt, violet = expanded procedures (matched or discarded), indigo =
// tool-work data including the false start, default = the agent's response.
function accentFor(row: SkillsContextRow): string | undefined {
  if (row.spacer) return undefined;
  if (row.id === 'prompt') return 'var(--border-emphasis)';
  if (row.id.startsWith('skill') || row.id === 'near-match')
    return 'var(--visual-violet)';
  if (row.id.startsWith('work-') || row.id === 'false-start')
    return 'var(--visual-indigo)';
  if (row.id === 'final') return 'var(--border-default)';
  return 'var(--visual-cyan)';
}

function toTile(row: SkillsContextRow): RegionTile {
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
  loaded,
  metadata,
}: {
  total: number;
  loaded: number;
  metadata: number;
}) {
  return (
    <section className={clsx(styles.panel, styles.catalogPanel)}>
      <div className={styles.panelHeader}>installed skills</div>
      <div className={styles.catalogPipe} aria-hidden="true" />
      <div className={styles.catalogBody}>
        <div className={styles.catalogCount}>× {total} procedures</div>
        <div className={styles.meter}>
          <div
            className={styles.meterCatalog}
            style={{ width: `${(total / CATALOG_LIMITS.max) * 100}%` }}
          />
          <div
            className={styles.meterLoaded}
            style={{ width: `${(loaded / CATALOG_LIMITS.max) * 100}%` }}
          />
        </div>
        <div className={styles.meterLabels}>
          <span className={styles.catalogLoadedLabel}>
            {countLabel(loaded, 'procedure')} in context
          </span>
          <span className={styles.catalogDeferred}>
            {total - loaded} stay out
          </span>
        </div>
        <p className={styles.catalogMeta}>
          metadata × {total} ({metadata} units) sits in every prefix
        </p>
      </div>
    </section>
  );
}

// The wrong pick is the only difference between the two traces: a discarded
// procedure body plus the false-start turn it produced.
function comparisonMessage(
  manual: readonly SkillsContextRow[],
  auto: readonly SkillsContextRow[]
) {
  const difference = contextContentWeight(auto) - contextContentWeight(manual);
  return {
    label: `Auto +${difference} units`,
    message: `The wrong pick leaves ${difference} extra context units behind.`,
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

function ariaSummary(
  catalogSkills: number,
  loaded: number,
  skillZone: AttentionZone,
  comparison: string
) {
  return `${catalogSkills} installed skills advertise discovery metadata in both prefixes; ${loaded} of ${catalogSkills} procedure bodies are in context, the rest stay outside the window. Manual invocation expands the operator's procedure right after the prompt, where it sits in the ${attentionZoneDescription(skillZone)}. Model matching picks a near match first: a discarded procedure body and a false-start turn land in the ${attentionZoneDescription(discardedSkillZone(catalogSkills))} before the correct procedure loads, and they stay there. ${comparison}`;
}

export default function SkillsInvocationDiagram() {
  const catalogId = useId();
  const [catalogSkills, setCatalogSkills] = useState(DEFAULT_CATALOG_SKILLS);
  const layout = modelSkillsInvocation(catalogSkills);
  const manualModel = manualRows(catalogSkills);
  const autoModel = autoRows(catalogSkills);
  const skillZone = matchedSkillZone(catalogSkills);
  const comparison = comparisonMessage(manualModel, autoModel);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <label
          className={`${rangeStyles.row} ${styles.catalogControl}`}
          htmlFor={catalogId}
        >
          <span className={rangeStyles.label}>Installed skills</span>
          <span className={rangeStyles.control}>
            <input
              id={catalogId}
              type="range"
              min={CATALOG_LIMITS.min}
              max={CATALOG_LIMITS.max}
              value={catalogSkills}
              onChange={(event) => setCatalogSkills(Number(event.target.value))}
              className={rangeStyles.slider}
            />
          </span>
          <strong className={`${rangeStyles.value} ${styles.catalogValue}`}>
            {catalogSkills} skills
          </strong>
        </label>
        <div className={styles.relevanceNote}>
          <strong>{layout.metadataWeight} metadata units</strong>
          <span>in both prefixes</span>
          <span>{countLabel(layout.loadedProcedures, 'procedure')} loaded</span>
          <span>{layout.deferredProcedures} stay out</span>
          <span className={styles.comparisonNote}>{comparison.label}</span>
        </div>
      </div>
      <div className={styles.panels}>
        <ContextPanel
          title="MANUAL — OPERATOR INVOKED"
          mobileTitle="MANUAL"
          tradeoff={{
            label: 'reliable',
            detail: '— no matching step.',
          }}
          rows={manualModel.map((row) => toTile(row))}
          fillRatio={windowFill(manualModel)}
        />
        <ContextPanel
          title="AUTO — MODEL MATCHED"
          mobileTitle="AUTO"
          tradeoff={{
            label: 'zero friction',
            detail: '— probabilistic.',
          }}
          rows={autoModel.map((row) => toTile(row))}
          fillRatio={windowFill(autoModel)}
        />
        <CatalogPanel
          total={catalogSkills}
          loaded={layout.loadedProcedures}
          metadata={layout.metadataWeight}
        />
      </div>
      <p className={styles.liveRegion} aria-live="polite">
        {ariaSummary(
          catalogSkills,
          layout.loadedProcedures,
          skillZone,
          comparison.message
        )}
      </p>
    </div>
  );
}
