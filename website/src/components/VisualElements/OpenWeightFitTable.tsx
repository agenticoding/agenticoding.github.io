import { FigureMemoryBar, FigureMemoryLegend } from './FigureMemoryBar.tsx';
import { FigureTable } from './FigureTable.tsx';
import type { FigureColumn } from './FigureTable.tsx';
import { FigureMark } from './FigureMark.tsx';
import { ModalityFlow } from './ModalityFlow.tsx';
import { modalityFlowCode } from './modalityProfile.ts';
import {
  FIT_TABLE_COPY,
  rowDiskLine,
  rowMemoryCell,
  rowSetupLine,
} from './openWeightFitCopy.ts';
import type { ResolvedRow } from './openWeightFitModel.ts';
import { OpenWeightFitDetail } from './OpenWeightFitDetail.tsx';
import styles from './Figure.module.css';

/** Header and cell order are one list: a column cannot move without its width. */
const COLUMNS: readonly FigureColumn[] = [
  { label: FIT_TABLE_COPY.model, width: 'minmax(0, 1fr)' },
  { label: FIT_TABLE_COPY.modality, width: '5.25rem' },
  // The origin keeps its fact and loses its column on a narrow card: it trails
  // the setup line there, so the name keeps the width instead.
  { label: FIT_TABLE_COPY.origin, width: '6.5rem', fold: true },
  { label: FIT_TABLE_COPY.memory, width: '5.75rem', align: 'end' },
];

/** The folded card's tracks: the origin's 6.5rem is the name's again. */
const NARROW_WIDTHS = ['minmax(0, 1fr)', '4.75rem', '5rem'];

type TableProps = {
  /** The rows that fit the current settings; the table lists nothing else. */
  rows: readonly ResolvedRow[];
  focusedId: string | null;
  /** Requests in flight; the row number and its derivation both scale with it. */
  conversations: number;
  /** The budget every row is tested against: the memory bars' own scale. */
  budgetGib: number;
  onSelect: (modelId: string) => void;
  /** Selecting a runtime from a row's comparison reprices the page. */
  onEngine: (engineId: string) => void;
};

/**
 * The fit figure's table: the shared row, with the memory figure, the setup it
 * was priced on, and the modality shapes.
 */
export function OpenWeightFitTable({
  rows,
  focusedId,
  conversations,
  budgetGib,
  onSelect,
  onEngine,
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
        detailIdPrefix="fit-detail"
        rootProps={{ 'data-fit-table': '' }}
        rowProps={(row) => ({
          'data-fit-row': '',
          // A streamed row is a different claim from a resident one; the mark
          // prints it too, and the contracts read it here.
          'data-fit-streamed': row.kind === 'streamed' ? '' : undefined,
        })}
        renderMark={(row) => <FigureMark lab={row.model.lab} />}
        renderName={(row) => {
          const setup = rowSetupLine(row);
          return (
            <>
              <span className={styles.rowName}>{row.model.name}</span>
              {/* The row names the setup, and the cap when the number is not at
                the slider's context: a number must name its own basis. The
                origin joins this line only where the grid drops its column. */}
              <span className={styles.rowPath} title={setup}>
                {setup}
                {/* The origin trails the path, so the number's own basis survives
                  the ellipsis first. It only prints where the grid has no room
                  for its column. */}
                <span className={styles.rowInline}>
                  {' · '}
                  {row.model.country}
                </span>
              </span>
            </>
          );
        }}
        renderCells={(row) => {
          const diskLine = rowDiskLine(row);
          return (
            <>
              {/* Shapes, not words: the flow is a statement about the checkpoint,
                and the same shapes state it in every other figure. */}
              <span
                className={styles.rowModality}
                data-fit-modality={modalityFlowCode(row.model.modalities)}
              >
                <ModalityFlow profile={row.model.modalities} />
              </span>
              <span className={styles.rowQuiet} title={row.model.country}>
                {row.model.country}
              </span>
              <span className={styles.rowValue}>
                <span data-figure-memory="">{rowMemoryCell(row)}</span>
                {/* The drawing follows the number it draws, so the sentence an
                    over-budget row adds is read after the figure it qualifies.
                    One ink: a drafter's GiB is the row's detail, never a
                    segment that most rows cannot show. */}
                <FigureMemoryBar need={row.requiredGib} budgetGib={budgetGib} />
                {/* A streamed row's held figure hides how large the checkpoint is
                  on storage; the quiet line under it names that size. */}
                {diskLine ? (
                  <span className={styles.rowValueSecondary}>{diskLine}</span>
                ) : null}
              </span>
            </>
          );
        }}
        renderDetail={(row, detailId) => (
          <OpenWeightFitDetail
            id={detailId}
            row={row}
            conversations={conversations}
            onEngine={onEngine}
          />
        )}
      />
      {/* One line states the scale the bars share and the mark they add; a
          share is unreadable without its budget. */}
      <FigureMemoryLegend budgetGib={budgetGib} />
    </>
  );
}
