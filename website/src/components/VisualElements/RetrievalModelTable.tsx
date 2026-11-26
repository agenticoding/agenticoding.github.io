import {
  RETRIEVAL_COPY,
  rowPath,
  rowPathTitle,
  spanLabel,
} from './retrievalCopy.ts';
import { FigureMemoryBar, FigureMemoryLegend } from './FigureMemoryBar.tsx';
import { FigureTable } from './FigureTable.tsx';
import type { FigureColumn } from './FigureTable.tsx';
import { FigureMark } from './FigureMark.tsx';
import { formatNumber } from './figureCatalog.ts';
import { ModalityFlow } from './ModalityFlow.tsx';
import { modalityFlowCode } from './modalityProfile.ts';
import { RetrievalModelDetail } from './RetrievalModelDetail.tsx';
import { retrievalProfile } from './retrievalModel.ts';
import type { ListedRow } from './retrievalModel.ts';
import type { RetrievalKind } from './retrievalTypes.ts';
import styles from './Figure.module.css';

/**
 * Header and cell order are one list: a column cannot move without its width.
 *
 * WHY these columns: the table states what the checkpoint reads and what it
 * needs on the machine the reader set. Context earns a column because it is a
 * fit constraint here, not trivia: a row whose cap is shorter than the reader's
 * text never reaches this list. The family's output, width, and score are the
 * panel's facts, because none of them changes with the workload.
 */
const COLUMNS: readonly FigureColumn[] = [
  { label: 'Model', width: 'minmax(0, 1fr)' },
  { label: RETRIEVAL_COPY.columnModality, width: '5.25rem' },
  // The cap folds on a narrow card, exactly as the chat table folds origin: the
  // row states it at the tail of its path instead.
  { label: RETRIEVAL_COPY.columnContext, width: '5.25rem', fold: true },
  { label: RETRIEVAL_COPY.columnMemory, width: '5.75rem', align: 'end' },
];

/** The folded card's tracks: the three columns the chat and decision tables also
 * keep, at the widths they give them, so the bars stay one ruler. */
const NARROW_WIDTHS = ['minmax(0, 1fr)', '4.75rem', '5rem'];

type TableProps = {
  kind: RetrievalKind;
  /** Only the rows the figure claims: a row out of reach never reaches a table. */
  rows: readonly ListedRow[];
  focusedId: string | null;
  /** The length one pass reads: the workload the memory column prices. */
  tokensPerItem: number;
  itemsInFlight: number;
  /** The budget the memory bars are drawn against: the machine's own. */
  budgetGib: number;
  onSelect: (id: string) => void;
};

/**
 * The retrieval figure's table: what each model reads, and what it holds on the
 * reader's machine at the workload the levers set.
 */
export function RetrievalModelTable({
  kind,
  rows,
  focusedId,
  tokensPerItem,
  itemsInFlight,
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
        detailIdPrefix={`${kind}-detail`}
        rootProps={{ [`data-${kind}-table`]: '' }}
        rowProps={(row) => ({
          [`data-${kind}-row`]: '',
          // The model's own id: a lever can delete rows, so a contract compares
          // the rows that survive the move instead of their positions.
          [`data-${kind}-model`]: row.model.id,
          [`data-${kind}-verdict`]: row.verdict,
        })}
        renderMark={(row) => <FigureMark lab={row.model.lab} />}
        renderName={(row) => (
          <>
            <span className={styles.rowName}>{row.model.name}</span>
            {/* The hover text keeps the lab and the base: the line prints only
              the shape and the precision its memory figure rests on. */}
            <span className={styles.rowPath} title={rowPathTitle(row.model)}>
              {rowPath(row.model)}
              {/* The cap trails the path, as the country does in the chat
                table, so a folded column never loses its fact. */}
              <span className={styles.rowInline}>
                {' · '}
                {row.model.maxInput
                  ? `${spanLabel(row.model.maxInput.tokens)} tokens`
                  : RETRIEVAL_COPY.unpublished}
              </span>
            </span>
          </>
        )}
        renderCells={(row) => (
          <>
            {/* Shapes, not words: the flow is a statement about the checkpoint,
                and the same shapes state it in every other figure. */}
            <span
              className={styles.rowModality}
              {...{
                [`data-${kind}-modality`]: modalityFlowCode(
                  retrievalProfile(row.model)
                ),
              }}
            >
              <ModalityFlow profile={retrievalProfile(row.model)} />
            </span>
            <span
              className={styles.rowQuiet}
              {...{ [`data-${kind}-context`]: '' }}
            >
              {row.model.maxInput
                ? spanLabel(row.model.maxInput.tokens)
                : RETRIEVAL_COPY.unpublished}
            </span>
            {/* The cell is drawn for every row: a listed row carries a published
              size, so the column never states a mark. */}
            <span
              className={styles.rowValue}
              {...{ [`data-${kind}-memory`]: '' }}
            >
              <span
                data-figure-memory=""
                {...{
                  [`data-${kind}-weights`]: row.model.weights
                    ? row.model.weights.gib
                    : undefined,
                }}
              >
                {formatNumber(row.needGib)}
              </span>
              <FigureMemoryBar need={row.needGib} budgetGib={budgetGib} />
            </span>
          </>
        )}
        renderDetail={(row, detailId) => (
          <RetrievalModelDetail
            id={detailId}
            kind={kind}
            row={row}
            tokensPerItem={tokensPerItem}
            itemsInFlight={itemsInFlight}
          />
        )}
      />
      {/* One line states the scale the bars share and the mark they add; a
        share is unreadable without its budget. */}
      <FigureMemoryLegend budgetGib={budgetGib} />
    </>
  );
}
