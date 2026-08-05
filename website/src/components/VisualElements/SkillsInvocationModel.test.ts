import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTO_SKILL_LABEL,
  BLOCK_WEIGHT,
  CATALOG_LIMITS,
  DISCARDED_SKILL_LABEL,
  FALSE_START_LABEL,
  FINAL_RESPONSE_LABEL,
  LOADED_PROCEDURES,
  MANUAL_SKILL_LABEL,
  METADATA_WEIGHT,
  MIX_ROW_WEIGHT,
  PROMPT_LABEL,
  SKILL_EXPANSION_WEIGHT,
  WINDOW_CAPACITY,
  autoRows,
  contextContentWeight,
  discardedSkillZone,
  manualRows,
  matchedSkillZone,
  metadataWeight,
  modelSkillsInvocation,
  tileAttention,
  windowFill,
  type SkillsContextRow,
} from './SkillsInvocationModel.ts';
import { zoneOfRow, type ContextRegionRow } from './contextRegions.ts';
import { ATTENTION_TIERS } from './attentionModel.ts';

function visibleRows(rows: readonly ContextRegionRow[]) {
  return rows.filter((row) => !row.collapsed && row.weight > 0);
}

function eachCatalog(visit: (catalog: number) => void) {
  for (
    let catalog = CATALOG_LIMITS.min;
    catalog <= CATALOG_LIMITS.max;
    catalog += 1
  ) {
    visit(catalog);
  }
}

function taskTrace(rows: readonly SkillsContextRow[]) {
  return rows
    .filter(
      (row) =>
        row.id === 'prompt' || row.id.startsWith('work-') || row.id === 'final'
    )
    .map(({ id, label }) => ({ id, label }));
}

test('both paths share the same prompt, task work, and response', () => {
  const trace = taskTrace(manualRows(CATALOG_LIMITS.min));

  assert.deepEqual(taskTrace(autoRows(CATALOG_LIMITS.min)), trace);
  assert.deepEqual(trace[0], { id: 'prompt', label: PROMPT_LABEL });
  assert.deepEqual(trace.at(-1), {
    id: 'final',
    label: FINAL_RESPONSE_LABEL,
  });
  assert.equal(trace.filter((row) => row.id.startsWith('work-')).length, 2);
});

test('discovery metadata is the only catalog-driven prefix cost', () => {
  eachCatalog((catalog) => {
    for (const rows of [manualRows(catalog), autoRows(catalog)]) {
      const metadata = rows.find((row) => row.id === 'metadata');
      assert.equal(metadata?.weight, metadataWeight(catalog));
      assert.equal(metadata?.label, `skill metadata × ${catalog}`);
      assert.equal(rows.find((row) => row.id === 'core')?.weight, BLOCK_WEIGHT);
    }
  });
});

test('metadata weight grows monotonically and stays within its bounds', () => {
  assert.equal(metadataWeight(CATALOG_LIMITS.min), METADATA_WEIGHT.min);
  assert.equal(metadataWeight(CATALOG_LIMITS.max), METADATA_WEIGHT.max);

  let previous = 0;
  eachCatalog((catalog) => {
    const weight = metadataWeight(catalog);
    assert.ok(weight > previous, `metadata must grow at ${catalog} skills`);
    assert.ok(weight <= METADATA_WEIGHT.max);
    previous = weight;
  });
});

test('the model path strictly adds wrong-path rows before the right skill', () => {
  eachCatalog((catalog) => {
    const autoIds = autoRows(catalog).map((row) => row.id);
    const manualIds = manualRows(catalog).map((row) => row.id);

    assert.deepEqual(
      autoIds.filter((id) => !['near-match', 'false-start'].includes(id)),
      manualIds
    );
    assert.ok(autoIds.indexOf('near-match') < autoIds.indexOf('false-start'));
    assert.ok(autoIds.indexOf('false-start') < autoIds.indexOf('skill'));
    assert.equal(
      contextContentWeight(autoRows(catalog)) -
        contextContentWeight(manualRows(catalog)),
      SKILL_EXPANSION_WEIGHT + MIX_ROW_WEIGHT
    );
  });
});

test('procedure rows carry their own labels and weights', () => {
  const auto = autoRows(CATALOG_LIMITS.max);
  const skillWeight = (rows: readonly SkillsContextRow[], id: string) =>
    rows.find((row) => row.id === id)?.weight;

  assert.equal(
    manualRows(CATALOG_LIMITS.max).find((row) => row.id === 'skill')?.label,
    MANUAL_SKILL_LABEL
  );
  assert.equal(auto.find((row) => row.id === 'skill')?.label, AUTO_SKILL_LABEL);
  assert.equal(
    auto.find((row) => row.id === 'near-match')?.label,
    DISCARDED_SKILL_LABEL
  );
  assert.equal(
    auto.find((row) => row.id === 'false-start')?.label,
    FALSE_START_LABEL
  );
  assert.equal(skillWeight(auto, 'skill'), SKILL_EXPANSION_WEIGHT);
  assert.equal(skillWeight(auto, 'near-match'), SKILL_EXPANSION_WEIGHT);
  assert.equal(skillWeight(auto, 'false-start'), MIX_ROW_WEIGHT);
  assert.ok(SKILL_EXPANSION_WEIGHT > MIX_ROW_WEIGHT);
});

test('activated procedures land in the attention valley, not the edges', () => {
  eachCatalog((catalog) => {
    assert.equal(matchedSkillZone(catalog), 'middle');
    assert.equal(discardedSkillZone(catalog), 'middle');
    assert.equal(zoneOfRow('core', manualRows(catalog)), 'primacy');
    assert.equal(zoneOfRow('final', manualRows(catalog)), 'recency');
  });
});

test('growing metadata pushes the prompt away from the primacy edge', () => {
  let previous = Number.POSITIVE_INFINITY;
  eachCatalog((catalog) => {
    const attention = tileAttention('prompt', manualRows(catalog));
    assert.ok(attention < previous, `prompt must weaken at ${catalog} skills`);
    previous = attention;
  });
  assert.ok(tileAttention('prompt', manualRows(CATALOG_LIMITS.min)) > 0.8);
});

test('wrong-path artifacts sit deepest in the attention valley', () => {
  const rows = autoRows(CATALOG_LIMITS.max);
  const attention = (id: string) => tileAttention(id, rows);

  assert.ok(attention('near-match') < attention('skill'));
  assert.ok(attention('false-start') < attention('skill'));
  assert.ok(attention('near-match') < ATTENTION_TIERS.strong);
  assert.ok(attention('skill') < attention('final'));
});

test('window fill tracks context mass and every panel fits the window', () => {
  eachCatalog((catalog) => {
    for (const rows of [manualRows(catalog), autoRows(catalog)]) {
      assert.equal(
        windowFill(rows),
        contextContentWeight(rows) / WINDOW_CAPACITY
      );
      assert.equal(
        visibleRows(rows).reduce((sum, row) => sum + row.weight, 0),
        WINDOW_CAPACITY
      );
      assert.ok(windowFill(rows) > 0 && windowFill(rows) < 1);
    }
  });
  assert.ok(
    windowFill(autoRows(CATALOG_LIMITS.max)) >
      windowFill(manualRows(CATALOG_LIMITS.min))
  );
});

test('headroom fills capacity but never receives an attention zone', () => {
  for (const rows of [
    manualRows(CATALOG_LIMITS.min),
    manualRows(CATALOG_LIMITS.max),
    autoRows(CATALOG_LIMITS.max),
  ]) {
    assert.equal(rows.find((row) => row.id === 'headroom')?.spacer, true);
    assert.throws(() => zoneOfRow('headroom', rows));
  }
});

test('the catalog keeps procedure bodies out of the window', () => {
  eachCatalog((catalog) => {
    const layout = modelSkillsInvocation(catalog);

    assert.equal(layout.loadedProcedures, LOADED_PROCEDURES);
    assert.equal(layout.loadedProcedures + layout.deferredProcedures, catalog);
    assert.equal(layout.metadataWeight, metadataWeight(catalog));
  });
});
