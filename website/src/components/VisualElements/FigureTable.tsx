import clsx from 'clsx';
import type { CSSProperties, ReactNode } from 'react';

import { useDetailFlight } from './useDetailFlight.ts';
import styles from './Figure.module.css';

/** One column of the head. The mark column is the table's own, so it is not
 * listed here: every figure reserves it. */
export type FigureColumn = {
  label: string;
  /** Grid track width, e.g. `minmax(0, 1fr)` or `5.75rem`. */
  width: string;
  /** Folds away on a narrow card, where the row's second line carries the fact.
   * The cell under it is the figure's own to hide. */
  fold?: boolean;
  /** `end` puts the head over a right-aligned number instead of a left-aligned
   * cell. */
  align?: 'end';
};

export type FigureTableProps<TRow> = {
  /** The head's words, in the same order the rows print their cells. */
  columns: readonly FigureColumn[];
  /** The template a narrow card uses, when a folded column frees its width. */
  narrowWidths?: readonly string[];
  /** The mark column, which every figure reserves. */
  markWidth?: string;
  rows: readonly TRow[];
  rowId: (row: TRow) => string;
  /** The one open row; the table opens only what the reader clicked. */
  expandedId: string | null;
  onSelect: (id: string) => void;
  /** The lab mark: `FigureMark` falls back to an initial tile, so the column
   * is never empty. */
  renderMark: (row: TRow) => ReactNode;
  /** The name cell's content: a name, and the line that gives it a basis. */
  renderName: (row: TRow) => ReactNode;
  /** One element per column after the name, in that order. */
  renderCells: (row: TRow) => ReactNode;
  /** The evidence panel under the open row; the row owns this node. */
  renderDetail: (row: TRow, detailId: string) => ReactNode;
  /** Data attributes a figure's contracts read on the row, never styling. */
  rowProps?: (row: TRow) => Record<string, string | undefined>;
  /** A figure's own hook on the table, beside the shared one. */
  rootProps?: Record<string, string | undefined>;
  /** Prefix of the panel's id, so two tables on one page never collide. */
  detailIdPrefix: string;
  headLabel?: (column: FigureColumn) => string;
};

/**
 * One row of a figure table: mark, name with the line that bases it, the
 * figure's own cells, and the panel that opens under it. The list holds only
 * rows the figure claims, so a row never needs a status word of its own.
 */
function FigureRow<TRow>({
  row,
  id,
  detailId,
  expanded,
  onSelect,
  renderMark,
  renderName,
  renderCells,
  renderDetail,
  rowProps,
}: {
  row: TRow;
  id: string;
  detailId: string;
  expanded: boolean;
  onSelect: (id: string) => void;
  renderMark: (row: TRow) => ReactNode;
  renderName: (row: TRow) => ReactNode;
  renderCells: (row: TRow) => ReactNode;
  renderDetail: (row: TRow, detailId: string) => ReactNode;
  rowProps?: (row: TRow) => Record<string, string | undefined>;
}) {
  const detail = useDetailFlight(expanded);
  return (
    <li className={styles.row} data-figure-row="" {...rowProps?.(row)}>
      <button
        type="button"
        className={clsx(styles.rowButton, detail.drawn && styles.rowFocused)}
        aria-expanded={expanded}
        // The panel only exists while expanded, so never point at a ghost.
        aria-controls={expanded ? detailId : undefined}
        onClick={() => onSelect(id)}
      >
        {/* One mark slot per row, so every name starts on one line. */}
        <span className={styles.mark}>{renderMark(row)}</span>
        <span className={styles.nameCell}>{renderName(row)}</span>
        {renderCells(row)}
      </button>
      {/* Master-detail: the row is the summary, its evidence opens beneath it.
          The frame is described where it is styled (`.detailFrame`). */}
      {detail.drawn ? (
        <div
          className={clsx(
            styles.detailFrame,
            detail.closing && styles.detailClosing
          )}
          {...detail.frameProps}
        >
          {renderDetail(row, detailId)}
        </div>
      ) : null}
    </li>
  );
}

/**
 * The figure table: one column geometry for the head and every row, so the
 * numbers stay in one line of sight down the list.
 *
 * WHY the head is not a real `table` element: each row is a disclosure control,
 * complete in itself, so no cell claims a header it does not have. The words are
 * for the eye, and the rows carry their own labels.
 */
export function FigureTable<TRow>({
  columns,
  narrowWidths,
  markWidth = '1.15rem',
  rows,
  rowId,
  expandedId,
  onSelect,
  renderMark,
  renderName,
  renderCells,
  renderDetail,
  rowProps,
  rootProps,
  detailIdPrefix,
  headLabel,
}: FigureTableProps<TRow>) {
  // The mark column is the shell's, every other track comes from the figure.
  // The stylesheet switches between the two templates on the figure's own
  // container: the table states both, and never queries the viewport twice.
  const wide = [markWidth, ...columns.map((column) => column.width)];
  const narrow = [markWidth, ...(narrowWidths ?? columns.map((c) => c.width))];
  const grid = {
    '--figure-cols-wide': wide.join(' '),
    '--figure-cols-narrow': narrow.join(' '),
  } as CSSProperties;
  return (
    <div
      className={styles.table}
      style={grid}
      data-figure-table=""
      {...rootProps}
    >
      {/* Column words are for the eye: the rows are a list of controls, each
          one complete in itself. Kept when the list is empty, so a verdict
          never resizes the page. */}
      <div className={styles.head} aria-hidden="true">
        <span />
        {columns.map((column) => (
          <span
            className={clsx(
              styles.headLabel,
              column.align === 'end' && styles.headEnd
            )}
            key={column.label}
            data-fold={column.fold ? '' : undefined}
          >
            {headLabel ? headLabel(column) : column.label}
          </span>
        ))}
      </div>
      {rows.length ? (
        <ul className={styles.rows}>
          {rows.map((row) => {
            const id = rowId(row);
            return (
              <FigureRow
                key={id}
                row={row}
                id={id}
                detailId={`${detailIdPrefix}-${id}`}
                expanded={id === expandedId}
                onSelect={onSelect}
                renderMark={renderMark}
                renderName={renderName}
                renderCells={renderCells}
                renderDetail={renderDetail}
                rowProps={rowProps}
              />
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
