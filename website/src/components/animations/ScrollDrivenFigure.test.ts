import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveScrollPhase } from './scrollPhase.ts';

const input = {
  rectBottom: 1000,
  rectHeight: 600,
  viewportHeight: 1000,
  phaseEnd: 0.5,
  earlyStart: true,
} as const;

test('resolveScrollPhase keeps in-view mounts at phase 0 until user interaction advances them', () => {
  const mount = resolveScrollPhase(input, { isMount: true, effectiveStart: null });
  assert.deepEqual(mount, { phase: 0, isMount: false, effectiveStart: null });

  const anchored = resolveScrollPhase(input, mount);
  assert.equal(anchored.phase, 0);
  assert.equal(anchored.effectiveStart, input.rectBottom);

  const advanced = resolveScrollPhase({ ...input, rectBottom: 900 }, anchored);
  assert.equal(advanced.phase, 0.5);
  assert.equal(advanced.effectiveStart, input.rectBottom);
});

test('resolveScrollPhase snaps to the settled state only when already scrolled past', () => {
  const settledOnMount = resolveScrollPhase({ ...input, rectBottom: 700 }, { isMount: true, effectiveStart: null });
  assert.equal(settledOnMount.phase, 1);

  const degenerate = resolveScrollPhase({ ...input, phaseEnd: 0 }, { isMount: false, effectiveStart: null });
  assert.deepEqual(degenerate, { phase: 1, isMount: false, effectiveStart: null });
});
