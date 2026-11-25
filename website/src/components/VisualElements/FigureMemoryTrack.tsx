import clsx from 'clsx';

import type { MemoryBounds } from './figureTypes.ts';
import { readerBudget } from './figureCatalog.ts';
import styles from './Figure.module.css';

/** The three areas a fitting workload occupies, in GiB. */
export type TrackZones = {
  weights: number;
  cache: number;
  os: number;
};

/** The key a legend line draws. `none` is the plain key the uncoloured zone
 * carries; `breakdown` swaps the key for a sentence, for a row that states a
 * composition instead of an area. */
export type TrackKeyTone = 'none' | 'cache' | 'os' | 'covered' | 'over';

export type TrackKey = {
  tone?: TrackKeyTone;
  text: string;
  breakdown?: boolean;
};

type MemoryTrackProps = {
  bounds: MemoryBounds;
  /** The reader's budget; null follows the machine's own ceiling. */
  budgetGib: number | null;
  /** Sets the budget and draws the handle. Omitted, the strip is read-only:
   * the machine's budget is a fact of the rail, not a setting. */
  onBudget?: (gib: number) => void;
  /** Head label while the machine can hold the workload. */
  label: string;
  /** Head label when the need exceeds the machine: it names the need's basis. */
  overfullLabel: string;
  /** The areas this figure's workload occupies. */
  zones: TrackZones;
  /** The legend the fitting state prints: weights, cache, machine reserve. */
  keys: readonly TrackKey[];
  /** The legend the overfull state prints: what is held, what is not, and the
   * need's own composition. */
  overfullKeys: readonly TrackKey[];
  /** Prints the head's number and unit, e.g. `22 GiB`. */
  value: (gib: number) => string;
  /** The machine's published facts, one quiet line. */
  facts: readonly string[];
  /** The one sentence a reserved row can carry; null leaves the row empty. */
  note: string | null;
  /** Prefix of this figure's contract hooks, e.g. `data-fit`. */
  dataAttr: string;
};

/**
 * The memory track: the whole machine, with the two ends it cannot spend shaded
 * and labelled. The thumb is the budget every row is tested against, so the
 * number is the reader's, never the page's assumption.
 *
 * When the need exceeds the machine there is no budget to set. The strip then
 * answers the only question left — how much of the need fits — and colours the
 * part it cannot hold, so the failure is read from the bar instead of from a
 * mark inside it. The handle goes away rather than promising a range with one
 * value.
 *
 * WHY the zones arrive as numbers: the machine is shared, the workload is not.
 * The track draws what it is handed and owns no arithmetic of its own beyond
 * the shares it paints.
 *
 * Nothing here changes the panel's height with the workload: both states fill
 * the same three key rows, so a track that outgrows its machine cannot move the
 * levers below it.
 *
 * Two figures draw this strip: the chat figure sets the budget with the handle,
 * the classifier figure takes the machine's own. Without a handle the budget is
 * still marked — a rule at its end — so the head's number has a position rather
 * than a length the reader has to trust.
 */
export function FigureMemoryTrack({
  bounds,
  budgetGib,
  onBudget,
  label,
  overfullLabel,
  zones,
  keys,
  overfullKeys,
  value: valueText,
  facts,
  note,
  dataAttr,
}: MemoryTrackProps) {
  const value = readerBudget(bounds, budgetGib);
  // Percentages of the strip's own scale: the printed capacity while the machine
  // can hold the workload, the workload's need once it cannot.
  const overfull = bounds.overfull;
  const scaleGib = overfull ? bounds.floorGib : bounds.trackGib;
  const share = (gib: number) => Math.max(0, Math.min(1, gib / scaleGib)) * 100;
  // The fitting state's three areas. An outgrown workload overflows the strip;
  // the cache keeps its share of what is drawn, so the size its key prints is
  // never painted over by the weights.
  const os = share(zones.os);
  const floor = Math.min(share(bounds.floorGib), 100 - os);
  const cache = Math.min(share(zones.cache), floor);
  const weights = Math.max(0, floor - cache);
  // The overfull state's two areas: what the machine holds, and the rest.
  const covered = share(bounds.maxGib);
  const short = 100 - covered;
  const width = (percent: number) => `${percent}%`;
  const attr = (name: string) => `${dataAttr}-${name}`;
  // Hooks carry a stable number: a GiB computed from tokens ends in float noise.
  const fixed = (gib: number) => String(Number(gib.toFixed(2)));
  const keyClass: Record<TrackKeyTone, string | undefined> = {
    none: undefined,
    cache: styles.zoneKeyCache,
    os: styles.zoneKeyOs,
    covered: styles.zoneKeyCovered,
    over: styles.zoneKeyOver,
  };

  return (
    <section
      className={styles.budget}
      aria-label={overfull ? overfullLabel : label}
      {...{
        // The contract reads the state from the panel, never by parsing prose.
        [attr('overfull')]: overfull ? '' : undefined,
        // The panel's own arithmetic, so its words and its strip are checked
        // against one pair of numbers rather than against each other's rounding.
        [attr('need')]: fixed(bounds.floorGib),
        [attr('supply')]: String(bounds.maxGib),
        [attr('track')]: String(bounds.trackGib),
        // The two ends of the need, as the keys print them: one contract can
        // then check the words against the areas they name.
        [attr('weights')]: fixed(zones.weights),
        [attr('cache')]: fixed(zones.cache),
        [attr('memory-axis')]: '',
      }}
    >
      <div className={styles.budgetHead}>
        <span className={styles.budgetLabel}>
          {overfull ? overfullLabel : label}
        </span>
        {/* The head states the strip's whole length: the budget the rows are
            tested against, or the need an overfull strip fills. */}
        <span
          className={styles.budgetValue}
          {...{
            [attr('head-value')]: '',
            [attr('budget-value')]: overfull ? undefined : '',
          }}
        >
          {valueText(overfull ? bounds.floorGib : value)}
        </span>
      </div>
      {/* One scale for the strip and the handle while the machine can hold the
          workload: the input spans the whole machine, and the ends the zones
          reserve are out of reach by clamping. Overfull, the same strip answers
          how much of the need fits and the handle has no range to offer. */}
      <div className={styles.track}>
        <div className={styles.zones} aria-hidden="true">
          {overfull ? (
            <>
              {/* The colour change is the ceiling: no rule, no mark, one
                  reading a reader takes without a legend. */}
              <span
                className={clsx(styles.zone, styles.zoneCovered)}
                style={{ width: width(covered) }}
                {...{ [attr('zone')]: '' }}
              />
              <span
                className={clsx(styles.zone, styles.zoneOver)}
                style={{ width: width(short) }}
                {...{ [attr('zone')]: '' }}
              />
            </>
          ) : (
            <>
              <span
                className={clsx(styles.zone, styles.zoneWeights)}
                style={{ width: width(weights) }}
                {...{ [attr('zone')]: '' }}
              />
              <span
                className={clsx(styles.zone, styles.zoneCache)}
                style={{ width: width(cache) }}
                {...{ [attr('zone')]: '' }}
              />
              <span className={clsx(styles.zone, styles.zoneFree)} />
              <span
                className={clsx(styles.zone, styles.zoneOs)}
                style={{ width: width(os) }}
              />
            </>
          )}
          {/* No handle: the budget still has an edge, so the head's number is a
              position on the strip and not a second length beside it. */}
          {onBudget === undefined && !overfull ? (
            <span
              className={styles.budgetMark}
              style={{ insetInlineStart: width(share(bounds.maxGib)) }}
              {...{ [attr('budget-mark')]: '' }}
            />
          ) : null}
        </div>
        {overfull || onBudget === undefined ? null : (
          <input
            className={styles.budgetRange}
            type="range"
            min={0}
            max={bounds.trackGib}
            step={bounds.stepGib}
            value={value}
            aria-label={label}
            {...{
              [attr('budget')]: '',
              [attr('value')]: String(value),
              [attr('floor')]: String(bounds.minGib),
              [attr('ceiling')]: String(bounds.maxGib),
            }}
            onChange={(event) =>
              onBudget?.(
                Math.min(
                  bounds.maxGib,
                  Math.max(bounds.minGib, Number(event.currentTarget.value))
                )
              )
            }
          />
        )}
      </div>
      <ul className={styles.budgetZones}>
        {(overfull ? overfullKeys : keys).map((key) =>
          key.breakdown ? (
            <li className={styles.zoneBreakdown} key={key.text}>
              {key.text}
            </li>
          ) : (
            <li key={key.text}>
              <span
                className={clsx(styles.zoneKey, keyClass[key.tone ?? 'none'])}
                aria-hidden="true"
              />
              {key.text}
            </li>
          )
        )}
      </ul>
      <p className={styles.budgetFacts}>{facts.join(' · ')}</p>
      {/* The one case the scale cannot draw, in a row reserved in every state:
          a sentence that appeared would add a line to the panel and move every
          row below it. */}
      <p className={styles.budgetNote} {...{ [attr('note')]: '' }}>
        {note ? (
          <span key={note} className={styles.stateText}>
            {note}
          </span>
        ) : null}
      </p>
    </section>
  );
}
