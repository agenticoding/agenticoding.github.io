import { strict as assert } from 'node:assert';
import test from 'node:test';

import { formatClock } from './clock.ts';

test('formatClock renders m:ss and h:mm:ss and floors bad input', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(999), '0:00');
  assert.equal(formatClock(1_000), '0:01');
  assert.equal(formatClock(61_000), '1:01');
  assert.equal(formatClock(3_599_999), '59:59');
  assert.equal(formatClock(3_600_000), '1:00:00');
  assert.equal(formatClock(3_661_000), '1:01:01');
  assert.equal(formatClock(Number.NaN), '0:00');
  assert.equal(formatClock(-5_000), '0:00');
});
