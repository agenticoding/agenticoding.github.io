import {
  RUNTIME_COPY,
  mtpLine,
  needBreakdown,
  rowCandidatesText,
  rowNote,
  runtimeAside,
  runtimeFacts,
  runtimeStateLabel,
} from './openWeightFitCopy.ts';
import type { ResolvedRow } from './openWeightFitModel.ts';
import { contextLabel, formatGib } from './figureCatalog.ts';
import { LabeledModalityFlow } from './ModalityFlow.tsx';
import fitStyles from './openWeightFit.module.css';
import styles from './Figure.module.css';

type DetailProps = {
  row: ResolvedRow;
  /** Requests in flight; > 1 turns the published anchor into a derivation. */
  conversations: number;
  /** Target of the row button's `aria-controls`; the row owns this panel. */
  id: string;
  /** Selecting a runtime reprices the whole page, not just this row. */
  onEngine: (engineId: string) => void;
};

const DetailRow = ({ term, value }: { term: string; value: string }) => (
  <div className={styles.detailRow}>
    <dt>{term}</dt>
    <dd>{value}</dd>
  </div>
);

/**
 * The selected row's facts, attached directly under that row: the arithmetic
 * behind its number, the runtimes that publish evidence for it, and the
 * checkpoint's record. It stays inside its own row so the detail can never
 * appear somewhere other than that row, and it never repeats the model name.
 *
 * Reading order is the argument: why the number (one line), which runtimes can
 * serve it (one line each, verdicts in a column), then the record. Nothing here
 * is printed twice, on this panel or in the row above it.
 */
export function OpenWeightFitDetail({
  row,
  conversations,
  id,
  onEngine,
}: DetailProps) {
  const model = row.model;
  const note = rowNote(row);
  const breakdown = needBreakdown(row, conversations);
  // One runtime is the row's own setup, printed a line above this panel: a
  // comparison needs a choice, not a copy of the row.
  const compare = row.runtimes.length > 1;
  return (
    <div
      id={id}
      role="region"
      aria-label={model.name}
      className={styles.detail}
    >
      <p className={styles.detailLab}>
        {model.lab} · {model.country}
      </p>
      {breakdown ? (
        <p className={styles.detailArithmetic} data-need-breakdown="">
          {breakdown}
        </p>
      ) : null}
      {compare ? (
        <section
          className={fitStyles.runtimeCompare}
          aria-label={RUNTIME_COPY.heading}
          data-fit-runtimes=""
        >
          <ul className={fitStyles.runtimeList}>
            {row.runtimes.map((option, index) => {
              // One runtime, one name: its other configurations hang beneath it,
              // so a repeated label never competes with the configuration that
              // actually differs between the lines.
              const named =
                row.runtimes[index - 1]?.engineLabel !== option.engineLabel;
              const aside = runtimeAside(option);
              return (
                <li
                  key={`${option.engineId}-${index}`}
                  className={fitStyles.runtimeItem}
                >
                  <button
                    type="button"
                    className={fitStyles.runtimeButton}
                    aria-pressed={row.chosenRuntime === option}
                    // The narrow card has one column per line, so a hidden name
                    // would leave its verdict floating alone; it reads there.
                    data-grouped={named ? undefined : ''}
                    onClick={() => onEngine(option.engineId)}
                    data-fit-runtime=""
                    data-fit-runtime-state={option.state}
                  >
                    <span className={fitStyles.runtimeName}>
                      {option.engineLabel}
                    </span>
                    <span className={fitStyles.runtimeConfig}>
                      {option.label}
                    </span>
                    <span className={fitStyles.runtimeFacts}>
                      {runtimeFacts(option)}
                    </span>
                    <span
                      className={fitStyles.runtimeState}
                      data-state={option.state}
                    >
                      {runtimeStateLabel(option)}
                    </span>
                    {aside ? (
                      <span className={fitStyles.runtimeOptionNote}>
                        {aside}
                      </span>
                    ) : null}
                  </button>
                  {option.sourceUrl ? (
                    <a
                      className={fitStyles.runtimeSource}
                      href={option.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      source ↗
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className={fitStyles.runtimeNote}>{RUNTIME_COPY.note}</p>
        </section>
      ) : null}
      {row.kind === 'streamed' ? (
        <dl className={styles.detailList}>
          <DetailRow
            term="Held in memory"
            value={
              row.requiredGib === null
                ? '—'
                : `${formatGib(row.requiredGib)} GiB`
            }
          />
          <DetailRow
            term="Streams from storage"
            value={row.diskGib === null ? '—' : `${formatGib(row.diskGib)} GiB`}
          />
          {row.speed ? (
            <DetailRow
              term="Published rate"
              value={
                row.testedTokens === null
                  ? row.speed
                  : `${row.speed} at ${contextLabel(row.testedTokens)}`
              }
            />
          ) : null}
        </dl>
      ) : null}
      {note ? <p className={styles.detailNote}>{note}</p> : null}
      {row.setup ? (
        <p className={styles.detailNote}>
          {row.setup}{' '}
          {row.setupSource ? (
            <a href={row.setupSource} target="_blank" rel="noreferrer">
              source ↗
            </a>
          ) : null}
        </p>
      ) : null}
      {/* The record. The footprint at 64K and at the model's own cap already
          travels in the tier map's two count columns, so it is not repeated
          here; the runtimes above are the guide's, so a list of names adds
          nothing. */}
      <dl className={styles.detailList}>
        {/* The longest fact takes the whole band: a two-line value under a
            half-width label leaves a hole beside it. */}
        <div className={`${styles.detailRow} ${styles.detailRowWide}`}>
          <dt>Files you download</dt>
          <dd>{model.checkpoint}</dd>
        </div>
        {/* Each channel prints beside its own shape, so the panel never asks a
            reader to decode the cluster's order. Full band, so four channels
            and their names never fight the eight-rem label for width. Placed
            before the half-band pairs, so the pair grid leaves no hole. */}
        <div className={`${styles.detailRow} ${styles.detailRowWide}`}>
          <dt>Modality</dt>
          <dd>
            <LabeledModalityFlow profile={model.modalities} />
          </dd>
        </div>
        <DetailRow term="License" value={model.license} />
        <DetailRow term="Context limit" value={model.contextCap} />
        <DetailRow term="Parameters" value={model.params} />
        {/* The speculative component is its own fact: the row's number may or
            may not count it, and the toggle moves that line. */}
        {model.mtp ? (
          <DetailRow term="Speculative component" value={mtpLine(row)} />
        ) : null}
        {/* The tier table prices resident footprints, so it cannot answer for a
            streamed row: the held-memory row above already names that path. */}
        {row.kind === 'streamed' ? null : (
          <DetailRow term="Smallest tier" value={rowCandidatesText(row)} />
        )}
      </dl>
      {row.measured.length ? (
        <p className={styles.detailMeasured}>
          Measured on this device:{' '}
          {row.measured.map((run) => run.text).join(' · ')}
        </p>
      ) : null}
      {model.sourceUrl ? (
        <a
          className={styles.detailSource}
          href={model.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Model card and recipe ↗
        </a>
      ) : null}
    </div>
  );
}
