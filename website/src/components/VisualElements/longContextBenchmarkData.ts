/**
 * Pure-TS benchmark data for the long-context (MRCR) chart and model cards.
 * No React or CSS imports: node-testable, single source for row data and derived
 * fields. The explorer chart/chips and model cards derive display text via
 * longContextBenchmarkModel.ts.
 */

export type BenchmarkPoint = { tokens: number; label: string; score: number };

export type BenchmarkRow = {
  id: string;
  model: string;
  moderateScore: number;
  longScore: number;
  dropScore: number;
  signalTone: 'data' | 'warning';
  // AUC @1M is a band aggregate over the measured 8K–512K range, NOT a pointwise
  // 1M score — render layer decides presentation via aucDiamondScore() in
  // longContextBenchmarkModel.ts.
  auc1m: number | null;
  // Provider is the color/grouping key: every row of a lab shares one hue
  vendor: string;
  benchmark: string;
  mode: string;
  source: string;
  points: BenchmarkPoint[];
  vendorClaims: Array<{ label: string; score: string }>;
  advertisedWindow: string;
};

export const ARENA_SOURCE = 'https://contextarena.ai/';
export const ARENA_PROVENANCE =
  'Context Arena measurement (Google DeepMind MRCR v2 dataset and scorer, OpenRouter runs, retrieved September 2026)';

// Data-driven row construction: one spec per model, derived fields computed once.
type RowSpec = {
  id: string;
  model: string;
  vendor: string;
  mode: string;
  source: string;
  benchmark: string;
  points: BenchmarkPoint[];
  // Band aggregate, not pointwise — see BenchmarkRow.auc1m.
  auc1m: number | null;
  signalTone: 'data' | 'warning';
  vendorClaims: Array<{ label: string; score: string }>;
  advertisedWindow: string;
};

const INDEPENDENT_BINS: Array<{ tokens: number; label: string }> = [
  { tokens: 8192, label: '8K' },
  { tokens: 16384, label: '16K' },
  { tokens: 32768, label: '32K' },
  { tokens: 65536, label: '64K' },
  { tokens: 131072, label: '128K' },
  { tokens: 262144, label: '256K' },
  { tokens: 524288, label: '512K' },
  { tokens: 1048576, label: '1M' },
];

function buildRow(spec: RowSpec): BenchmarkRow {
  if (spec.points.length === 0)
    throw new Error(`Missing points for row: ${spec.id}`);
  const moderatePoint = spec.points.find((point) => point.tokens === 131072);
  if (!moderatePoint)
    throw new Error(
      `Missing 128K bin for row: ${spec.id} — every row must have a 128K measurement`
    );
  const moderateScore = moderatePoint.score;
  const last = spec.points[spec.points.length - 1];
  if (last == null) throw new Error(`Missing last point for row: ${spec.id}`);
  if (spec.advertisedWindow === '')
    throw new Error(`Missing advertisedWindow for row: ${spec.id}`);
  if (!Array.isArray(spec.vendorClaims))
    throw new Error(`Missing vendorClaims for row: ${spec.id}`);
  return {
    ...spec,
    moderateScore,
    longScore: last.score,
    dropScore: moderateScore - last.score,
  };
}

const independent = (
  spec: Omit<RowSpec, 'source' | 'benchmark' | 'points'> & {
    scores: Array<number | null>;
  }
): RowSpec => ({
  ...spec,
  source: ARENA_SOURCE,
  benchmark: 'MRCR v2 8-needle',
  points: INDEPENDENT_BINS.map((bin, i) => ({ bin, score: spec.scores[i] }))
    .filter(
      (p): p is { bin: (typeof INDEPENDENT_BINS)[number]; score: number } =>
        p.score != null
    )
    .map((p) => ({ tokens: p.bin.tokens, label: p.bin.label, score: p.score })),
});

export const benchmarkRows: BenchmarkRow[] = [
  buildRow(
    independent({
      id: 'muse-spark-12',
      vendorClaims: [
        { label: 'AUC', score: '98.5%' },
        { label: 'AUC', score: '98.1%' },
      ],
      advertisedWindow: '1M',
      model: 'Meta Muse Spark 1.2',
      vendor: 'Meta',
      mode: 'default effort (medium)',
      scores: [92.7, 95.1, 90.9, 64.7, 59.4, 55.8, 47.8, null],
      auc1m: 40.9,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'gemini-37-flash',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Google',
      model: 'Gemini 3.7 Flash',
      mode: 'high effort',
      scores: [100, 100, 98.6, 93.1, 88.6, 89.0, 77.7, 63.5],
      auc1m: 78.9,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'gpt-56-sol',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'OpenAI',
      model: 'GPT-5.6 Sol',
      mode: 'max effort',
      scores: [100, 100, 98.0, 98.8, 92.4, 83.5, 61.9, null],
      auc1m: 56.5,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'gpt-55',
      vendorClaims: [{ label: '512K–1M bucket', score: '74.0%' }],
      advertisedWindow: '1.05M',
      vendor: 'OpenAI',
      model: 'GPT-5.5',
      mode: 'medium effort',
      scores: [100, 96.3, 91.5, 85.1, 83.0, 71.9, 57.6, null],
      auc1m: 50.9,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'gpt-56-terra',
      vendorClaims: [
        { label: '256K–512K', score: '89.6%' },
        { label: '512K–1M', score: '72.5%' },
      ],
      advertisedWindow: '1.05M',
      vendor: 'OpenAI',
      model: 'GPT-5.6 Terra',
      mode: 'max effort',
      scores: [98.8, 100.0, 94.3, 89.7, 80.2, 67.9, 49.8, null],
      auc1m: 47.3,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'gpt-56-luna',
      vendorClaims: [
        { label: '256K–512K', score: '41.3%' },
        { label: '512K–1M', score: '41.3%' },
      ],
      advertisedWindow: '1.05M',
      vendor: 'OpenAI',
      model: 'GPT-5.6 Luna',
      mode: 'max effort',
      scores: [96.4, 93.9, 90.2, 71.5, 58.4, 45.1, 37.6, null],
      auc1m: 35.3,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'opus-46',
      vendorClaims: [
        { label: '256K', score: '91.9%' },
        { label: '1M', score: '78.3%' },
      ],
      advertisedWindow: '1M',
      vendor: 'Anthropic',
      model: 'Claude Opus 4.6',
      mode: 'high effort',
      scores: [98.2, 84.4, 86.2, 74.3, 68.1, 69.1, 54.3, null],
      auc1m: 46.9,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'sonnet-5',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Anthropic',
      model: 'Claude Sonnet 5',
      mode: 'max effort',
      scores: [96.4, 94.9, 87.9, 68.0, 52.9, 52.2, 32.0, null],
      auc1m: 33.8,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'haiku-45',
      vendorClaims: [],
      advertisedWindow: '200K',
      vendor: 'Anthropic',
      model: 'Claude Haiku 4.5',
      mode: 'reasoning enabled',
      scores: [82.5, 47.5, 31.5, 17.0, 13.8, null, null, null],
      auc1m: 3.7,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'grok-4-20',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'xAI',
      model: 'Grok 4.20',
      mode: 'reasoning enabled',
      scores: [95.2, 59.9, 61.9, 39, 19.4, 15.9, 11.7, 8.2],
      auc1m: 15.7,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'grok-4-6',
      vendorClaims: [],
      advertisedWindow: '256K',
      vendor: 'xAI',
      model: 'Grok 4.6',
      mode: 'xhigh effort',
      scores: [97.6, 96.1, 89.6, 71.5, 52.6, 47.7, null, null],
      auc1m: 21,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'opus-5',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Anthropic',
      model: 'Claude Opus 5',
      mode: 'max effort',
      scores: [98.7, 99.9, 99.3, 99.9, 91.3, 65.6, 42.5, null],
      auc1m: 45.7,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'glm-5-3',
      vendorClaims: [],
      advertisedWindow: '300K–1M',
      vendor: 'Zhipu',
      model: 'GLM 5.3',
      mode: 'high effort',
      scores: [96.0, 94.9, 94.3, 89.6, 69.3, 55.8, 41.9, null],
      auc1m: 40.9,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'glm-53-flash',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Zhipu',
      model: 'GLM 5.3 Flash',
      mode: 'high effort',
      scores: [93.9, 79.3, 85.9, 75.8, 62.9, 48.7, 39.0, null],
      auc1m: 36.8,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'deepseek-v4-pro-0813',
      vendorClaims: [
        { label: '256K', score: '>82%' },
        { label: '1M', score: '59%' },
      ],
      advertisedWindow: '1M',
      vendor: 'DeepSeek',
      model: 'DeepSeek V4 Pro (0813)',
      mode: 'high effort',
      scores: [98.8, 100, 94.5, 84.1, 57.4, 38.9, 33.4, null],
      auc1m: 33.2,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'deepseek-v4-flash-0731',
      vendorClaims: [],
      advertisedWindow: '1.25M',
      vendor: 'DeepSeek',
      model: 'DeepSeek V4 Flash (0731)',
      mode: 'high effort',
      scores: [95.1, 91.4, 76.6, 72.5, 47.1, 39.6, 28.1, null],
      auc1m: 29.3,
      signalTone: 'data',
    })
  ),
  buildRow(
    independent({
      id: 'qwen-38-max',
      vendorClaims: [{ label: '256K', score: '92.9%' }],
      advertisedWindow: '1M',
      vendor: 'Alibaba',
      model: 'Qwen 3.8 Max',
      mode: 'xhigh effort',
      scores: [98.7, 97.5, 99.3, 96.5, 92.3, 67.7, 29.7, null],
      auc1m: 41.2,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'gemini-31-pro',
      vendorClaims: [
        { label: '128K cumulative avg', score: '84.9%' },
        { label: '1M pointwise', score: '26.3%' },
      ],
      advertisedWindow: '1M',
      vendor: 'Google',
      model: 'Gemini 3.1 Pro (preview)',
      mode: 'high effort',
      scores: [100, 98.8, 94.2, 74.9, 57.6, 47.4, 31.1, 25.9],
      auc1m: 40,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'kimi-k3',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Moonshot',
      model: 'Kimi K3',
      mode: 'max effort',
      scores: [97.5, 89.9, 74.5, 66.5, 38.3, 34.8, 25.3, null],
      auc1m: 26.1,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'minimax-m3',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'MiniMax',
      model: 'MiniMax M3',
      mode: 'reasoning enabled',
      scores: [91.3, 69.3, 52.2, 35.4, 17.4, 18.6, null, null],
      auc1m: 9.2,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'mistral-medium-3-5',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Mistral',
      model: 'Mistral Medium 3.5',
      mode: 'high effort',
      scores: [71.7, 45.2, 24.5, 17.4, 13.2, null, null, null],
      auc1m: 3.5,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'opus-47',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Anthropic',
      model: 'Claude Opus 4.7',
      mode: 'medium effort',
      scores: [82.0, 86.2, 49.4, 23.7, 1.4, 2.7, 8.8, null],
      auc1m: 7.6,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'laguna-s-2-1',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Poolside',
      model: 'Poolside Laguna S 2.1',
      mode: 'reasoning enabled',
      scores: [23.8, 20.3, 14.8, 10.2, 6.4, 4.5, 4.4, null],
      auc1m: 4.3,
      signalTone: 'warning',
    })
  ),
  buildRow(
    independent({
      id: 'laguna-xs-2-1',
      vendorClaims: [],
      advertisedWindow: '1M',
      vendor: 'Poolside',
      model: 'Poolside Laguna XS 2.1',
      mode: 'reasoning enabled',
      scores: [29.9, 18.3, 14.0, 6.8, 4.1, null, null, null],
      auc1m: 1.4,
      signalTone: 'warning',
    })
  ),
];
