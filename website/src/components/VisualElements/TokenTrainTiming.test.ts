import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tokenTrainBeginOffsetMs,
  tokenTrainOpacityKeyTimes,
  trainArrivalMs,
  tokenTrainStaticDistance,
} from './TokenTrainTiming.ts';

test('path spacing stagger derives begin offsets from path length and travel time', () => {
  assert.equal(
    tokenTrainBeginOffsetMs(
      2,
      120,
      { mode: 'pathSpacing', spacingPx: 24 },
      900
    ),
    360
  );
});

test('fixed step stagger keeps narrative beats independent of connector length', () => {
  assert.equal(
    tokenTrainBeginOffsetMs(3, 44, { mode: 'fixedStep', stepMs: 120 }, 900),
    360
  );
});

test('fixed step static placement preserves reduced-motion train order', () => {
  assert.equal(
    tokenTrainStaticDistance(2, 90, { mode: 'fixedStep', stepMs: 100 }, 900),
    20
  );
});

test('fixed step stagger keeps short connector trains inside a beat', () => {
  const tokenCount = 3;
  const lastBeginMs = tokenTrainBeginOffsetMs(
    tokenCount - 1,
    44,
    { mode: 'fixedStep', stepMs: 210 },
    420
  );

  assert.equal(lastBeginMs + 420 + 100, 940);
});

test('arrival includes the train start delay and travel time', () => {
  assert.equal(
    trainArrivalMs({
      startDelayMs: 720,
      cycleMs: 6400,
      travelMs: 520,
      fadeMs: 160,
    }),
    1240
  );
});

test('opacity key times stay monotonic for short beat windows', () => {
  const keyTimes = tokenTrainOpacityKeyTimes({
    cycleMs: 13940,
    travelMs: 520,
    fadeMs: 120,
  });

  assert.deepEqual(
    [...keyTimes].sort((a, b) => a - b),
    keyTimes
  );
});
