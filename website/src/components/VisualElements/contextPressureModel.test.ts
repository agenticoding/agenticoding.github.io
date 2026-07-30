import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONTEXT_PRESSURE,
  allocateTurns,
  contextTotal,
  drainToFit,
  effectiveFill,
  effectiveWindow,
  taskSeverity,
  toolDefinitionTokens,
} from './contextPressureModel.ts';

test('1M model reserves a proportional compaction budget', () => {
  assert.equal(CONTEXT_PRESSURE.totalWindow, 1_000_000);
  assert.equal(effectiveWindow(true), 835_000);
  assert.equal(effectiveWindow(false), 1_000_000);
});

test('drain solver fills the effective budget without exceeding it', () => {
  const result = drainToFit(
    {
      toolDefs: 335_000,
      contextFiles: 200_000,
      skillsMeta: 500,
      conversation: 620_000,
    },
    effectiveWindow(true)
  );

  assert.equal(contextTotal(result.actual), effectiveWindow(true));
  assert.equal(result.drained.conversation, 325_100);
  assert.equal(result.compactionTriggered, true);
  assert.equal(effectiveFill(result.actual, effectiveWindow(true)), 1);
});

test('turn allocation exactly represents retained conversation', () => {
  const turns = allocateTurns(120, 5, 274_900);
  const tokens = turns.reduce((sum, turn) => sum + turn.tokens, 0);

  assert.equal(tokens, 274_900);
  assert.ok(turns.some((turn) => turn.compacted));
  assert.ok(turns.at(-1)?.tokens === 9_000);
});

test('middle task severity uses the canonical zone attention, not its exact offset', () => {
  assert.equal(taskSeverity(0.3, 0.9), 'critical');
  assert.equal(taskSeverity(0.7, 0.9), 'critical');
  assert.equal(taskSeverity(0.1, 0.9), 'primacy');
  assert.equal(taskSeverity(0.9, 0.9), 'recency');
});

test('deferred tool loading is cheaper than eager loading for the same catalog', () => {
  assert.ok(toolDefinitionTokens(500, true) < toolDefinitionTokens(500, false));
});
