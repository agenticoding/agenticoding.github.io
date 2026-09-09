import assert from 'node:assert/strict';
import test from 'node:test';

import { benchmarkRows } from './longContextBenchmarkData.ts';
import {
  aucDiamondScore,
  deriveDefaultSelections,
  providerHueKeys,
} from './longContextBenchmarkModel.ts';

// Invariants over the shipped rows. No hardcoded score values beyond the
// structural contract, so a data refresh never breaks these tests.

const MRCR_128K_TOKENS = 131072;

test('shipped rows have unique ids', () => {
  const ids = benchmarkRows.map((row) => row.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('shipped rows have structurally valid vendor claims', () => {
  for (const row of benchmarkRows) {
    for (const claim of row.vendorClaims) {
      assert.ok(
        claim.label.length > 0,
        `row ${row.id}: vendor claim label is empty`
      );
      assert.ok(
        claim.score.length > 0,
        `row ${row.id}: vendor claim score is empty`
      );
    }
    assert.ok(
      row.advertisedWindow.length > 0,
      `row ${row.id}: advertisedWindow is empty`
    );
  }
});

test('every shipped row has a 128K bin and moderateScore equals it', () => {
  for (const row of benchmarkRows) {
    const moderate = row.points.find(
      (point) => point.tokens === MRCR_128K_TOKENS
    );
    assert.ok(moderate, `row ${row.id} is missing a 128K bin`);
    assert.equal(row.moderateScore, moderate.score, `row ${row.id}`);
  }
});

test('shipped rows have ascending, unique point tokens', () => {
  for (const row of benchmarkRows) {
    const tokens = row.points.map((point) => point.tokens);
    const sorted = [...tokens].sort((a, b) => a - b);
    assert.deepEqual(tokens, sorted, `row ${row.id} tokens not ascending`);
    assert.equal(new Set(tokens).size, tokens.length, `row ${row.id}`);
  }
});

test('longScore equals the last point score for shipped rows', () => {
  for (const row of benchmarkRows) {
    const last = row.points[row.points.length - 1];
    assert.ok(last, `row ${row.id} has no points`);
    assert.equal(row.longScore, last.score, `row ${row.id}`);
  }
});

test('dropScore equals moderateScore minus longScore', () => {
  for (const row of benchmarkRows) {
    assert.equal(
      row.dropScore,
      row.moderateScore - row.longScore,
      `row ${row.id}`
    );
  }
});

test('model-layer derivations run on shipped data and are deterministic', () => {
  const hueKeys = providerHueKeys(benchmarkRows);
  const defaults = deriveDefaultSelections(benchmarkRows);
  assert.ok(hueKeys.size > 0);
  assert.ok(defaults.length > 0);
  assert.deepEqual(hueKeys, providerHueKeys(benchmarkRows));
  assert.deepEqual(defaults, deriveDefaultSelections(benchmarkRows));
});

test('default-selected providers on benchmarkRows have mutually distinct hues', () => {
  const defaults = deriveDefaultSelections(benchmarkRows);
  const hueKeys = providerHueKeys(benchmarkRows);
  const defaultVendors = new Set(
    defaults.map((id) => benchmarkRows.find((r) => r.id === id)!.vendor)
  );
  const hueValues = [...defaultVendors].map((vendor) => hueKeys.get(vendor));
  assert.equal(new Set(hueValues).size, hueValues.length);
});

// The diamond is an aggregate, so it must never appear where a real 1M
// measurement exists, and every shipped row must carry the value.
test('shipped rows: no true-1M row gets an AUC diamond; every row carries auc1m', () => {
  for (const row of benchmarkRows) {
    assert.notEqual(row.auc1m, null, `row ${row.id} missing auc1m`);
    if (row.points.some((point) => point.tokens === 1048576))
      assert.equal(aucDiamondScore(row), null, `row ${row.id}`);
  }
  // The layer must actually exist: 512K-capped rows produce diamonds
  assert.ok(benchmarkRows.some((row) => aucDiamondScore(row) !== null));
});
