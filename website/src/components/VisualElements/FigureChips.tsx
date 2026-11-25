import type { ReactNode } from 'react';

import { engineCount, onlyHereText } from './figureCopy.ts';
import styles from './Figure.module.css';

type ChipProps = {
  label: string;
  /** Fits the choice promises: the rows the same click leaves. Absent where a
   * lever filters a set rather than pricing a promise. */
  count?: number;
  /** Checkpoints the runtime covers: the count's denominator. Absent on a rail
   * chip, whose every option is scoped to the same model set. */
  coverage?: number;
  /** Read out instead of the visible label + count, which would run together. */
  spoken?: string;
  selected: boolean;
  /** Tooltip: the fact the printed number cannot carry. */
  reason?: string;
  /** Checkpoints this runtime holds that no general-purpose runtime holds. */
  reach?: number;
  onSelect: () => void;
};

export function Chip({
  label,
  count,
  coverage,
  spoken,
  selected,
  reason,
  reach = 0,
  onSelect,
}: ChipProps) {
  return (
    <button
      type="button"
      className={styles.chip}
      aria-label={spoken}
      aria-pressed={selected}
      title={reason}
      onClick={onSelect}
    >
      {label}
      {count === undefined && coverage === undefined ? null : (
        <span className={styles.chipCount} aria-hidden="true">
          {' · '}
          {coverage === undefined || count === undefined
            ? count
            : engineCount(count, coverage)}
        </span>
      )}
      {reach > 0 ? (
        <span className={styles.chipWhy} aria-hidden="true">
          {' · '}
          {onlyHereText(reach)}
        </span>
      ) : null}
    </button>
  );
}

export function ChipGroup({
  label,
  note,
  /** A stable hook for the group's reserved rail, so the stylesheet never
   * keys off the human label. */
  kind,
  empty = false,
  children,
}: {
  label: string;
  /** The group's own sentence, read before its chips: what the numbers mean.
   * With no members it states the absence the reserved rail would leave. */
  note?: string;
  kind?: string;
  /** The group lists nothing: `note` is its absence, not a legend. */
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.chipGroup}
      role="group"
      aria-label={label}
      data-chip-group={kind}
    >
      <p className={styles.chipLabel}>{label}</p>
      {note ? (
        <p
          className={styles.groupNote}
          data-chip-empty={empty ? '' : undefined}
        >
          {note}
        </p>
      ) : null}
      <div className={styles.chipRail}>{children}</div>
    </div>
  );
}
