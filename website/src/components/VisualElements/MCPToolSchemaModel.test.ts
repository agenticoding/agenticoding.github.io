import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOCK_WEIGHT,
  CATALOG_LIMITS,
  LAZY_STARTUP_WEIGHT,
  MIX_ROW_WEIGHT,
  PROMPT_LABEL,
  SCHEMA_EXPANSION_WEIGHT,
  TASK_SCHEMA_CAPABILITIES,
  TOOL_SEARCH_DEFINITION_WEIGHT,
  TOOL_SEARCH_ROUNDS,
  TOOL_SEARCH_TURN_WEIGHT,
  WINDOW_CAPACITY,
  contextContentWeight,
  eagerRows,
  lazyRows,
  modelMCPToolSchema,
  tileAttention,
  toolSearchRoundCount,
  windowFill,
  type MCPContextRow,
} from './MCPToolSchemaModel.ts';
import { zoneOfRow, type ContextRegionRow } from './contextRegions.ts';
import { ZONE_FRACTIONS } from './contextZones.ts';
import { ATTENTION_TIERS } from './attentionModel.ts';

function visibleRows(rows: readonly ContextRegionRow[]) {
  return rows.filter((row) => !row.collapsed && row.weight > 0);
}

function taskTrace(rows: readonly MCPContextRow[]) {
  return rows
    .filter(
      (row) =>
        !row.collapsed &&
        row.weight > 0 &&
        (row.id === 'prompt' ||
          row.id.startsWith('work-') ||
          row.id === 'final')
    )
    .map(({ id, label }) => ({ id, label }));
}

function centerFraction(rowId: string, rows: readonly ContextRegionRow[]) {
  const content = visibleRows(rows).filter((row) => !row.spacer);
  const total = content.reduce((sum, row) => sum + row.weight, 0);
  let before = 0;
  for (const row of content) {
    if (row.id === rowId) return (before + row.weight / 2) / total;
    before += row.weight;
  }
  throw new Error(`no content row ${rowId}`);
}

test('zones derive from the shared fractional spec, not pixel bands', () => {
  const rows = [
    { id: 'a', weight: 25 },
    { id: 'b', weight: 50 },
    { id: 'c', weight: 25 },
  ];
  assert.equal(zoneOfRow('a', rows), 'primacy');
  assert.equal(zoneOfRow('b', rows), 'middle');
  assert.equal(zoneOfRow('c', rows), 'recency');
});

test('eager schema block expands into the middle before the fixed task', () => {
  const atMin = centerFraction('schemas', eagerRows(CATALOG_LIMITS.min));
  const atMax = centerFraction('schemas', eagerRows(CATALOG_LIMITS.max));

  assert.ok(atMin >= ZONE_FRACTIONS.primacyEnd);
  assert.ok(atMin < ZONE_FRACTIONS.primacyEnd + 0.1);
  assert.ok(atMax > atMin);
  assert.equal(zoneOfRow('schemas', eagerRows(CATALOG_LIMITS.max)), 'middle');
});

test('eager schema attention weakens as catalog breadth increases', () => {
  const atMin = tileAttention('schemas', eagerRows(CATALOG_LIMITS.min));
  const atMax = tileAttention('schemas', eagerRows(CATALOG_LIMITS.max));

  assert.ok(atMin >= ATTENTION_TIERS.strong);
  assert.ok(atMax < ATTENTION_TIERS.strong);
});

test('both strategies retain two ordinary task turns', () => {
  const eager = eagerRows(CATALOG_LIMITS.min);
  const lazy = lazyRows(CATALOG_LIMITS.min);
  const trace = taskTrace(eager);

  assert.deepEqual(taskTrace(lazy), trace);
  assert.deepEqual(trace[0], { id: 'prompt', label: PROMPT_LABEL });
  assert.deepEqual(trace.at(-1), {
    id: 'final',
    label: 'final agent response',
  });
  assert.equal(trace.filter((row) => row.id.startsWith('work-')).length, 2);
});

test('catalog ambiguity adds Tool Search rounds at fixed thresholds', () => {
  assert.deepEqual(TOOL_SEARCH_ROUNDS, { max: 3, catalogStep: 16 });
  assert.equal(toolSearchRoundCount(4), 1);
  assert.equal(toolSearchRoundCount(16), 1);
  assert.equal(toolSearchRoundCount(17), 2);
  assert.equal(toolSearchRoundCount(32), 2);
  assert.equal(toolSearchRoundCount(33), 3);
  assert.equal(toolSearchRoundCount(40), 3);
});

test('each added round is a complete fixed-weight recovery loop', () => {
  const rows = lazyRows(40);
  const recoveryRows = rows.filter(
    (row) =>
      row.id.startsWith('search-retry-') ||
      row.id.startsWith('candidate-') ||
      row.id.startsWith('false-start-')
  );

  assert.deepEqual(
    recoveryRows.map(({ id, label }) => ({ id, label })),
    [
      {
        id: 'search-retry-0',
        label: 'Tool Search call + result · retry 1',
      },
      { id: 'candidate-0', label: 'near-match schema · discarded' },
      { id: 'false-start-0', label: 'false-start tool call + result' },
      {
        id: 'search-retry-1',
        label: 'Tool Search call + result · retry 2',
      },
      { id: 'candidate-1', label: 'near-match schema · discarded' },
      { id: 'false-start-1', label: 'false-start tool call + result' },
    ]
  );
  assert.ok(recoveryRows.every((row) => row.weight === MIX_ROW_WEIGHT));
  assert.deepEqual(
    visibleRows(lazyRows(20)).map((row) => row.id),
    [
      'startup',
      'prompt',
      'search-retry-0',
      'candidate-0',
      'false-start-0',
      'discovery',
      'schema-0',
      'schema-1',
      'work-0',
      'work-1',
      'final',
      'headroom',
    ]
  );
});

test('lazy growth adds selected schemas alongside search recovery', () => {
  const lazyAt4 = contextContentWeight(lazyRows(4));
  const lazyAt20 = contextContentWeight(lazyRows(20));
  const lazyAt40 = contextContentWeight(lazyRows(40));
  const eagerAt40 = contextContentWeight(eagerRows(40));

  assert.equal(lazyAt4, 112);
  assert.equal(lazyAt20, 160);
  assert.equal(lazyAt40, 220);
  assert.equal(lazyAt20 - lazyAt4, 4 * MIX_ROW_WEIGHT);
  assert.equal(lazyAt40 - lazyAt20, 5 * MIX_ROW_WEIGHT);
  assert.ok(eagerAt40 > lazyAt40);
});

test('catalog breadth grows selected schemas in ten-tool steps', () => {
  for (
    let catalog = CATALOG_LIMITS.min;
    catalog <= CATALOG_LIMITS.max;
    catalog += 1
  ) {
    const layout = modelMCPToolSchema(catalog);
    const selected = Math.min(
      TASK_SCHEMA_CAPABILITIES.length,
      Math.ceil(catalog / 10)
    );
    assert.deepEqual(
      layout.lazySchemas,
      TASK_SCHEMA_CAPABILITIES.slice(0, selected)
    );
    assert.equal(layout.eagerSchemas, catalog);
    assert.equal(layout.deferredSchemas, catalog - selected);
  }
});

test('lazy weights distinguish Tool Search definition, turns, and expansions', () => {
  const rows = lazyRows(CATALOG_LIMITS.max);
  assert.equal(
    rows.find((row) => row.id === 'startup')?.weight,
    LAZY_STARTUP_WEIGHT
  );
  assert.equal(
    LAZY_STARTUP_WEIGHT,
    BLOCK_WEIGHT + TOOL_SEARCH_DEFINITION_WEIGHT
  );
  assert.equal(
    rows.find((row) => row.id === 'discovery')?.weight,
    TOOL_SEARCH_TURN_WEIGHT
  );
  assert.equal(
    rows.find((row) => row.id === 'schema-0')?.weight,
    SCHEMA_EXPANSION_WEIGHT
  );
  assert.equal(
    rows.filter((row) => row.id.startsWith('schema-')).length,
    TASK_SCHEMA_CAPABILITIES.length
  );
  assert.equal(TOOL_SEARCH_TURN_WEIGHT, MIX_ROW_WEIGHT);
});

test('window fill tracks context mass and every panel fits the window', () => {
  for (
    let catalog = CATALOG_LIMITS.min;
    catalog <= CATALOG_LIMITS.max;
    catalog += 1
  ) {
    for (const rows of [eagerRows(catalog), lazyRows(catalog)]) {
      assert.equal(
        windowFill(rows),
        contextContentWeight(rows) / WINDOW_CAPACITY
      );
      assert.equal(
        visibleRows(rows).reduce((sum, row) => sum + row.weight, 0),
        WINDOW_CAPACITY
      );
    }
  }
  assert.ok(windowFill(eagerRows(CATALOG_LIMITS.max)) > 0.9);
  assert.ok(windowFill(lazyRows(CATALOG_LIMITS.max)) < 0.9);
});

test('headroom fills capacity but never receives an attention zone', () => {
  for (const rows of [
    eagerRows(CATALOG_LIMITS.min),
    eagerRows(CATALOG_LIMITS.max),
    lazyRows(CATALOG_LIMITS.max),
  ]) {
    assert.equal(rows.find((row) => row.id === 'headroom')?.spacer, true);
    assert.equal(zoneOfRow('final', rows), 'recency');
    assert.throws(() => zoneOfRow('headroom', rows));
  }
});
