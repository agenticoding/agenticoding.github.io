import { WORKLOAD_COPY, workloadReadout } from './openWeightFitCopy.ts';
import {
  conversationsLabel,
  modelById,
  resolveRows,
} from './openWeightFitModel.ts';
import { contextLabel } from './figureCatalog.ts';
import { useScenario } from './openWeightFitScenario.ts';
import styles from './OpenWeightFitWorkload.module.css';

/**
 * The control plane's readout: the page's rule with the reader's values in it.
 * It reads the same scenario the map writes, and resolves the same rows, so the
 * arithmetic here can never describe a different question than the chart above.
 *
 * `narration` feeds the audio build; it is not painted on the page.
 */
export function OpenWeightFitWorkload({
  narration: _narration,
}: {
  narration?: string;
}) {
  const { selection, modelId } = useScenario();
  const model = modelById(modelId);
  const row = resolveRows(selection).find(
    (candidate) => candidate.model.id === modelId
  );
  if (!model) return null;
  // A row exists for every listed model, but only a priced row carries the
  // numbers the readout substitutes; an unsized one says so instead.
  const readout =
    row && row.requiredGib !== null ? workloadReadout(row, selection) : null;

  return (
    <div className={styles.wrap} data-audio-figure="">
      <p className={styles.rule} data-workload-readout="">
        {readout?.rule ?? WORKLOAD_COPY.rule}
      </p>
      <p className={styles.scenario}>
        {model.name} · {model.pathLabel} ·{' '}
        {contextLabel(selection.contextTokens)} ×{' '}
        {conversationsLabel(selection.conversations)}
      </p>
      {readout ? (
        <>
          <p className={styles.arithmetic}>{readout.arithmetic}</p>
          <p className={styles.verdict}>{readout.verdict}</p>
          <p className={styles.price}>{readout.price}</p>
          <p className={styles.answer}>{readout.answer}</p>
        </>
      ) : (
        <p className={styles.arithmetic}>{WORKLOAD_COPY.unsized}</p>
      )}
    </div>
  );
}

export default OpenWeightFitWorkload;
