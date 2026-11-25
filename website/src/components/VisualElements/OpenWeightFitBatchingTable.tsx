import { BATCHING_COPY, batchingValue } from './openWeightFitCopy.ts';
import { batchingRows } from './openWeightFitModel.ts';
import styles from './OpenWeightFitStaticTable.module.css';

/**
 * The speed side of the workload: operating points the guide actually measured
 * with more than one conversation. Static by design — a measured run cannot be
 * multiplied, so this table never follows the scenario controls.
 *
 * `narration` feeds the audio build; it is not painted on the page.
 */
export function OpenWeightFitBatchingTable({
  narration: _narration,
}: {
  narration?: string;
}) {
  return (
    <div className={styles.wrap} data-audio-figure="">
      <table
        className={`${styles.table} ${styles.batchingTable}`}
        data-batching-table
      >
        <thead>
          <tr>
            <th scope="col">{BATCHING_COPY.run}</th>
            <th scope="col" className={styles.num}>
              {BATCHING_COPY.conversations}
            </th>
            <th scope="col" className={styles.num}>
              {BATCHING_COPY.perUser}
              <span className={styles.sub}>{BATCHING_COPY.unit}</span>
            </th>
            <th scope="col" className={styles.num}>
              {BATCHING_COPY.aggregate}
              <span className={styles.sub}>{BATCHING_COPY.unit}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {batchingRows().map((row) => (
            <tr key={row.key}>
              <th scope="row">
                {row.modelName} · {row.hardwareLabel}
                <span className={styles.sub}>{row.pathLabel}</span>
              </th>
              <td
                className={styles.num}
                data-label={BATCHING_COPY.conversations}
              >
                {row.concurrency}
              </td>
              <td className={styles.num} data-label={BATCHING_COPY.perUser}>
                {batchingValue(row.perUserOut, row.approx)}
              </td>
              <td className={styles.num} data-label={BATCHING_COPY.aggregate}>
                {batchingValue(row.aggregateOut, row.approx)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>{BATCHING_COPY.caption}</p>
    </div>
  );
}

export default OpenWeightFitBatchingTable;
