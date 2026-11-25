import {
  TIER_MAP_COPY,
  tierMarker,
  tierModelCell,
} from './openWeightFitCopy.ts';
import {
  conversationsLabel,
  modelById,
  modelTierRows,
  tierSummary,
} from './openWeightFitModel.ts';
import { contextLabel, formatGib } from './figureCatalog.ts';
import { useScenario } from './openWeightFitScenario.ts';
import styles from './OpenWeightFitStaticTable.module.css';

/**
 * The map's summary: one row per hardware tier. The middle columns answer "what
 * can this tier hold" from the same dataset the explorer filters. The last
 * column answers the other direction — this model, at the workload set in the
 * map — so the table states both ends without asking the reader to switch modes.
 *
 * `narration` feeds the audio build; it is not painted on the page.
 */
export function OpenWeightFitTierMap({
  narration: _narration,
}: {
  narration?: string;
}) {
  const { selection, modelId } = useScenario();
  const model = modelById(modelId);
  const tiers = tierSummary();
  const modelRows = new Map(
    modelTierRows(modelId, selection).map((row) => [row.hardwareId, row])
  );
  const workload = `${contextLabel(selection.contextTokens)} × ${conversationsLabel(selection.conversations)}`;

  return (
    // data-audio-figure marks the DOM order the player maps figure anchors to.
    <div className={styles.wrap} data-audio-figure="">
      <table className={`${styles.table} ${styles.tierTable}`} data-tier-map>
        <thead>
          <tr>
            <th scope="col">{TIER_MAP_COPY.tier}</th>
            <th scope="col" className={styles.num}>
              {TIER_MAP_COPY.memory}
            </th>
            <th scope="col" className={styles.num}>
              {TIER_MAP_COPY.at64k}
            </th>
            <th scope="col" className={styles.num}>
              {TIER_MAP_COPY.atNative}
            </th>
            <th scope="col">{TIER_MAP_COPY.heaviest}</th>
            <th scope="col">
              {TIER_MAP_COPY.model}
              <span className={styles.sub}>
                {model?.name ?? ''} · {workload}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const modelRow = modelRows.get(tier.hardwareId);
            const marker = modelRow ? tierMarker(modelRow) : '';
            return (
              <tr
                key={tier.hardwareId}
                data-your-tier={modelRow?.isYours ? '' : undefined}
                data-smallest-fit={modelRow?.isSmallest ? '' : undefined}
              >
                <th scope="row">{tier.label}</th>
                <td className={styles.num} data-label={TIER_MAP_COPY.memory}>
                  {formatGib(tier.screenGib)} GiB
                </td>
                <td className={styles.num} data-label={TIER_MAP_COPY.at64k}>
                  {tier.at64k}
                </td>
                <td className={styles.num} data-label={TIER_MAP_COPY.atNative}>
                  {tier.atNative}
                </td>
                <td data-label={TIER_MAP_COPY.heaviest}>
                  {tier.heaviest.join(' · ')}
                </td>
                <td className={styles.num} data-label={TIER_MAP_COPY.model}>
                  {marker ? (
                    <span className={styles.marker}>{marker}</span>
                  ) : null}
                  {modelRow ? tierModelCell(modelRow) : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.note}>{TIER_MAP_COPY.caption}</p>
    </div>
  );
}

export default OpenWeightFitTierMap;
