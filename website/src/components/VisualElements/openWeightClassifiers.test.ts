import assert from 'node:assert/strict';
import test from 'node:test';

import { classifiers } from './classifierData.ts';
import { MODEL_MODALITIES } from './modalityProfile.ts';
import { dataset as fit } from './openWeightFitData.ts';

const { models, meta } = classifiers;
/** The dataset's channels are checked against the book's own vocabulary. */
const CHANNELS: readonly string[] = MODEL_MODALITIES;
const PROTOCOLS = ['joint', 'per-question'];

test('the guide names its checked-through date', () => {
  assert.match(meta.checkedThrough, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(meta.protocols.length >= 2);
});

test('every row is a well-formed classifier', () => {
  for (const model of models) {
    assert.match(model.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, model.id);
    assert.ok(model.name.length > 0, model.id);
    assert.ok(model.lab.length > 0, model.id);
    assert.ok(model.params.length > 0, model.id);
    assert.ok(PROTOCOLS.includes(model.protocol), model.id);
    assert.match(model.sourceUrl, /^https:\/\//, model.id);
    assert.equal(model.modalities.output, 'label', model.id);
    for (const channel of model.modalities.inputs)
      assert.ok(CHANNELS.includes(channel), `${model.id}: ${channel}`);
    assert.ok(model.modalities.inputs.length > 0, model.id);
  }
});

test('a published weight figure names its precision; a missing one stays missing', () => {
  for (const model of models) {
    if (model.weights === null) continue;
    assert.ok(model.weights.precision.length > 0, model.id);
    assert.ok(model.weights.gib > 0, model.id);
    assert.ok(model.weights.stated.includes(model.weights.precision), model.id);
  }
  assert.ok(
    models.some((model) => model.weights === null),
    'the untested verdict must be reachable'
  );
});

test('the origin is a country name or an unpublished fact', () => {
  for (const model of models)
    if (model.country !== null)
      assert.match(model.country, /^[A-Z][A-Za-z ]+$/, model.id);
  assert.ok(
    models.some((model) => model.country !== null),
    'no card names a country'
  );
});

test('a published input limit is a positive number with its basis', () => {
  for (const model of models) {
    if (model.maxInput === null) continue;
    assert.ok(model.maxInput.tokens > 0, model.id);
    assert.ok(['served', 'config'].includes(model.maxInput.basis), model.id);
  }
});

test('every named runtime is one the fit catalogue publishes', () => {
  const known = new Set(fit.engines.map((engine) => engine.id));
  for (const model of models) {
    assert.ok(model.engineIds.length > 0, model.id);
    for (const id of model.engineIds)
      assert.ok(known.has(id), `${model.id}: ${id}`);
  }
});

test('no classifier reuses a checkpoint id from the fit dataset', () => {
  const taken = new Set(fit.models.map((model) => model.id));
  for (const model of models) assert.ok(!taken.has(model.id), model.id);
  assert.equal(new Set(models.map((model) => model.id)).size, models.length);
});
