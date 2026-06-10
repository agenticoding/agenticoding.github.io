import assert from 'node:assert/strict';
import test from 'node:test';
import { scrollElementRevealProgress } from './scrollElementReveal.ts';

const baseInput = {
  phaseEnd: 0.5,
  viewportHeight: 1000,
  figureHeight: 800,
  elementTop: 200,
  elementHeight: 100,
  earlyStart: true,
} as const;

test('scrollElementRevealProgress clamps and interpolates between start and end', () => {
  const initial = scrollElementRevealProgress({ ...baseInput, phase: 0 });
  assert.ok(Math.abs(initial.start - (2 / 9)) < 1e-12);
  assert.ok(Math.abs(initial.end - (5 / 6)) < 1e-12);
  assert.equal(initial.progress, 0);

  const midpoint = scrollElementRevealProgress({
    ...baseInput,
    phase: (initial.start + initial.end) / 2,
  });
  assert.ok(Math.abs(midpoint.progress - 0.5) < 1e-12);

  const settled = scrollElementRevealProgress({ ...baseInput, phase: 1 });
  assert.equal(settled.progress, 1);
});

test('scrollElementRevealProgress completes earlier on mobile when settleAtViewportFraction is 0.6', () => {
  const desktop = scrollElementRevealProgress({ ...baseInput, phase: 0, settleAtViewportFraction: 0.5 });
  const mobile = scrollElementRevealProgress({ ...baseInput, phase: 0, settleAtViewportFraction: 0.6 });

  assert.equal(mobile.start, desktop.start);
  assert.ok(mobile.end < desktop.end);
});

test('scrollElementRevealProgress keeps opacity near zero immediately after the reveal starts', () => {
  const { start, end } = scrollElementRevealProgress({ ...baseInput, phase: 0 });
  const justAfterStart = scrollElementRevealProgress({
    ...baseInput,
    phase: start + (end - start) * 0.05,
  });

  assert.ok(justAfterStart.progress > 0);
  assert.ok(justAfterStart.progress < 0.1);
});

test('scrollElementRevealProgress respects earlyStart=false and degenerate ranges', () => {
  const early = scrollElementRevealProgress({ ...baseInput, phase: 0, earlyStart: true });
  const late = scrollElementRevealProgress({ ...baseInput, phase: 0, earlyStart: false });
  assert.ok(late.start <= early.start);
  assert.ok(late.end <= early.end);
  assert.ok(late.progress >= early.progress);

  const degenerate = scrollElementRevealProgress({
    ...baseInput,
    phase: 0.5,
    phaseEnd: 0,
  });
  assert.equal(degenerate.start, 1);
  assert.equal(degenerate.end, 1);
  assert.equal(degenerate.progress, 0);
});
