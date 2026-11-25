import type { ReactNode } from 'react';

import styles from './Figure.module.css';

type FigureShellProps = {
  /** The machine rail's contents: one target, in every figure. */
  rail: ReactNode;
  /** The rail's accessible name; absent only where the rail draws no group. */
  railLabel: string;
  /** The one sentence a lever changes, announced and never laid out. */
  speech: string;
  /** The table and its key: the band that answers the question. */
  answer: ReactNode;
  /** A caveat the figure's own numbers cannot state; absent when they can. */
  footnote?: ReactNode;
  /** Prefix of this figure's contract hooks; the shell adds its own speech. */
  dataAttr: string;
  /** A figure's own hooks on the root, beside the shared one. */
  rootProps?: Record<string, string | number | undefined>;
  /** The controls: the drawing, the levers, and the runtime strip. */
  children: ReactNode;
};

/**
 * Three regions: the rail sets the machine, the master carries the controls,
 * and the answer band carries the table. The rail stands beside the master
 * where there is room and above it where there is not; the answer spans the
 * figure at every width, so the table is as wide as the card and never leaves
 * the rail's column empty under its chips.
 *
 * WHY the shell owns the band: the answer's width is a property of the figure,
 * not of either question. Two figures ask different questions about one
 * machine, and both read their table on the same measure.
 */
export function FigureShell({
  rail,
  railLabel,
  speech,
  answer,
  dataAttr,
  footnote,
  rootProps,
  children,
}: FigureShellProps) {
  return (
    <div className={styles.explorer} data-figure-root="" {...rootProps}>
      {/* The region's name is for assistive tech; the group captions inside it
          name every part, so a visible title would repeat them. */}
      <section
        className={styles.rail}
        aria-label={railLabel}
        data-figure-rail=""
      >
        {rail}
      </section>

      <div className={styles.master} data-figure-master="">
        {/* The visible page states the same numbers chip by chip and row by
            row; this sentence is the one a lever changes, for a reader who
            cannot see those. */}
        <p
          className={styles.liveRegion}
          role="status"
          data-figure-speech=""
          {...{ [`${dataAttr}-speech`]: '' }}
        >
          {speech}
        </p>
        {children}
      </div>

      {/* The answer is read against the whole card, so it never shares a row
          with the rail. */}
      <div className={styles.answer} data-figure-answer="">
        {answer}
      </div>

      {/* A caveat exists only where the figure's own bands cannot state the
          fact, so the page stays silent when they already do. */}
      {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
    </div>
  );
}
