import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ASSUME_WORKING_SET_KIB_PER_TOKEN,
  exceedsInputCap,
  needGib,
  verdictFor,
  workingSetGib,
} from './retrievalRequirement.ts';
import type { RetrievalModel } from './retrievalTypes.ts';

const model = (patch: Partial<RetrievalModel> = {}): RetrievalModel => ({
  id: 'm',
  name: 'M',
  lab: 'Lab',
  kind: 'embedding',
  base: 'base',
  params: '1B dense',
  weights: { gib: 10, stated: '10 GiB BF16', precision: 'BF16' },
  maxInput: { tokens: 8192, basis: 'served' },
  dims: { width: 1024, note: null },
  score: null,
  country: 'United States',
  files: 'safetensors',
  filesUrl: null,
  license: 'Apache-2.0',
  engineIds: ['transformers'],
  modalities: { inputs: ['text'], output: 'vector' },
  sourceUrl: 'https://example.com/card',
  ...patch,
});

test('the working set is the tokens in flight at the assumed per-token cost', () => {
  const expected =
    (2048 * 8 * ASSUME_WORKING_SET_KIB_PER_TOKEN) / (1024 * 1024);
  assert.equal(workingSetGib(2048, 8), expected);
  // Both levers multiply: a longer text or a wider batch holds more.
  assert.ok(workingSetGib(4096, 8) > workingSetGib(2048, 8));
  assert.ok(workingSetGib(2048, 16) > workingSetGib(2048, 8));
  assert.equal(workingSetGib(2048, 1), workingSetGib(2048, 8) / 8);
});

test('a row needs its weights once plus what the workload holds', () => {
  const weights = 10;
  assert.equal(
    needGib(
      model({
        weights: { gib: weights, stated: '10 GiB BF16', precision: 'BF16' },
      }),
      2048,
      8
    ),
    weights + workingSetGib(2048, 8)
  );
});

test('a card with no published weight size is untested, never small', () => {
  assert.equal(verdictFor(model({ weights: null }), 24, 2048, 1), 'untested');
  assert.equal(verdictFor(model(), 24, 2048, 1), 'fits');
  assert.equal(verdictFor(model({ weights: null }), 1024, 512, 1), 'untested');
});

test('the workload alone can fail weights that fit on their own', () => {
  // 22 GiB of weights fit a 24 GiB card; 32 texts of 8192 tokens do not.
  const heavy = model({
    weights: { gib: 22, stated: '22 GiB BF16', precision: 'BF16' },
    maxInput: { tokens: 32768, basis: 'config' },
  });
  assert.ok(needGib(heavy, 512, 1)! < 24);
  assert.equal(verdictFor(heavy, 24, 8192, 32), 'over');
});

test('a text longer than the published cap is out of range, whatever the budget', () => {
  const short = model({ maxInput: { tokens: 512, basis: 'config' } });
  assert.equal(verdictFor(short, 1024, 2048, 1), 'outOfRange');
  // At the cap exactly, the row still serves the workload.
  assert.equal(verdictFor(short, 1024, 512, 1), 'fits');
});

test('an unknown cap is not a failing one', () => {
  const unknown = model({ maxInput: null });
  assert.equal(exceedsInputCap(unknown, 32768), false);
  assert.equal(verdictFor(unknown, 1024, 32768, 1), 'fits');
});

test('a row that is both too long and too heavy reads as out of range', () => {
  // The length is the reason the reader can act on, so it wins the verdict.
  const both = model({
    weights: { gib: 50, stated: '50 GiB BF16', precision: 'BF16' },
    maxInput: { tokens: 512, basis: 'config' },
  });
  assert.equal(verdictFor(both, 24, 2048, 1), 'outOfRange');
});
