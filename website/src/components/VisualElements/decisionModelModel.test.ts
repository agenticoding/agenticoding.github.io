import assert from 'node:assert/strict';
import test from 'node:test';

import { classifiers } from './classifierData.ts';
import {
  decisionBounds,
  decisionEngines,
  decisionRail,
  decisionRows,
  listedRows,
} from './decisionModelModel.ts';
import { FAMILIES, defaultSkuOfFamily } from './figureCatalog.ts';
import type { MachineChoice } from './figureTypes.ts';

/** A 24 GiB card that keeps 2 GiB: 22 GiB given to inference. */
const CHOICE: MachineChoice = { hardwareId: 'rtx4090', engineId: 'all' };

const boundsAt = (choice: MachineChoice, state: number, decisions: number) => {
  const rows = decisionRows(choice, state, decisions);
  return {
    rows,
    bounds: decisionBounds(choice, rows, state, decisions),
    listed: listedRows(rows),
  };
};

test('the panel states the lightest listed classifier, cache included', () => {
  const { rows, bounds } = boundsAt(CHOICE, 8192, 1);
  const lightest = Math.min(
    ...rows.map((row) => row.needGib ?? Number.POSITIVE_INFINITY)
  );
  assert.equal(bounds.floorGib, lightest);
  assert.equal(bounds.weightsGib + bounds.cacheGib, bounds.floorGib);
  // The floor is a listed row, so the panel and the table quote one model.
  assert.ok(
    rows.some((row) => Math.abs((row.needGib ?? -1) - bounds.floorGib) < 1e-9)
  );
});

test('the workload moves the cache and the floor, never the budget', () => {
  const short = boundsAt(CHOICE, 8192, 1).bounds;
  const long = boundsAt(CHOICE, 32768, 4).bounds;
  assert.equal(long.maxGib, short.maxGib);
  assert.equal(long.trackGib, short.trackGib);
  assert.equal(long.cacheGib, 32);
  assert.ok(long.floorGib > short.floorGib);
});

test('the floor, not the cache alone, decides the overfull state', () => {
  const { bounds } = boundsAt(CHOICE, 8192, 1);
  assert.equal(bounds.overfull, false);
  // The boundary is the budget itself: a floor that equals it still fits.
  const exact = boundsAt(
    { ...CHOICE, budgetGib: bounds.floorGib },
    8192,
    1
  ).bounds;
  assert.equal(exact.floorGib, exact.maxGib);
  assert.equal(exact.overfull, false);
  const short = boundsAt(
    { ...CHOICE, budgetGib: bounds.floorGib - 0.5 },
    8192,
    1
  ).bounds;
  assert.equal(short.overfull, true);
});

test('a workload the lighter models cannot hold lists nothing', () => {
  const { bounds, listed } = boundsAt(CHOICE, 131072, 1);
  // 128K of state is 32 GiB of cache on every row, weights included.
  assert.ok(bounds.floorGib > bounds.maxGib);
  assert.equal(bounds.overfull, true);
  assert.equal(listed.length, 0);
});

test('every listed row fits and carries the need its bar draws', () => {
  const { rows, bounds, listed } = boundsAt(CHOICE, 8192, 1);
  assert.ok(listed.length > 0);
  assert.ok(listed.length <= rows.length);
  for (const row of listed) {
    assert.ok(row.needGib <= bounds.maxGib);
    assert.ok(row.needGib > (row.model.weights?.gib ?? 0));
  }
});

/** Every runtime at least one classifier card names. */
const ENGINES = [
  ...new Set(classifiers.models.flatMap((model) => model.engineIds)),
];

test('the table lists only the models the chosen runtime serves', () => {
  const every = decisionRows(CHOICE, 8192, 1);
  // The default scope is the whole dataset: "Any runtime" is not a filter.
  assert.equal(every.length, classifiers.models.length);
  const ids = new Set(every.map((row) => row.model.id));
  for (const engineId of ENGINES) {
    const scoped = decisionRows({ ...CHOICE, engineId }, 8192, 1);
    assert.ok(scoped.length > 0, engineId);
    for (const row of scoped) {
      assert.ok(
        row.model.engineIds.includes(engineId),
        `${row.model.id} is listed on ${engineId}, which its card does not name`
      );
      assert.ok(ids.has(row.model.id), row.model.id);
    }
  }
});

test('a runtime chip promises the rows its own click leaves', () => {
  const chips = decisionEngines(decisionRows(CHOICE, 8192, 1));
  assert.ok(chips.length >= 2);
  for (const chip of chips) {
    const scoped = decisionRows(
      { ...CHOICE, engineId: chip.engineId },
      8192,
      1
    );
    // The denominator is the runtime's own membership, the numerator its list.
    assert.equal(chip.coverage, scoped.length, chip.engineId);
    assert.equal(chip.count, listedRows(scoped).length, chip.engineId);
  }
});

test('the floor is the lightest row the chosen runtime lists', () => {
  const full = boundsAt(CHOICE, 8192, 1).bounds.floorGib;
  const narrower: string[] = [];
  for (const engineId of ENGINES) {
    const { rows, bounds } = boundsAt({ ...CHOICE, engineId }, 8192, 1);
    const lightest = Math.min(
      ...rows.map((row) => row.needGib ?? Number.POSITIVE_INFINITY)
    );
    assert.equal(bounds.floorGib, lightest, engineId);
    if (bounds.floorGib > full) narrower.push(engineId);
  }
  // A runtime that drops the lightest row must state a heavier floor.
  assert.ok(narrower.length > 0, 'every runtime quoted the same floor');
});

test('a rail number is the list its click leaves on this runtime', () => {
  for (const family of FAMILIES) {
    const sku = defaultSkuOfFamily(family.id);
    if (!sku) continue;
    for (const engineId of ENGINES) {
      const choice = { ...CHOICE, hardwareId: sku.id, engineId };
      for (const { target, fits } of decisionRail(choice, 8192, 1).devices) {
        const listed = listedRows(
          decisionRows({ ...choice, hardwareId: target.id }, 8192, 1)
        );
        assert.equal(fits, listed.length, `${target.id} on ${engineId}`);
      }
    }
  }
});
