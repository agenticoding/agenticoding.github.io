import { DECISION_COPY } from './decisionModelCopy.ts';
import type { ListedRow } from './decisionModelModel.ts';
import { cacheDerivation, classifierProfile } from './decisionModelModel.ts';
import { ASSUME_CACHE_KIB_PER_TOKEN } from './classifierRequirement.ts';
import { formatNumber } from './figureCatalog.ts';
import { LabeledModalityFlow } from './ModalityFlow.tsx';
import styles from './Figure.module.css';

type DetailProps = {
  id: string;
  /** A listed row: it has a published size and it fits here. */
  row: ListedRow;
  stateTokens: number;
  /** Decisions in flight at this workload: what the cache multiplies by. */
  decisions: number;
};

const Fact = ({ term, value }: { term: string; value: string }) => (
  <div className={styles.detailRow}>
    <dt>{term}</dt>
    <dd>{value}</dd>
  </div>
);

/**
 * The open row's evidence: the cache the workload adds, the two terms it was
 * priced on, and the checkpoint's own record.
 *
 * WHY the verdict lives here: a colour would claim a verdict the weights alone
 * cannot give — half these cards publish no weight size, and the workload moves
 * the cache — so the word and the reason are printed together.
 */
export function DecisionModelDetail({
  id,
  row,
  stateTokens,
  decisions,
}: DetailProps) {
  const { model } = row;

  return (
    <div className={styles.detail} id={id}>
      {/* The formula is the panel's first claim: the one term the levers move. */}
      <p className={styles.detailArithmetic} data-decision-breakdown="">
        {cacheDerivation(stateTokens, decisions)}
      </p>
      <dl className={styles.detailList}>
        <Fact term="Base" value={model.base} />
        {/* Each channel prints beside its own shape, so the panel never asks a
            reader to decode the cluster's order. Full band, as the chat
            figure's panel draws the same fact. */}
        <div className={`${styles.detailRow} ${styles.detailRowWide}`}>
          <dt>{DECISION_COPY.columnModality}</dt>
          <dd>
            <LabeledModalityFlow profile={classifierProfile(model)} />
          </dd>
        </div>
        <Fact term="Verdict" value={DECISION_COPY.verdict.fits} />
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
          term="Cache per token"
          value={`${ASSUME_CACHE_KIB_PER_TOKEN} KiB, assumed`}
        />
        {/* A self-hosted card publishes no price; the origin is the trust fact
            the chat figure's panel also states. */}
        <Fact
          term={DECISION_COPY.columnOrigin}
          value={model.country ?? DECISION_COPY.unpublished}
        />
        <Fact
          term="Input limit"
          value={
            model.maxInput
              ? `${formatNumber(model.maxInput.tokens)} (${model.maxInput.basis})`
              : 'not published'
          }
        />
        <Fact term="Runtimes" value={model.engineIds.join(', ')} />
        <Fact term="Files" value={model.files} />
        <Fact term="License" value={model.license} />
      </dl>
      {row.overInput === null ? null : (
        <p className={styles.detailNote}>
          {row.overInput
            ? 'The state is longer than the published input limit.'
            : 'The state fits the published input limit.'}
        </p>
      )}
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
