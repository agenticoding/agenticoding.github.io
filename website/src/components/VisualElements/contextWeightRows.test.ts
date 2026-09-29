// Shared-foundation guards for the weight rows every context-mass figure builds
// on. These run the four ledger invariants against the REAL models, because the
// old suite only exercised 2–3-row fixtures that never entered the clamped
// regime — which is exactly how off-grid, floor-violating, order-inverting rows
// shipped silently.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { REGION_MIN_HEIGHT, resolveRegionGeometry } from './contextRegions.ts';
import { DIAGRAM_GRID, DIAGRAM_HALF } from './diagramScale.ts';
import {
  block,
  contentFloorHeight,
  contextContentWeight,
  mixRow,
  stackHeight,
} from './contextWeightRows.ts';
import {
  PARENT_STACK_HEIGHT,
  WINDOW_CAPACITY as FANOUT_CAPACITY,
  parentRows,
} from './SubAgentFanoutModel.ts';
import {
  CATALOG_LIMITS as MCP_LIMITS,
  STACK_HEIGHT as MCP_STACK_HEIGHT,
  WINDOW_CAPACITY as MCP_CAPACITY,
  eagerRows,
  lazyRows,
} from './MCPToolSchemaModel.ts';
import {
  CATALOG_LIMITS as SKILL_LIMITS,
  STACK_HEIGHT as SKILL_STACK_HEIGHT,
  WINDOW_CAPACITY as SKILL_CAPACITY,
  autoRows,
  manualRows,
} from './SkillsInvocationModel.ts';
import {
  MOBILE_STACK_HEIGHT as SQUEEZE_MOBILE_HEIGHT,
  STACK_HEIGHT as SQUEEZE_STACK_HEIGHT,
  squeezeRows,
} from './contextSqueezeModel.ts';

const catalogRange = ({ min, max }: { min: number; max: number }) =>
  Array.from({ length: max - min + 1 }, (_, step) => min + step);

function visibleContent(rows) {
  return rows.filter((row) => !row.collapsed && row.weight > 0 && !row.spacer);
}

function assertInvariants(label, rows, canvas) {
  const { rowHeights } = resolveRegionGeometry(rows, canvas);
  const sum = Object.values(rowHeights).reduce(
    (total, height) => total + height,
    0
  );
  assert.ok(
    Math.abs(sum - canvas) < 1e-9,
    `${label}: rows sum to ${sum}, not ${canvas}`
  );
  const content = visibleContent(rows);
  for (const row of content) {
    const floor = row.minHeight ?? REGION_MIN_HEIGHT;
    assert.ok(
      rowHeights[row.id] >= floor,
      `${label}: ${row.id} below its ${floor}px floor`
    );
    assert.equal(
      rowHeights[row.id] % DIAGRAM_HALF,
      0,
      `${label}: ${row.id} off the 4px grid`
    );
  }
  for (const heavier of content) {
    for (const lighter of content) {
      const floorOf = (row) => row.minHeight ?? REGION_MIN_HEIGHT;
      // A higher floor legitimately outranks weight (D1b: floors dominate the
      // ledger), so monotonicity only binds when the heavier row's floor is at
      // least the lighter row's.
      if (heavier.weight <= lighter.weight) continue;
      if (floorOf(heavier) < floorOf(lighter)) continue;
      assert.ok(
        rowHeights[heavier.id] >= rowHeights[lighter.id],
        `${label}: ${heavier.id} (${heavier.weight}) shorter than ${lighter.id} (${lighter.weight})`
      );
    }
  }
}

function cssHeights(file, selector) {
  const css = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
  const heights = [];
  for (const rule of css.matchAll(
    new RegExp(`\\${selector}\\s*\\{[^}]*\\}`, 'g')
  )) {
    const height = rule[0].match(/height:\s*(\d+)px/);
    if (height) heights.push(Number(height[1]));
  }
  return heights;
}

test('block and compact floors sit on the sanctioned 4px half-step', () => {
  assert.equal(block('b', 'b').minHeight! % DIAGRAM_HALF, 0);
  assert.equal(mixRow('m', 'm').minHeight! % DIAGRAM_HALF, 0);
  assert.ok(block('b', 'b').minHeight! > mixRow('m', 'm').minHeight!);
});

test('stackHeight is a grid-legal canvas that can always host the floors', () => {
  for (const rows of [
    parentRows(),
    eagerRows(40),
    lazyRows(40),
    autoRows(12),
  ]) {
    const floors = contentFloorHeight(rows);
    const canvas = stackHeight(rows, FANOUT_CAPACITY);
    assert.ok(
      canvas >= floors,
      `canvas ${canvas} cannot host ${floors}px of floors`
    );
    assert.equal(
      canvas % DIAGRAM_GRID,
      0,
      `canvas ${canvas} is off the 8px grid`
    );
  }
});

test('pxPerUnit is the floor budget spread over the content weight', () => {
  const rows = parentRows();
  assert.ok(
    Math.abs(
      (stackHeight(rows, FANOUT_CAPACITY) / FANOUT_CAPACITY) *
        contextContentWeight(rows) -
        contentFloorHeight(rows)
    ) < DIAGRAM_GRID
  );
});

test('the sub-agent fan-out ledger holds every invariant', () => {
  assertInvariants('fanout', parentRows(), PARENT_STACK_HEIGHT);
});

test('both MCP panels hold every invariant across the catalog slider', () => {
  for (const catalog of catalogRange(MCP_LIMITS)) {
    assertInvariants(
      `mcp eager ${catalog}`,
      eagerRows(catalog),
      MCP_STACK_HEIGHT
    );
    assertInvariants(
      `mcp lazy ${catalog}`,
      lazyRows(catalog),
      MCP_STACK_HEIGHT
    );
    assert.ok(
      stackHeight(eagerRows(catalog), MCP_CAPACITY) <= MCP_STACK_HEIGHT &&
        stackHeight(lazyRows(catalog), MCP_CAPACITY) <= MCP_STACK_HEIGHT,
      `mcp canvas too small at catalog ${catalog}`
    );
  }
});

test('both skills panels hold every invariant across the catalog slider', () => {
  for (const catalog of catalogRange(SKILL_LIMITS)) {
    assertInvariants(
      `skills manual ${catalog}`,
      manualRows(catalog),
      SKILL_STACK_HEIGHT
    );
    assertInvariants(
      `skills auto ${catalog}`,
      autoRows(catalog),
      SKILL_STACK_HEIGHT
    );
    assert.ok(
      stackHeight(manualRows(catalog), SKILL_CAPACITY) <= SKILL_STACK_HEIGHT &&
        stackHeight(autoRows(catalog), SKILL_CAPACITY) <= SKILL_STACK_HEIGHT,
      `skills canvas too small at catalog ${catalog}`
    );
  }
});

test('the squeeze panels hold every invariant for every turn count', () => {
  for (const fileWeight of [6, 60]) {
    for (let turns = 0; turns <= 8; turns += 1) {
      const rows = squeezeRows(fileWeight, turns);
      assertInvariants(
        `squeeze ${fileWeight}/${turns}`,
        rows,
        SQUEEZE_STACK_HEIGHT
      );
      assertInvariants(
        `squeeze-mobile ${fileWeight}/${turns}`,
        rows,
        SQUEEZE_MOBILE_HEIGHT
      );
    }
  }
});

test('each figure declares its canvas once and the stylesheet mirrors it', () => {
  const mirrors = [
    ['./SubAgentFanoutDiagram.module.css', '.stackClip', [PARENT_STACK_HEIGHT]],
    [
      './MCPToolSchemaDiagram.module.css',
      '.stackClip',
      [MCP_STACK_HEIGHT, MCP_STACK_HEIGHT],
    ],
    [
      './SkillsInvocationDiagram.module.css',
      '.stackClip',
      [SKILL_STACK_HEIGHT, SKILL_STACK_HEIGHT],
    ],
    [
      './ContextSqueezeDiagram.module.css',
      '.stackClip',
      [SQUEEZE_STACK_HEIGHT, SQUEEZE_MOBILE_HEIGHT],
    ],
  ] as const;
  for (const [file, selector, expected] of mirrors) {
    assert.deepEqual(
      cssHeights(file, selector),
      [...expected],
      `${file} ${selector} does not mirror the declared canvas`
    );
  }
});
