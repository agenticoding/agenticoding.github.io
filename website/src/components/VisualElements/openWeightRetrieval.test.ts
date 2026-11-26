import assert from 'node:assert/strict';
import test from 'node:test';

import { retrieval } from './retrievalData.ts';
import { MODEL_MODALITIES, MODALITY_SINKS } from './modalityProfile.ts';
import { dataset as fit } from './openWeightFitData.ts';
import { classifiers } from './classifierData.ts';
import { TOKEN_STOPS } from './retrievalModel.ts';
import { exceedsInputCap } from './retrievalRequirement.ts';

const { models, meta } = retrieval;
/** The dataset's channels are checked against the book's own vocabulary. */
const CHANNELS: readonly string[] = MODEL_MODALITIES;
const SINKS: readonly string[] = MODALITY_SINKS;
const KINDS = ['embedding', 'reranking'];
/** Each family returns its own value, never the other's and never text. */
const SINK_OF_KIND = { embedding: 'vector', reranking: 'score' } as const;

test('the guide names its checked-through date and its families', () => {
  assert.match(meta.checkedThrough, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual([...meta.kinds].sort(), [...KINDS].sort());
  for (const kind of KINDS)
    assert.ok(
      models.some((model) => model.kind === kind),
      kind
    );
});

test('every row is a well-formed retrieval model', () => {
  for (const model of models) {
    assert.match(model.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, model.id);
    assert.ok(model.name.length > 0, model.id);
    assert.ok(model.lab.length > 0, model.id);
    assert.ok(model.base.length > 0, model.id);
    assert.ok(model.params.length > 0, model.id);
    assert.ok(KINDS.includes(model.kind), model.id);
    assert.match(model.sourceUrl, /^https:\/\//, model.id);
    assert.ok(model.license.length > 0, model.id);
    assert.ok(SINKS.includes(model.modalities.output), model.id);
    for (const channel of model.modalities.inputs)
      assert.ok(CHANNELS.includes(channel), `${model.id}: ${channel}`);
    assert.ok(model.modalities.inputs.length > 0, model.id);
  }
});

test('a family returns its own value: an embedder a vector, a reranker a score', () => {
  for (const model of models)
    assert.equal(
      model.modalities.output,
      SINK_OF_KIND[model.kind as keyof typeof SINK_OF_KIND],
      model.id
    );
});

test('a published weight figure names its precision', () => {
  for (const model of models) {
    if (model.weights === null) continue;
    assert.ok(model.weights.precision.length > 0, model.id);
    assert.ok(model.weights.gib > 0, model.id);
    assert.ok(model.weights.stated.includes(model.weights.precision), model.id);
  }
});

test('an input limit names the source that states it', () => {
  for (const model of models) {
    if (model.maxInput === null) continue;
    assert.ok(model.maxInput.tokens > 0, model.id);
    assert.ok(
      ['served', 'config', 'card', 'blog', 'default'].includes(
        model.maxInput.basis
      ),
      model.id
    );
  }
});

test('only an embedder publishes a vector width', () => {
  for (const model of models) {
    if (model.kind === 'reranking') assert.equal(model.dims, null, model.id);
    else if (model.dims !== null) assert.ok(model.dims.width > 0, model.id);
  }
  assert.ok(
    models.some((model) => model.kind === 'embedding' && model.dims !== null),
    'an embedder must publish the width its index is billed on'
  );
});

test('a score travels with the run that produced it', () => {
  for (const model of models) {
    if (model.score === null) continue;
    assert.ok(model.score.value > 0, model.id);
    // A bare number would invite a comparison across pools.
    assert.ok(model.score.benchmark.length > 0, model.id);
  }
});

test('every runtime exists in the fit catalogue', () => {
  const engines = new Set(fit.engines.map((engine) => engine.id));
  for (const model of models) {
    assert.ok(model.engineIds.length > 0, model.id);
    for (const id of model.engineIds)
      assert.ok(engines.has(id), `${model.id}: unknown runtime "${id}"`);
  }
});

test('ids are unique across all three datasets', () => {
  const taken = new Set([
    ...fit.models.map((model) => model.id),
    ...classifiers.models.map((model) => model.id),
  ]);
  for (const model of models) {
    assert.ok(!taken.has(model.id), `duplicate id "${model.id}"`);
    taken.add(model.id);
  }
});

test('the out-of-range verdict is reachable in the real data', () => {
  // The figures offer stops the shortest-capped cards cannot read, so a row
  // that disappears from the list has a cause on screen.
  const longest = Math.max(...TOKEN_STOPS);
  assert.ok(
    models.some((model) => exceedsInputCap(model, longest)),
    'no row is out of range at the longest stop'
  );
  assert.ok(
    models.some((model) => !exceedsInputCap(model, longest)),
    'every row would vanish at the longest stop'
  );
});

test('the MiniLM embedder reports its default, not its position limit', () => {
  const model = models.find(({ id }) => id === 'all-minilm-l6-v2');
  assert.deepEqual(model?.maxInput, { tokens: 256, basis: 'default' });
});

test('the BGE reranker accepts 8,192 input tokens, not 8,194 position slots', () => {
  const model = models.find(({ id }) => id === 'bge-reranker-v2-m3');
  assert.ok(model);
  assert.equal(exceedsInputCap(model, 8192), false);
  assert.equal(exceedsInputCap(model, 8193), true);
});

test('the mxbai reranker cites its release post, not its card', () => {
  const model = models.find(({ id }) => id === 'mxbai-rerank-large-v2');
  assert.deepEqual(model?.maxInput, { tokens: 8192, basis: 'blog' });
});

test('the pairwise dataset does not price the listwise Jina checkpoint', () => {
  assert.ok(!models.some(({ id }) => id === 'jina-reranker-v3-5'));
});
