import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ASSUME_CACHE_KIB_PER_TOKEN,
  cacheGib,
  needGib,
  overInputCap,
  verdictFor,
  weightsFit,
} from './classifierRequirement.ts';
import type { ClassifierModel } from './classifierTypes.ts';

const STATE = 8192;

const model = (patch: Partial<ClassifierModel> = {}): ClassifierModel => ({
  id: 'm',
  name: 'M',
  lab: 'Lab',
  base: 'base',
  protocol: 'joint',
  params: '1B',
  weights: { gib: 10, stated: '10 GiB BF16', precision: 'BF16' },
  maxInput: { tokens: 65536, basis: 'served' },
  country: 'United States',
  files: 'safetensors',
  filesUrl: null,
  license: 'Apache-2.0',
  engineIds: ['transformers'],
  modalities: { inputs: ['text'], output: 'label' },
  sourceUrl: 'https://example.com/card',
  ...patch,
});

test('a card with no published weight size is untested, never small', () => {
  assert.equal(verdictFor(model({ weights: null }), 24, STATE, 1), 'untested');
  assert.equal(verdictFor(model(), 24, STATE, 1), 'fits');
  assert.equal(
    verdictFor(
      model({ weights: { gib: 50, stated: '50 GB FP32', precision: 'FP32' } }),
      24,
      STATE,
      1
    ),
    'over'
  );
});

test('the cache is the state, the decisions in flight, and one token', () => {
  // 8192 tokens x 256 KiB = 2 GiB, exactly: the assumption is a whole number.
  assert.equal(cacheGib(STATE, 1), 2);
  assert.equal(cacheGib(STATE, 4), 8);
  assert.equal(
    cacheGib(STATE, 16),
    (STATE * 16 * ASSUME_CACHE_KIB_PER_TOKEN) / (1024 * 1024)
  );
});

test('the need is the weights once plus the cache in flight', () => {
  assert.equal(needGib(model(), STATE, 1), 12);
  assert.equal(needGib(model(), STATE, 4), 18);
  assert.equal(needGib(model({ weights: null }), STATE, 1), null);
});

test('a longer state costs more memory without touching the weights', () => {
  const short = needGib(model(), STATE, 1) ?? 0;
  const long = needGib(model(), STATE * 4, 1) ?? 0;
  assert.ok(long > short);
  assert.equal((long - short) / 3, short - 10);
});

test('the cache alone can fail a card whose weights fit', () => {
  // 6 GiB of weights on a 10 GiB machine: the floor fits, the 32K state does
  // not. This is the case the figure exists to show.
  const light = model({
    weights: { gib: 6, stated: '6 GiB BF16', precision: 'BF16' },
  });
  assert.equal(weightsFit(light, 10), true);
  assert.equal(verdictFor(light, 10, STATE * 4, 1), 'over');
  assert.equal(weightsFit(model({ weights: null }), 10), null);
});

test('an unpublished input limit is not a passing one', () => {
  assert.equal(overInputCap(model({ maxInput: null }), STATE), null);
  assert.equal(overInputCap(model(), STATE), false);
  assert.equal(
    overInputCap(model({ maxInput: { tokens: 1024, basis: 'served' } }), STATE),
    true
  );
});

test('the state is judged against the limit, not the lever that set it', () => {
  // A state longer than the published window cannot be prefill at all, so the
  // row states that beside its fit rather than pricing a different number.
  const tight = model({ maxInput: { tokens: 4096, basis: 'served' } });
  assert.equal(overInputCap(tight, 4096), false);
  assert.equal(overInputCap(tight, 4097), true);
});
