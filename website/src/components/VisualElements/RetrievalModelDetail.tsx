import { ASSUME_WORKING_SET_KIB_PER_TOKEN } from './retrievalRequirement.ts';
import {
  RETRIEVAL_COPY,
  dimsText,
  inputBasisLabel,
  scoreText,
  spanLabel,
} from './retrievalCopy.ts';
import { formatNumber } from './figureCatalog.ts';
import { workingSetDerivation, retrievalProfile } from './retrievalModel.ts';
import type { ListedRow } from './retrievalModel.ts';
import type { RetrievalKind } from './retrievalTypes.ts';
import { LabeledModalityFlow } from './ModalityFlow.tsx';
import styles from './Figure.module.css';

type DetailProps = {
  id: string;
  kind: RetrievalKind;
  /** A listed row: it has a published size and it serves this workload. */
  row: ListedRow;
  tokensPerItem: number;
  /** Items in flight at this workload: what the working set multiplies by. */
  itemsInFlight: number;
};

const Fact = ({ term, value }: { term: string; value: string }) => (
  <div className={styles.detailRow}>
    <dt>{term}</dt>
    <dd>{value}</dd>
  </div>
);

/**
 * The open row's evidence: the working set the workload adds, the two terms it
 * was priced on, and the checkpoint's own record.
 *
 * WHY the verdict lives here: a colour would claim a verdict the weights alone
 * cannot give -- half these cards publish no weight size, and the workload moves
 * the working set -- so the word and the reason are printed together.
 *
 * WHY width and score sit here and not in the table: neither changes with the
 * workload, and both are reasons to pay this row's memory rather than a cost of
 * it.
 */
export function RetrievalModelDetail({
  id,
  kind,
  row,
  tokensPerItem,
  itemsInFlight,
}: DetailProps) {
  const { model } = row;

  return (
    <div className={styles.detail} id={id}>
      {/* The formula is the panel's first claim: the one term the levers move. */}
      <p
        className={styles.detailArithmetic}
        {...{ [`data-${kind}-breakdown`]: '' }}
      >
        {workingSetDerivation(tokensPerItem, itemsInFlight)}
      </p>
      <dl className={styles.detailList}>
        <Fact term="Base" value={model.base} />
        {/* Each channel prints beside its own shape, so the panel never asks a
            reader to decode the cluster's order. Full band, as both other
            figures' panels draw the same fact. */}
        <div className={`${styles.detailRow} ${styles.detailRowWide}`}>
          <dt>Modality</dt>
          <dd>
            <LabeledModalityFlow profile={retrievalProfile(model)} />
          </dd>
        </div>
        <Fact term="Verdict" value={RETRIEVAL_COPY.verdict.fits} />
        {/* The fixed term, in the source's own unit and precision: the one
            number the workload never touches. */}
        <Fact
          term="Weights"
          value={model.weights ? model.weights.stated : 'not published'}
        />
        {/* The two terms of the need, so a row that moved with the workload
            states which one moved. */}
        <Fact
          term="Memory at this workload"
          value={`${formatNumber(row.needGib)} GiB`}
        />
        <Fact
          term="Working set per token"
          value={`${ASSUME_WORKING_SET_KIB_PER_TOKEN} KiB, assumed`}
        />
        {/* An embedder's width is a storage bill, and a reranker emits a scalar,
            so only a family that publishes a vector states one. */}
        {kind === 'embedding' ? (
          <Fact
            term="Vector"
            value={model.dims ? dimsText(model.dims) : 'not published'}
          />
        ) : null}
        <Fact
          term="Score"
          value={
            model.score ? scoreText(model.score) : RETRIEVAL_COPY.unpublished
          }
        />
        <Fact
          term="Input limit"
          value={
            model.maxInput
              ? `${spanLabel(model.maxInput.tokens)} tokens (${inputBasisLabel(model.maxInput.basis)})`
              : 'not published'
          }
        />
        <Fact
          term="Origin"
          value={model.country ?? RETRIEVAL_COPY.unpublished}
        />
        <Fact term="Runtimes" value={model.engineIds.join(', ')} />
        <Fact term="Files" value={model.files} />
        <Fact term="License" value={model.license} />
      </dl>
      <p className={styles.detailNote}>
        Compare scores only within the same benchmark version, protocol, and
        candidate pool.
      </p>
      <a
        className={styles.detailSource}
        href={model.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Model card
      </a>
    </div>
  );
}
