import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSourceBeforeGearMs,
  getSourceBehaviorOverlapMs,
  roleBoundaryTiming,
} from './InstructionLayerAuthorityTiming.ts';

test('role boundary timing keeps behavior visible with the active source role', () => {
  assert.equal(getSourceBeforeGearMs(), 990);
  assert.equal(getSourceBehaviorOverlapMs(), 1050);
  assert.ok(getSourceBehaviorOverlapMs() >= getSourceBeforeGearMs());
});

test('role boundary timing preserves source to gear to behavior order', () => {
  assert.ok(roleBoundaryTiming.filterOnMs < roleBoundaryTiming.gearSpinStartMs);
  assert.ok(roleBoundaryTiming.gearSpinStartMs < roleBoundaryTiming.behaviorOnMs);
  assert.ok(roleBoundaryTiming.behaviorOnMs < roleBoundaryTiming.filterOffMs);
});
