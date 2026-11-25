import type { CSSProperties } from 'react';

import { formatGib } from './figureCatalog.ts';
import { VISUALLY_HIDDEN } from './visuallyHidden.ts';
import styles from './Figure.module.css';

/**
 * The memory column's ruler: one row's whole footprint at its share of the
 * budget the page priced it against. Length compares, the number states — so the
 * bar never replaces the figure beside it.
 *
 * WHY one ink: the footprint is one number, and the parts that build it — the
 * weights, the workload's cache, a drafter — are stated once where they do not
 * repeat (the figure's memory strip above the table, the row's own detail, the
 * read-out's arithmetic). A segment per part reused one tone for two different
 * meanings, drew a model-free cache once per row, and left most rows with no
 * second segment at all.
 *
 * WHY shared: both model tables make the same claim about the same quantity, and
 * two implementations would let one drift into a different scale. A `null` need
 * draws nothing: a card that publishes no size has no share to draw.
 *
 * A need past the budget keeps the ruler full and adds the strip's own
 * "cannot hold" hatch at its end. The drawing never carries that claim alone:
 * the same sentence reaches a reader who cannot see it.
 */
export function FigureMemoryBar({
  need,
  budgetGib,
}: {
  /** The row's own footprint in GiB; null when no source states one. */
  need: number | null;
  /** The budget every row is tested against: the bar's own scale. */
  budgetGib: number;
}) {
  // A budget the rows were priced against is positive by construction; the
  // guard keeps a zero from becoming a division in the stylesheet.
  if (need === null || budgetGib <= 0) return null;
  const over = need > budgetGib;
  const style = {
    '--memory-bar-need': Math.min(1, need / budgetGib),
  } as CSSProperties;
  return (
    <>
      <span
        className={styles.memoryBar}
        style={style}
        aria-hidden="true"
        {...{
          'data-memory-bar-need': need,
          'data-memory-bar-over': over ? '' : undefined,
        }}
      >
        <span className={styles.memoryBarFill} />
        {over ? <span className={styles.memoryBarOver} /> : null}
      </span>
      {over ? (
        <span style={VISUALLY_HIDDEN}>needs more than this machine holds</span>
      ) : null}
    </>
  );
}

/**
 * The ruler's key: the one scale both bars are drawn against, and the one mark
 * the drawing adds. The budget is the reader's own, so it changes with the
 * machine; the sentence follows it instead of naming a fixed number.
 */
export function FigureMemoryLegend({ budgetGib }: { budgetGib: number }) {
  return (
    <p
      className={styles.memoryLegend}
      {...{
        'data-memory-legend': '',
        'data-memory-budget': budgetGib,
      }}
    >
      Bar: share of the {formatGib(budgetGib)} GiB this machine can spend · a
      hatched end means the model needs more.
    </p>
  );
}
