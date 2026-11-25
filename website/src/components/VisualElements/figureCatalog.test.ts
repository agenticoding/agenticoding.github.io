import assert from 'node:assert/strict';
import test from 'node:test';

import { dataset } from './openWeightFitData.ts';
import {
  FAMILIES,
  baseHardwareId,
  budgetOf,
  budgetStep,
  defaultBudget,
  defaultSkuOfFamily,
  engineSupports,
  formatGib,
  formatNumber,
  hardwareById,
  hardwareIdFor,
  modelCountOf,
  vendorOf,
} from './figureCatalog.ts';

test('the catalogue finds every target it publishes, and nothing else', () => {
  for (const target of dataset.hardware)
    assert.equal(hardwareById(target.id)?.id, target.id);
  assert.equal(hardwareById('no-such-machine'), undefined);
});

test('a device id round-trips through its base and its count', () => {
  for (const target of dataset.hardware)
    assert.equal(
      hardwareIdFor(baseHardwareId(target), target.devices),
      target.id,
      target.id
    );
});

test('a family chip selects a single device', () => {
  for (const family of FAMILIES) {
    const sku = defaultSkuOfFamily(family.id);
    assert.ok(sku, family.id);
    assert.equal(sku.devices, 1, family.id);
    assert.equal(sku.family, family.id);
  }
});

test('a budget is the reader’s choice, else what the machine leaves usable', () => {
  const target = hardwareById(dataset.hardware[0].id);
  assert.ok(target);
  const own = {
    hardwareId: target.id,
    engineId: 'all',
  };
  assert.equal(budgetOf(target, own), defaultBudget(target));
  assert.equal(defaultBudget(target), target.nominalGib - target.reserveGib);
  assert.equal(budgetOf(target, { ...own, budgetGib: 12 }), 12);
});

test('an unknown family fails loudly instead of losing its vendor', () => {
  // @ts-expect-error the catalogue must reject a family it does not publish.
  assert.throws(() => vendorOf('no-such-family'));
});

test('runtime support is the vendor the guide publishes', () => {
  for (const engine of dataset.engines)
    for (const family of FAMILIES) {
      const vendor = vendorOf(family.id);
      assert.equal(
        engineSupports(engine, family.id),
        engine.platforms.includes(vendor),
        `${engine.id} on ${family.id}`
      );
    }
});

test('the slider step never gets finer as the machine grows', () => {
  const steps = [24, 64, 256, 1024, 4096].map(budgetStep);
  for (let index = 1; index < steps.length; index += 1)
    assert.ok(steps[index] >= steps[index - 1], `${steps}`);
});

test('a memory figure prints one decimal under a hundred and a grouped integer above', () => {
  assert.equal(formatNumber(6.04), '6');
  assert.equal(formatNumber(6.15), '6.2');
  assert.equal(formatGib(1024), '1,024');
});

test('the fit catalogue states how many checkpoints it sizes', () => {
  assert.equal(modelCountOf(), dataset.models.length);
  assert.ok(dataset.models.length > 0);
});
