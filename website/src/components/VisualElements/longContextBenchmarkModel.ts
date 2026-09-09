import {
  benchmarkRows,
  type BenchmarkRow,
} from './longContextBenchmarkData.ts';

/**
 * Provider hue keys index the CSS module's rank-ladder classes. Hue is a
 * provider-level property derived from measured data. Rank semantics hold
 * everywhere: #1 → success (the validated leader), the bottom two →
 * warning/error (the failing end) — always. Between those, hues are assigned
 * in two passes (see providerHueKeys) so the default comparison curves get a
 * maximal-spread, mutually distinct set instead of a run of adjacent cool hues.
 */
export type ProviderHueKey =
  | 'hueSuccess'
  | 'hueCyan'
  | 'hueIndigo'
  | 'hueViolet'
  | 'hueMagenta'
  | 'hueWarning'
  | 'hueError';

const MIDDLE_HUES: readonly ProviderHueKey[] = [
  'hueCyan',
  'hueIndigo',
  'hueViolet',
  'hueMagenta',
];

// The default (compared) curves get a maximal-spread categorical set first, so
// the visible curves are always mutually distinct. Spread order is farthest-
// first from success: magenta/indigo/cyan/violet zig-zag instead of a cool ramp.
export const DEFAULT_MIDDLE_HUES: readonly ProviderHueKey[] = [
  'hueMagenta',
  'hueIndigo',
  'hueCyan',
  'hueViolet',
];

export const DEFAULT_PROVIDER_COUNT = 4;
export const DEFAULT_SELECTION_CAP = 6;

/**
 * One hue assignment for the shipped row set, shared by every rendering
 * surface (main chart, chip rail, mobile summary, model cards) so a provider
 * never changes color between figures.
 */
export const benchmarkHueKeys: ReadonlyMap<string, ProviderHueKey> =
  providerHueKeys(benchmarkRows);

/**
 * Human-readable endpoint of a row's measured curve, e.g. "61.9% @512K".
 * The row's last point is the single source — never assume the 1M bin, since
 * most curves end earlier.
 */
export function curveEndpointLabel(row: BenchmarkRow): string {
  const last = row.points[row.points.length - 1];
  return `${last.score}% @${last.label}`;
}

/**
 * Readable one-liner summarizing measured performance: the 128K anchor and
 * the last measured point. When the curve ends below 1M, the summary flags
 * that no 1M-bin runs exist.
 */
export function measuredSummary(row: BenchmarkRow): string {
  const mid = row.points.find((p) => p.tokens === 131072)!;
  const last = row.points[row.points.length - 1];
  const summary = `Measured ${mid.score}% at ${mid.label}, ${last.score}% at ${last.label}`;
  return last.tokens < 1048576 ? `${summary}; no 1M runs` : summary;
}

/**
 * Vendor claims as a compact inline string: `91.9% @256K, 78.3% @1M`.
 * Empty when the vendor publishes no length-stratified numbers.
 */
export function claimSummary(row: BenchmarkRow): string {
  if (row.vendorClaims.length === 0) return '';
  return row.vendorClaims.map((c) => `${c.score} @${c.label}`).join(', ');
}

/**
 * Advertised context window with measurement provenance. When a measured
 * row is available, appends the curve endpoint; otherwise notes the absence
 * of independent measurement.
 */
export function advertisedContext(
  row: BenchmarkRow | null,
  advertisedWindow: string
): string {
  if (row)
    return `${advertisedWindow} advertised window \u00b7 measured to ${curveEndpointLabel(row)}`;
  return `${advertisedWindow} advertised window \u00b7 no independent measurement`;
}

// Rank on the shared 128K bin first: an endpoint at 128K and one at 1M are
// not comparable scores. Longer coverage then breaks ties, followed by each
// row's endpoint and vendor name for a stable order.
function rankCompare(a: BenchmarkRow, b: BenchmarkRow): number {
  if (a.moderateScore !== b.moderateScore)
    return b.moderateScore - a.moderateScore;
  const aCoverage = a.points[a.points.length - 1].tokens;
  const bCoverage = b.points[b.points.length - 1].tokens;
  if (aCoverage !== bCoverage) return bCoverage - aCoverage;
  if (a.longScore !== b.longScore) return b.longScore - a.longScore;
  return a.vendor.localeCompare(b.vendor);
}

function bestRowPerProvider(
  rows: readonly BenchmarkRow[]
): Map<string, BenchmarkRow> {
  const best = new Map<string, BenchmarkRow>();
  for (const row of rows) {
    const current = best.get(row.vendor);
    if (!current || rankCompare(row, current) < 0) best.set(row.vendor, row);
  }
  return best;
}

/** Providers ordered by their strongest shared-bin measurement. */
export function rankProviders(rows: readonly BenchmarkRow[]): string[] {
  return [...bestRowPerProvider(rows).values()]
    .sort(rankCompare)
    .map((row) => row.vendor);
}

/**
 * Provider → CSS hue class, assigned in two passes so the default comparison
 * curves are distinct. The winner (#1) keeps success and the bottom two keep
 * warning/error (rank semantics). Pass one gives the default-selected middle
 * providers a maximal-spread categorical set; pass two cycles the rest around
 * them, skipping the hue used by any rank-adjacent provider.
 *
 * @remarks Two-pass assignment couples to deriveDefaultSelections(): pass one
 * reserves DEFAULT_MIDDLE_HUES for default-selected middle providers (via
 * defaultProviderVendors). Changing DEFAULT_PROVIDER_COUNT/CAP recolors. Keep
 * in sync.
 */
export function providerHueKeys(
  rows: readonly BenchmarkRow[]
): Map<string, ProviderHueKey> {
  const ranked = rankProviders(rows);
  const rankIndex = new Map(ranked.map((vendor, index) => [vendor, index]));
  const last = ranked.length - 1;
  const isWinner = (index: number) => index === 0;
  const isWarning = (index: number) => index === last - 1;
  const isError = (index: number) => index === last;
  const keys = new Map<string, ProviderHueKey>();

  // Pass one: default-selected middle providers take the spread hues first.
  let heroIndex = 0;
  for (const vendor of defaultProviderVendors(rows, ranked)) {
    const index = rankIndex.get(vendor)!;
    if (isWinner(index)) keys.set(vendor, 'hueSuccess');
    else if (isWarning(index)) keys.set(vendor, 'hueWarning');
    else if (isError(index)) keys.set(vendor, 'hueError');
    else
      keys.set(
        vendor,
        DEFAULT_MIDDLE_HUES[heroIndex++ % DEFAULT_MIDDLE_HUES.length]
      );
  }

  // Pass two: everyone else fills the remaining categoricals, honoring semantics.
  let middleOrder = 0;
  ranked.forEach((vendor, index) => {
    if (keys.has(vendor)) return;
    if (isWinner(index)) keys.set(vendor, 'hueSuccess');
    else if (isWarning(index)) keys.set(vendor, 'hueWarning');
    else if (isError(index)) keys.set(vendor, 'hueError');
    else {
      keys.set(vendor, pickMiddleHue(index, ranked, keys, middleOrder));
      middleOrder += 1;
    }
  });
  return keys;
}

/** Default-selected providers, ordered by rank. */
function defaultProviderVendors(
  rows: readonly BenchmarkRow[],
  ranked: readonly string[]
): string[] {
  const idToVendor = new Map(rows.map((row) => [row.id, row.vendor]));
  const defaultSet = new Set(
    deriveDefaultSelections(rows).map((id) => idToVendor.get(id)!)
  );
  return ranked.filter((vendor) => defaultSet.has(vendor));
}

/** Next categorical hue that differs from any rank-adjacent provider. */
function pickMiddleHue(
  index: number,
  ranked: readonly string[],
  keys: ReadonlyMap<string, ProviderHueKey>,
  middleOrder: number
): ProviderHueKey {
  const prev = index > 0 ? keys.get(ranked[index - 1]) : undefined;
  const next =
    index + 1 < ranked.length ? keys.get(ranked[index + 1]) : undefined;
  for (let attempt = 0; attempt < MIDDLE_HUES.length; attempt += 1) {
    const hue = MIDDLE_HUES[(middleOrder + attempt) % MIDDLE_HUES.length];
    if (hue !== prev && hue !== next) return hue;
  }
  // Unreachable: 4 middle hues vs at most 2 excluded rank neighbors means the
  // loop above always finds a free hue.
  throw new Error('pickMiddleHue exhausted all middle hues');
}

export function hueClassOf(
  hueKeys: ReadonlyMap<string, ProviderHueKey>,
  vendor: string
): ProviderHueKey {
  const key = hueKeys.get(vendor);
  if (!key) throw new Error(`No hue assigned for provider: ${vendor}`);
  return key;
}

/**
 * Default compared curves, derived from the data so a row refresh never
 * leaves a stale hardcoded list: the best row of each top provider plus the
 * steepest measured cliff not already covered, capped.
 */
export function deriveDefaultSelections(
  rows: readonly BenchmarkRow[]
): string[] {
  const ranked = rankProviders(rows);
  const best = bestRowPerProvider(rows);
  const picked = new Map<string, string>();
  for (const vendor of ranked) {
    if (picked.size >= DEFAULT_PROVIDER_COUNT) break;
    picked.set(vendor, best.get(vendor)!.id);
  }
  const pickedIds = new Set(picked.values());
  const cliffCandidates = rows
    .filter((row) => !pickedIds.has(row.id) && row.dropScore > 0)
    .sort((a, b) => b.dropScore - a.dropScore);
  const cliff = cliffCandidates.find((row) => !picked.has(row.vendor));
  if (cliff && picked.size < DEFAULT_SELECTION_CAP)
    picked.set(cliff.vendor, cliff.id);
  return ranked
    .filter((vendor) => picked.has(vendor))
    .map((vendor) => picked.get(vendor)!);
}

/**
 * Chip rail tiers for the model picker. Rows are judged at the common 128K
 * bin (not their last measured endpoint), so unequal coverage cannot promote
 * a truncated curve. A lab can legitimately appear in both tiers. Within a
 * tier, rows are ordered by provider rank and then by shared-bin score.
 */
export const TOP_CONTENDER_COMMON_SCORE = 50;

/**
 * AUC @1M is an aggregate over the measured 8K–512K band, not a pointwise 1M
 * score. It renders as a labeled hollow diamond at the 1M x-position — but
 * only where it cannot masquerade as a measured point: the row must reach
 * the 512K bin (so the band it averages matches the plotted range) and must
 * NOT have a true 1M point (real measurement outranks the aggregate).
 */
export function aucDiamondScore(row: BenchmarkRow): number | null {
  if (row.auc1m == null) return null;
  const has512k = row.points.some((point) => point.tokens === 524288);
  const has1m = row.points.some((point) => point.tokens === 1048576);
  return has512k && !has1m ? row.auc1m : null;
}

export type ChipTier = { label: string; rows: BenchmarkRow[] };

export function groupChipTiers(rows: readonly BenchmarkRow[]): ChipTier[] {
  const rank = new Map(rankProviders(rows).map((vendor, i) => [vendor, i]));
  const byRankThenScore = (a: BenchmarkRow, b: BenchmarkRow) =>
    rank.get(a.vendor)! - rank.get(b.vendor)! || rankCompare(a, b);
  const top = rows
    .filter((row) => row.moderateScore >= TOP_CONTENDER_COMMON_SCORE)
    .sort(byRankThenScore);
  const second = rows
    .filter((row) => row.moderateScore < TOP_CONTENDER_COMMON_SCORE)
    .sort(byRankThenScore);
  return [
    { label: 'Top contenders', rows: top },
    { label: 'Second tier', rows: second },
  ].filter((tier) => tier.rows.length > 0);
}
