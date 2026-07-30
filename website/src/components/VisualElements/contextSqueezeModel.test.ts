import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BIG_FILE_WEIGHT,
  END_TICKS,
  LOOP_TICKS,
  SMALL_FILE_WEIGHT,
  STARTUP_TICKS,
  TURN_COUNT,
  WINDOW_CAPACITY,
  promptAttention,
  promptZone,
  squeezeRows,
  turnsAtTick,
  windowFill,
} from './contextSqueezeModel.ts';
import { fractionOfRow } from './contextRegions.ts';
import { ATTENTION_TIERS, tierAt } from './attentionModel.ts';

const SMALL_END = squeezeRows(SMALL_FILE_WEIGHT, TURN_COUNT);
const BIG_END = squeezeRows(BIG_FILE_WEIGHT, TURN_COUNT);

test('startup: the prompt lands at the recency edge in BOTH panels', () => {
  // The shared premise: file size does not matter until turns build up.
  for (const fileWeight of [SMALL_FILE_WEIGHT, BIG_FILE_WEIGHT]) {
    const rows = squeezeRows(fileWeight, 0);
    assert.equal(promptZone(rows), 'recency');
    assert.ok(promptAttention(rows) >= ATTENTION_TIERS.strong);
  }
});

test('small-file end state: prompt settles at the primacy edge, attention strong', () => {
  assert.equal(promptZone(SMALL_END), 'primacy');
  const attention = promptAttention(SMALL_END);
  assert.ok(
    attention >= ATTENTION_TIERS.strong,
    `expected strong attention, got ${attention}`
  );
  assert.equal(tierAt(attention), 'strong');
  // Anchors the toy scenario: fraction 26/126, attention ≈ 0.831.
  assert.ok(Math.abs(fractionOfRow('prompt', SMALL_END) - 26 / 126) < 1e-9);
  assert.ok(Math.abs(attention - 0.8306) < 1e-3);
});

test('big-file end state: prompt pinned in the dead middle, attention collapsed', () => {
  assert.equal(promptZone(BIG_END), 'middle');
  const attention = promptAttention(BIG_END);
  assert.ok(
    attention < ATTENTION_TIERS.strong,
    `expected danger, got ${attention}`
  );
  // Clearly into the valley: below the degraded floor, not just under strong.
  assert.equal(tierAt(attention), 'collapsed');
  // Anchors the toy scenario: fraction 80/180, attention ≈ 0.225.
  assert.ok(Math.abs(fractionOfRow('prompt', BIG_END) - 80 / 180) < 1e-9);
  assert.ok(Math.abs(attention - 0.2245) < 1e-3);
});

test('every timeline step keeps both panels inside the window', () => {
  for (let tick = 0; tick < LOOP_TICKS; tick += 1) {
    const turns = turnsAtTick(tick);
    for (const fileWeight of [SMALL_FILE_WEIGHT, BIG_FILE_WEIGHT]) {
      const rows = squeezeRows(fileWeight, turns);
      assert.ok(
        windowFill(rows) < 1,
        `tick ${tick} file ${fileWeight} overflows the window`
      );
    }
  }
});

test('appended turns push the prompt monotonically toward primacy', () => {
  for (const fileWeight of [SMALL_FILE_WEIGHT, BIG_FILE_WEIGHT]) {
    let previous = Infinity;
    for (let turns = 0; turns <= TURN_COUNT; turns += 1) {
      const fraction = fractionOfRow('prompt', squeezeRows(fileWeight, turns));
      assert.ok(
        fraction < previous,
        `turn ${turns} did not push the prompt up (file ${fileWeight})`
      );
      previous = fraction;
    }
  }
});

test('turns only diverge the outcomes through file size, not turn data', () => {
  // Same timeline in both panels: identical turn weights and counts.
  for (let turns = 0; turns <= TURN_COUNT; turns += 1) {
    const small = squeezeRows(SMALL_FILE_WEIGHT, turns);
    const big = squeezeRows(BIG_FILE_WEIGHT, turns);
    const turnWeight = (rows: typeof small) =>
      rows
        .filter((row) => row.id.startsWith('turn-') && !row.collapsed)
        .reduce((sum, row) => sum + row.weight, 0);
    assert.equal(turnWeight(small), turnWeight(big));
  }
});

test('loop timeline: startup hold, one turn per tick, end hold, wrap', () => {
  assert.equal(LOOP_TICKS, STARTUP_TICKS + TURN_COUNT + END_TICKS);
  for (let tick = 0; tick < STARTUP_TICKS; tick += 1) {
    assert.equal(turnsAtTick(tick), 0);
  }
  for (let turn = 1; turn <= TURN_COUNT; turn += 1) {
    assert.equal(turnsAtTick(STARTUP_TICKS + turn - 1), turn);
  }
  // The loop's final tick is the complete end state — this is also the
  // component's initial tick, so SSR and reduced-motion render it statically.
  assert.equal(turnsAtTick(LOOP_TICKS - 1), TURN_COUNT);
});

test('end-state fills sit on the intended valley depths', () => {
  // Small: shallow valley (0.656) — primacy survives. Big: deep valley
  // (0.938) — the middle collapses. Guards the WINDOW_CAPACITY sizing.
  assert.ok(Math.abs(windowFill(SMALL_END) - 126 / WINDOW_CAPACITY) < 1e-9);
  assert.ok(Math.abs(windowFill(BIG_END) - 180 / WINDOW_CAPACITY) < 1e-9);
});
