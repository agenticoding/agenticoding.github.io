import assert from 'node:assert/strict';
import test from 'node:test';

import { validationClaimBenchSchedule } from './ValidationClaimBenchSchedule.ts';

test('claim activation, evidence legs, and outcome form one ordered validation flow', () => {
  const schedule = validationClaimBenchSchedule();

  assert.deepEqual(schedule.conditionArrivalMs, [520, 1240, 1960, 2680]);
  assert.deepEqual(
    schedule.evidenceTimings.map(({ startDelayMs }) => startDelayMs),
    [720, 1440, 2160, 2880]
  );
  assert.equal(schedule.outcomeArrivalMs, 3400);
});
