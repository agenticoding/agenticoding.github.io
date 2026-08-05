import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOCK_WEIGHT,
  DISPATCH_WEIGHT,
  FINAL_RESPONSE_LABEL,
  PROMPT_LABEL,
  ROOT_AGENT_COUNT,
  ROOT_SCHEDULE,
  SATELLITE_PRIVATE_LABEL,
  SATELLITE_SYNTHESIS_LABEL,
  SUB_AGENT_PROFILES,
  WINDOW_CAPACITY,
  compressionRatio,
  contextContentWeight,
  internalUnits,
  parentContentUnits,
  parentRows,
  satelliteContentUnits,
  satelliteRows,
  synthesisUnits,
  tileAttention,
  windowFill,
} from './SubAgentFanoutModel.ts';
import { zoneOfRow } from './contextRegions.ts';
import { ATTENTION_TIERS } from './attentionModel.ts';

function visibleWeight(rows: ReturnType<typeof parentRows>) {
  return rows
    .filter((row) => !row.collapsed && row.weight > 0)
    .reduce((total, row) => total + row.weight, 0);
}

test('the figure fixes four direct root calls in a serial-then-concurrent schedule', () => {
  assert.equal(ROOT_AGENT_COUNT, 4);
  assert.equal(SUB_AGENT_PROFILES.length, ROOT_AGENT_COUNT);
  assert.deepEqual(ROOT_SCHEDULE, [[0], [1], [2, 3]]);
  assert.deepEqual([...ROOT_SCHEDULE.flat()], [0, 1, 2, 3]);
  assert.equal(Math.max(...ROOT_SCHEDULE.map((stage) => stage.length)), 2);
});

test('the parent stack is the causal root-call timeline', () => {
  const parent = parentRows();
  assert.deepEqual(
    parent.map((row) => row.id),
    [
      'harness',
      'prompt',
      'dispatch-0',
      'synthesis-0',
      'dispatch-1',
      'synthesis-1',
      'dispatch-2',
      'dispatch-3',
      'synthesis-2',
      'synthesis-3',
      'final',
      'headroom',
    ]
  );
  assert.equal(parent.find((row) => row.id === 'prompt')?.label, PROMPT_LABEL);
  assert.equal(
    parent.find((row) => row.id === 'final')?.label,
    FINAL_RESPONSE_LABEL
  );
  assert.equal(zoneOfRow('harness', parent), 'primacy');
  assert.equal(zoneOfRow('final', parent), 'recency');
});

test('every root call lands exactly twice and conserves its synthesis mass', () => {
  const parent = parentRows();
  SUB_AGENT_PROFILES.forEach((profile, index) => {
    const dispatch = parent.find((row) => row.id === `dispatch-${index}`);
    const synthesis = parent.find((row) => row.id === `synthesis-${index}`);
    const satellite = satelliteRows(index);

    assert.equal(dispatch?.label, `${index + 1} · dispatch`);
    assert.equal(dispatch?.weight, DISPATCH_WEIGHT);
    assert.equal(synthesis?.label, `${index + 1} · ${profile.task}`);
    assert.equal(synthesis?.weight, profile.synthesisWeight);
    assert.equal(
      satellite.find((row) => row.id === 'synthesize')?.weight,
      synthesis?.weight
    );
  });
});

test('opaque satellite windows retain independent cost without narrating private work', () => {
  SUB_AGENT_PROFILES.forEach((profile, index) => {
    const satellite = satelliteRows(index);
    assert.deepEqual(
      satellite.map((row) => row.id),
      ['private', 'synthesize', 'headroom']
    );
    assert.equal(
      satellite.find((row) => row.id === 'private')?.label,
      SATELLITE_PRIVATE_LABEL
    );
    assert.equal(
      satellite.find((row) => row.id === 'private')?.weight,
      profile.privateUnits
    );
    assert.equal(
      satellite.find((row) => row.id === 'synthesize')?.label,
      SATELLITE_SYNTHESIS_LABEL
    );
    assert.equal(zoneOfRow('synthesize', satellite), 'recency');
    assert.ok(tileAttention('private', satellite) >= ATTENTION_TIERS.strong);
  });
});

test('all context mass is accounted for in the fixed figure', () => {
  const parent = parentRows();
  assert.equal(visibleWeight(parent), WINDOW_CAPACITY);
  assert.equal(
    parentContentUnits(),
    3 * BLOCK_WEIGHT + 4 * DISPATCH_WEIGHT + synthesisUnits()
  );
  assert.equal(windowFill(parent), parentContentUnits() / WINDOW_CAPACITY);

  SUB_AGENT_PROFILES.forEach((profile, index) => {
    const satellite = satelliteRows(index);
    assert.equal(visibleWeight(satellite), WINDOW_CAPACITY);
    assert.equal(
      satelliteContentUnits(index),
      profile.privateUnits + profile.synthesisWeight
    );
  });

  assert.equal(
    internalUnits(),
    SUB_AGENT_PROFILES.reduce(
      (total, _, index) => total + satelliteContentUnits(index),
      0
    )
  );
  assert.equal(compressionRatio(), internalUnits() / synthesisUnits());
  assert.ok(compressionRatio() > 1);
  assert.equal(contextContentWeight(parent), parentContentUnits());
});
