import assert from 'node:assert/strict';
import test from 'node:test';

import type { BenchmarkRow } from './longContextBenchmarkData.ts';
import {
  resolveBenchmarkRow,
  type ModelCardBenchmarkRef,
} from './modelCardFitModel.ts';

// Minimal BenchmarkRow fixtures carrying only the fields the resolver reads.
// Models the shipped table: Opus 4.6 and GPT-5.5 are exact; the DeepSeek cards
// resolve to their dated builds (Pro 0813, Flash 0731) by name containment;
// Sonnet has no measured row at all.
const ROWS: BenchmarkRow[] = [
  {
    id: 'opus-46',
    vendor: 'Anthropic',
    model: 'Claude Opus 4.6',
  } as BenchmarkRow,
  { id: 'gpt-55', vendor: 'OpenAI', model: 'GPT-5.5' } as BenchmarkRow,
  {
    id: 'deepseek-v4-pro-0813',
    vendor: 'DeepSeek',
    model: 'DeepSeek V4 Pro (0813)',
  } as BenchmarkRow,
  {
    id: 'deepseek-v4-flash-0731',
    vendor: 'DeepSeek',
    model: 'DeepSeek V4 Flash (0731)',
  } as BenchmarkRow,
];

// Mirrors the ModelCardFitExplorer CARDS[] fields (id/provider/name only).
const CARDS: readonly ModelCardBenchmarkRef[] = [
  { benchmarkId: 'opus-46', provider: 'Anthropic', name: 'Claude Opus 4.6' },
  {
    benchmarkId: 'sonnet-46',
    provider: 'Anthropic',
    name: 'Claude Sonnet 4.6',
  },
  { benchmarkId: 'gpt-55', provider: 'OpenAI', name: 'GPT-5.5' },
  {
    benchmarkId: 'deepseek-v4-flash',
    provider: 'DeepSeek',
    name: 'DeepSeek V4 Flash',
  },
  {
    benchmarkId: 'deepseek-v4-pro',
    provider: 'DeepSeek',
    name: 'DeepSeek V4 Pro',
  },
];

test('cards with a measured row resolve to that row', () => {
  assert.equal(resolveBenchmarkRow(CARDS[0], ROWS)?.id, 'opus-46');
  assert.equal(resolveBenchmarkRow(CARDS[2], ROWS)?.id, 'gpt-55');
});

test('suffixed builds resolve by name containment, not the exact id', () => {
  assert.equal(resolveBenchmarkRow(CARDS[4], ROWS)?.id, 'deepseek-v4-pro-0813');
  assert.equal(
    resolveBenchmarkRow(CARDS[3], ROWS)?.id,
    'deepseek-v4-flash-0731'
  );
});

test('a card with no measured row resolves to null instead of throwing', () => {
  assert.equal(resolveBenchmarkRow(CARDS[1], ROWS), null); // Sonnet
});

test('unknown providers never throw and return null', () => {
  assert.equal(
    resolveBenchmarkRow(
      { benchmarkId: 'nope', provider: 'Nonexistent', name: 'Nope' },
      ROWS
    ),
    null
  );
});

test('resolve is case-insensitive', () => {
  assert.equal(
    resolveBenchmarkRow(
      {
        benchmarkId: 'missing',
        provider: 'Anthropic',
        name: 'CLAUDE OPUS 4.6',
      },
      ROWS
    )?.id,
    'opus-46'
  );
  assert.equal(
    resolveBenchmarkRow(
      { benchmarkId: 'missing', provider: 'DeepSeek', name: 'deepseek v4 pro' },
      ROWS
    )?.id,
    'deepseek-v4-pro-0813'
  );
});

test('duplicate-provider: Pro query does not match Flash when Flash appears first', () => {
  const dupRows: BenchmarkRow[] = [
    {
      id: 'flash',
      vendor: 'DeepSeek',
      model: 'DeepSeek V4 Flash (0731)',
    } as BenchmarkRow,
    {
      id: 'pro',
      vendor: 'DeepSeek',
      model: 'DeepSeek V4 Pro (0813)',
    } as BenchmarkRow,
  ];
  assert.equal(
    resolveBenchmarkRow(
      { benchmarkId: 'missing', provider: 'DeepSeek', name: 'DeepSeek V4 Pro' },
      dupRows
    )?.id,
    'pro'
  );
  assert.equal(
    resolveBenchmarkRow(
      {
        benchmarkId: 'missing',
        provider: 'DeepSeek',
        name: 'DeepSeek V4 Flash',
      },
      dupRows
    )?.id,
    'flash'
  );
});

// Direction-2 containment: card name is LONGER than the row model string,
// so name.includes(row.model) fires instead of row.model.includes(name).
test('direction-2 containment: card name longer than row model resolves via name.includes', () => {
  const dir2Rows: BenchmarkRow[] = [
    {
      id: 'ds-pro',
      vendor: 'DeepSeek',
      model: 'DeepSeek V4 Pro',
    } as BenchmarkRow,
  ];
  const card = {
    benchmarkId: 'missing',
    provider: 'DeepSeek',
    name: 'DeepSeek V4 Pro 0813',
  };
  // Direction 1: 'deepseek v4 pro'.includes('deepseek v4 pro 0813') → false
  // Direction 2: 'deepseek v4 pro 0813'.includes('deepseek v4 pro') → true
  const result = resolveBenchmarkRow(card, dir2Rows);
  assert.equal(result?.id, 'ds-pro');
});

// Ambiguity: name matches multiple rows; first in array order wins.
// Document this rule on resolveBenchmarkRow.
test('ambiguity: name matching multiple rows resolves to first in array order', () => {
  const opusRows: BenchmarkRow[] = [
    {
      id: 'opus-47',
      vendor: 'Anthropic',
      model: 'Claude Opus 4.7',
    } as BenchmarkRow,
    {
      id: 'opus-46',
      vendor: 'Anthropic',
      model: 'Claude Opus 4.6',
    } as BenchmarkRow,
  ];
  const card = {
    benchmarkId: 'missing',
    provider: 'Anthropic',
    name: 'Claude Opus',
  };
  // Both rows match direction 1: row.model.includes('claude opus').
  // First match in array order wins.
  const result = resolveBenchmarkRow(card, opusRows);
  assert.equal(result?.id, 'opus-47');
});
