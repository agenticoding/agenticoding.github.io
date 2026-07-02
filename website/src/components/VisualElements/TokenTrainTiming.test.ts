import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tokenTrainBeginOffsetMs,
  tokenTrainStaticDistance,
} from './TokenTrainTiming.ts';

test('path spacing stagger derives begin offsets from path length and travel time', () => {
  assert.equal(
    tokenTrainBeginOffsetMs(2, 120, { mode: 'pathSpacing', spacingPx: 24 }, 900),
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
