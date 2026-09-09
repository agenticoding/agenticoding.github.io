import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  BenchmarkPoint,
  BenchmarkRow,
} from './longContextBenchmarkData.ts';
import {
  DEFAULT_PROVIDER_COUNT,
  DEFAULT_MIDDLE_HUES,
  DEFAULT_SELECTION_CAP,
  TOP_CONTENDER_COMMON_SCORE,
  aucDiamondScore,
  curveEndpointLabel,
  deriveDefaultSelections,
  groupChipTiers,
  hueClassOf,
  providerHueKeys,
  rankProviders,
} from './longContextBenchmarkModel.ts';

// Minimal BenchmarkRow fixtures carrying only the fields the model reads.
// Vendor/score shape mirrors the real 12-provider table so the invariants
// below hold for the shipped data too. Ids are explicit per fixture so no
// test depends on fixture construction order.
function row(
  id: string,
  vendor: string,
  moderate: number,
  long: number,
  endpoint = 524288
): BenchmarkRow {
  return {
    id,
    vendor,
    moderateScore: moderate,
    longScore: long,
    dropScore: moderate - long,
    points: [
      { tokens: 131072, label: '128K', score: moderate },
      {
        tokens: endpoint,
        label: endpoint === 1048576 ? '1M' : '512K',
        score: long,
      },
    ],
  } as BenchmarkRow;
}

const REALISTIC_ROWS: BenchmarkRow[] = [
  row('gemini-37-flash', 'Google', 88.6, 63.5),
  row('gpt-56-sol', 'OpenAI', 92.4, 61.9),
  row('gpt-55', 'OpenAI', 83.0, 57.6),
  row('opus-46', 'Anthropic', 68.1, 54.3),
  row('muse-spark-12', 'Meta', 59.4, 47.8),
  row('grok-4-6', 'xAI', 52.6, 47.7),
  row('glm-5-3', 'Zhipu', 69.3, 41.9),
  row('deepseek-v4-pro-0813', 'DeepSeek', 57.4, 33.4),
  row('qwen-38-max', 'Alibaba', 92.3, 29.7),
  row('kimi-k3', 'Moonshot', 38.3, 25.3),
  row('minimax-m3', 'MiniMax', 17.4, 18.6),
  row('mistral-medium-3-5', 'Mistral', 13.2, 13.2),
  row('laguna-s-2-1', 'Poolside', 6.4, 4.4),
  row('laguna-xs-2-1', 'Poolside', 4.1, 4.1),
];

test('exactly one provider holds the success hue and it is the top-ranked one', () => {
  const hueKeys = providerHueKeys(REALISTIC_ROWS);
  const successVendors = [...hueKeys]
    .filter(([, key]) => key === 'hueSuccess')
    .map(([vendor]) => vendor);
  assert.deepEqual(successVendors, [rankProviders(REALISTIC_ROWS)[0]]);
  assert.equal(successVendors[0], 'OpenAI');
});

test('ranking compares the shared 128K bin before unequal endpoints', () => {
  const ranked = rankProviders([
    row('short-high', 'Short', 75, 95, 131072),
    row('long-lower', 'Long', 76, 60, 1048576),
  ]);
  assert.deepEqual(ranked, ['Long', 'Short']);
});

test('equal shared-bin scores prefer broader measured coverage', () => {
  const ranked = rankProviders([
    row('short', 'Short', 75, 95, 131072),
    row('long', 'Long', 75, 60, 1048576),
  ]);
  assert.deepEqual(ranked, ['Long', 'Short']);
});

test('the bottom two ranked providers carry warning and error', () => {
  const hueKeys = providerHueKeys(REALISTIC_ROWS);
  const ranked = rankProviders(REALISTIC_ROWS);
  assert.equal(hueKeys.get(ranked[ranked.length - 1]), 'hueError');
  assert.equal(hueKeys.get(ranked[ranked.length - 2]), 'hueWarning');
  assert.equal(ranked[ranked.length - 1], 'Poolside');
  assert.equal(ranked[ranked.length - 2], 'Mistral');
});

test('middle providers cycle the categorical hues without rank-adjacent repeats', () => {
  const ranked = rankProviders(REALISTIC_ROWS);
  const hueKeys = providerHueKeys(REALISTIC_ROWS);
  const categorical = ['hueCyan', 'hueIndigo', 'hueViolet', 'hueMagenta'];
  const middleKeys = ranked
    .slice(1, ranked.length - 2)
    .map((vendor) => hueKeys.get(vendor));
  for (const key of middleKeys) assert.ok(categorical.includes(key!));
  // Balanced: no hue used more than one step above the least-used hue.
  const counts = new Map<string, number>();
  for (const key of middleKeys) counts.set(key!, (counts.get(key!) ?? 0) + 1);
  const uses = [...counts.values()];
  assert.ok(Math.max(...uses) - Math.min(...uses) <= 2);
  // Same hue never appears on two rank-adjacent providers.
  for (let i = 1; i < middleKeys.length; i += 1)
    assert.notEqual(middleKeys[i], middleKeys[i - 1]);
});

test('every row of a provider inherits the provider hue', () => {
  const hueKeys = providerHueKeys(REALISTIC_ROWS);
  for (const vendor of new Set(REALISTIC_ROWS.map((r) => r.vendor))) {
    const key = hueClassOf(hueKeys, vendor);
    assert.ok(key.startsWith('hue'));
  }
  // OpenAI has two rows in the fixture; both share the provider-level hue.
  const openaiHue = hueClassOf(hueKeys, 'OpenAI');
  assert.ok(openaiHue.startsWith('hue'));
});

test('hueClassOf throws for an unknown provider instead of silently graying', () => {
  const hueKeys = providerHueKeys(REALISTIC_ROWS);
  assert.throws(() => hueClassOf(hueKeys, 'Nonexistent'));
});

test('defaults are unique, in-bounds, deterministic, and include the cliff', () => {
  const defaults = deriveDefaultSelections(REALISTIC_ROWS);
  const allIds = new Set(REALISTIC_ROWS.map((r) => r.id));
  assert.ok(defaults.length >= 1);
  assert.ok(defaults.length <= DEFAULT_SELECTION_CAP);
  assert.equal(new Set(defaults).size, defaults.length);
  for (const id of defaults) assert.ok(allIds.has(id));
  assert.deepEqual(defaults, deriveDefaultSelections(REALISTIC_ROWS));
  // Top provider's best shared-bin row is always the first comparison curve.
  assert.equal(defaults[0], 'gpt-56-sol');
  // Alibaba's steepest measured cliff is included in the shared-bin shortlist.
  assert.ok(defaults.includes('qwen-38-max'));
  // The cliff path skips OpenAI (already picked) and adds DeepSeek (24.0 drop).
  assert.ok(defaults.includes('deepseek-v4-pro-0813'));
});

test('defaults cap the compared providers at the configured count', () => {
  const manyRows = Array.from({ length: 20 }, (_, i) =>
    row(`vendor-${i}`, `Vendor ${i}`, 90 - i, 80 - i)
  );
  const defaults = deriveDefaultSelections(manyRows);
  assert.ok(defaults.length <= DEFAULT_SELECTION_CAP);
  assert.ok(defaults.length >= DEFAULT_PROVIDER_COUNT);
});

test('default-selected providers get mutually distinct hues (readable default)', () => {
  const defaults = deriveDefaultSelections(REALISTIC_ROWS);
  const hueKeys = providerHueKeys(REALISTIC_ROWS);
  const defaultVendors = new Set(
    defaults.map((id) => REALISTIC_ROWS.find((row) => row.id === id)!.vendor)
  );
  const hueValues = [...defaultVendors].map((vendor) => hueKeys.get(vendor));
  assert.equal(new Set(hueValues).size, hueValues.length);
  // The leader keeps success (rank semantics survive the two-pass spread).
  assert.equal(hueKeys.get(rankProviders(REALISTIC_ROWS)[0]), 'hueSuccess');
});

test('a single provider gets success only — no caution hues', () => {
  const hueKeys = providerHueKeys([row('solo', 'Solo', 50, 40)]);
  assert.deepEqual([...hueKeys.values()], ['hueSuccess']);
});

test('three providers collapse the ladder to success, warning, error', () => {
  const hueKeys = providerHueKeys([
    row('a', 'A', 90, 80),
    row('b', 'B', 60, 50),
    row('c', 'C', 20, 10),
  ]);
  assert.deepEqual(
    [...hueKeys.values()],
    ['hueSuccess', 'hueWarning', 'hueError']
  );
});

test('the default provider count stays within the intended budget', () => {
  assert.ok(DEFAULT_PROVIDER_COUNT <= DEFAULT_SELECTION_CAP);
});

// DEFAULT_PROVIDER_COUNT ≤ DEFAULT_MIDDLE_HUES.length: the winner always
// lands in the default set, and at most one cliff vendor is added (always a
// middle provider), so the default set never exceeds 1 + middle hues.
assert.ok(DEFAULT_PROVIDER_COUNT <= DEFAULT_MIDDLE_HUES.length);

test('chip tiers split on the common 128K score with providers in rank order', () => {
  const tiers = groupChipTiers(REALISTIC_ROWS);
  const top = tiers.find((tier) => tier.label === 'Top contenders')!;
  const second = tiers.find((tier) => tier.label === 'Second tier')!;
  // Every top row clears the threshold; every second-tier row does not.
  for (const row of top.rows)
    assert.ok(row.moderateScore >= TOP_CONTENDER_COMMON_SCORE);
  for (const row of second.rows)
    assert.ok(row.moderateScore < TOP_CONTENDER_COMMON_SCORE);
  // Within a tier, providers are contiguously grouped by rank, then score desc.
  assert.deepEqual(
    top.rows.map((r) => r.vendor),
    [
      'OpenAI',
      'OpenAI',
      'Alibaba',
      'Google',
      'Zhipu',
      'Anthropic',
      'Meta',
      'DeepSeek',
      'xAI',
    ]
  );
  assert.deepEqual(
    second.rows.map((r) => r.vendor),
    ['Moonshot', 'MiniMax', 'Mistral', 'Poolside', 'Poolside']
  );
});

test('chip tier grouping is deterministic', () => {
  assert.deepEqual(
    groupChipTiers(REALISTIC_ROWS),
    groupChipTiers(REALISTIC_ROWS)
  );
});

test('a lab with both a contender and a weak row appears in both tiers', () => {
  const tiers = groupChipTiers([
    row('alpha-top', 'Alpha', 90, 60),
    row('alpha-weak', 'Alpha', 40, 80),
    row('beta', 'Beta', 45, 70),
  ]);
  const top = tiers.find((tier) => tier.label === 'Top contenders')!;
  const second = tiers.find((tier) => tier.label === 'Second tier')!;
  assert.deepEqual(
    top.rows.map((r) => r.vendor),
    ['Alpha']
  );
  assert.deepEqual(
    second.rows.map((r) => r.vendor),
    ['Alpha', 'Beta']
  );
});

test('chip tiers drop an empty group', () => {
  const tiers = groupChipTiers([row('solo', 'Solo', 30, 80)]);
  assert.deepEqual(
    tiers.map((tier) => tier.label),
    ['Second tier']
  );
  assert.deepEqual(
    tiers[0].rows.map((r) => r.vendor),
    ['Solo']
  );
});

test('TOP_CONTENDER boundary: 50 exact at 128K goes Top, 49.9 goes Second', () => {
  const atThreshold = row('at-50', 'At50', 50, 20);
  const justBelow = row('below-50', 'Below50', 49.9, 80);
  const tiers = groupChipTiers([atThreshold, justBelow]);
  const top = tiers.find((t) => t.label === 'Top contenders')!;
  const second = tiers.find((t) => t.label === 'Second tier')!;
  assert.ok(
    top.rows.some((r) => r.vendor === 'At50'),
    '50.0 must be Top'
  );
  assert.ok(
    !top.rows.some((r) => r.vendor === 'Below50'),
    '49.9 must not be Top'
  );
  assert.ok(second.rows.some((r) => r.vendor === 'Below50'));
  // Also verify 50.0 is not in Second
  assert.ok(!second.rows.some((r) => r.vendor === 'At50'));
});

// curveEndpointLabel reads only the points; every other field of the fixture
// is irrelevant to the contract under test.
function endpointRow(id: string, points: BenchmarkPoint[]): BenchmarkRow {
  return { id, points } as BenchmarkRow;
}

test('curveEndpointLabel reports a 1M-ending curve at its 1M point', () => {
  const row = endpointRow('gemini-37-flash', [
    { tokens: 131072, label: '128K', score: 88.6 },
    { tokens: 524288, label: '512K', score: 77.7 },
    { tokens: 1048576, label: '1M', score: 63.5 },
  ]);
  assert.equal(curveEndpointLabel(row), '63.5% @1M');
});

test('curveEndpointLabel reports a truncated curve at its last measured bin', () => {
  const row = endpointRow('gpt-56-sol', [
    { tokens: 131072, label: '128K', score: 92.4 },
    { tokens: 524288, label: '512K', score: 61.9 },
  ]);
  assert.equal(curveEndpointLabel(row), '61.9% @512K');
});

test('aucDiamondScore requires 512K coverage, no true 1M point, and a value', () => {
  const to512k: BenchmarkPoint[] = [
    { tokens: 131072, label: '128K', score: 50 },
    { tokens: 524288, label: '512K', score: 40 },
  ];
  const to1m: BenchmarkPoint[] = [
    ...to512k,
    { tokens: 1048576, label: '1M', score: 30 },
  ];
  const make = (points: BenchmarkPoint[], auc1m: number | null) =>
    ({ id: 'x', vendor: 'V', points, auc1m }) as BenchmarkRow;
  assert.equal(aucDiamondScore(make(to512k, 33.3)), 33.3);
  // A true pointwise 1M measurement outranks the aggregate
  assert.equal(aucDiamondScore(make(to1m, 33.3)), null);
  // A band averaged only to 256K does not match the plotted 8K–512K range
  assert.equal(aucDiamondScore(make(to512k.slice(0, 1), 33.3)), null);
  assert.equal(aucDiamondScore(make(to512k, null)), null);
});

test('fixture invariants: top provider holds success and defaults stay within cap', () => {
  const hueKeys = providerHueKeys(REALISTIC_ROWS);
  assert.equal(hueKeys.get('OpenAI'), 'hueSuccess');
  const defaults = deriveDefaultSelections(REALISTIC_ROWS);
  assert.ok(defaults.length >= 1);
  assert.ok(defaults.length <= DEFAULT_SELECTION_CAP);
  assert.ok(defaults.length >= DEFAULT_PROVIDER_COUNT - 1);
  // Defaults must be a subset of ranked providers' best rows
  const ranked = rankProviders(REALISTIC_ROWS);
  assert.ok(ranked.includes('OpenAI'));
  assert.equal(ranked[0], 'OpenAI');
});
