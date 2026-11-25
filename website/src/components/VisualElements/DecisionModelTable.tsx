import { DECISION_COPY, rowPath, rowPathTitle } from './decisionModelCopy.ts';
import { FigureMemoryBar, FigureMemoryLegend } from './FigureMemoryBar.tsx';
import { FigureTable } from './FigureTable.tsx';
import type { FigureColumn } from './FigureTable.tsx';
import { FigureMark } from './FigureMark.tsx';
import { ModalityFlow } from './ModalityFlow.tsx';
import { modalityFlowCode } from './modalityProfile.ts';
import { classifierProfile } from './decisionModelModel.ts';
import type { ListedRow } from './decisionModelModel.ts';
import { formatNumber } from './figureCatalog.ts';
import { DecisionModelDetail } from './DecisionModelDetail.tsx';
import styles from './Figure.module.css';

/**
 * Header and cell order are one list: a column cannot move without its width.
 *
 * WHY these columns: the chat figure's table states what a checkpoint reads and
 * what it needs on the machine the reader set. This one states the same facts,
 * priced at the workload rather than at a conversation. A classifier is
 * self-hosted, so it publishes no price to print.
 */
const COLUMNS: readonly FigureColumn[] = [
  { label: 'Model', width: 'minmax(0, 1fr)' },
  { label: DECISION_COPY.columnModality, width: '6.5rem' },
  // The origin folds on a narrow card, exactly as the chat table folds it: the
  // row states the country at the tail of its path instead.
  { label: DECISION_COPY.columnOrigin, width: '6.5rem', fold: true },
  { label: DECISION_COPY.columnMemory, width: '5.75rem', align: 'end' },
];

/** The folded card's tracks: the three columns the chat table also keeps. */
const NARROW_WIDTHS = ['minmax(0, 1fr)', '4.75rem', '5rem'];

type TableProps = {
  /** Only the rows the figure claims: a losing row never reaches this table. */
  rows: readonly ListedRow[];
  focusedId: string | null;
  stateTokens: number;
  /** Decisions in flight: the workload the memory column prices. */
  decisions: number;
  /** The budget the memory bars are drawn against: the machine's own. */
  budgetGib: number;
  onSelect: (id: string) => void;
};

/**
 * The decision figure's table: what each classifier reads, and what it holds on
 * the reader's machine at the workload the levers set.
 */
export function DecisionModelTable({
  rows,
  focusedId,
  stateTokens,
  decisions,
  budgetGib,
  onSelect,
}: TableProps) {
  return (
    <>
      <FigureTable
        columns={COLUMNS}
        narrowWidths={NARROW_WIDTHS}
        rows={rows}
        rowId={(row) => row.model.id}
        expandedId={focusedId}
        onSelect={onSelect}
        detailIdPrefix="decision-detail"
        rootProps={{ 'data-decision-table': '' }}
        rowProps={(row) => ({
          'data-decision-row': '',
          // The model's own id: a lever can delete rows, so a contract compares
          // the rows that survive the move instead of their positions.
          'data-decision-model': row.model.id,
          'data-decision-verdict': row.verdict,
        })}
        renderMark={(row) => <FigureMark lab={row.model.lab} />}
        renderName={(row) => (
          <>
            <span className={styles.rowName}>{row.model.name}</span>
            {/* The hover text keeps the lab and the base: the line prints only
              the shape and the precision its memory figure rests on. */}
            <span className={styles.rowPath} title={rowPathTitle(row.model)}>
              {rowPath(row.model)}
              {/* The country trails the path, as it does in the chat table. */}
              <span className={styles.rowInline}>
                {' · '}
                {row.model.country ?? DECISION_COPY.unpublished}
              </span>
            </span>
          </>
        )}
        renderCells={(row) => {
          const weights = row.model.weights;
          const profile = classifierProfile(row.model);
          return (
            <>
              {/* Shapes, not words: the flow is a statement about the checkpoint,
                and the same shapes state it in every other figure. */}
              <span
                className={styles.rowModality}
                data-decision-modality={modalityFlowCode(profile)}
              >
                <ModalityFlow profile={profile} />
              </span>
              <span className={styles.rowQuiet} data-decision-origin="">
                {row.model.country ?? DECISION_COPY.unpublished}
              </span>
              {/* The cell is drawn for every row: a listed row carries a
                published size, so the column never states a mark. */}
              <span className={styles.rowValue} data-decision-memory="">
                {/* One figure, as the chat table prints it: the precision that
                  figure rests on is the row line's fact, never a second line
                  under the number. */}
                <span
                  data-figure-memory=""
                  data-decision-weights={weights ? weights.gib : undefined}
                >
                  {formatNumber(row.needGib)}
                </span>
                {/* The drawing follows the number it draws, so the sentence an
                    over-budget row adds is read after the figure it qualifies.
                    One ink: the number is the whole footprint, and the cache is
                    the panel's fact, stated once for every row. */}
                <FigureMemoryBar need={row.needGib} budgetGib={budgetGib} />
              </span>
            </>
          );
        }}
        renderDetail={(row, detailId) => (
          <DecisionModelDetail
            id={detailId}
            row={row}
            stateTokens={stateTokens}
            decisions={decisions}
          />
        )}
      />
      {/* One line states the scale the bars share and the mark they add; a
          share is unreadable without its budget. */}
      <FigureMemoryLegend budgetGib={budgetGib} />
    </>
  );
}
