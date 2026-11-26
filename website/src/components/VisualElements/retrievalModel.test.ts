import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KIND_SHAPES,
  TOKEN_STOPS,
  listedRows,
  retrievalBounds,
  retrievalCounts,
  retrievalEngines,
  retrievalProfile,
  retrievalRail,
  retrievalRows,
} from './retrievalModel.ts';
import { retrievalOfKind } from './retrievalData.ts';
import { workingSetGib } from './retrievalRequirement.ts';
import type { MachineChoice } from './figureTypes.ts';

const CHOICE: MachineChoice = { hardwareId: 'rtx4090', engineId: 'all' };
const EMBEDDING = KIND_SHAPES.embedding;
const RERANKING = KIND_SHAPES.reranking;

const rowsAt = (
  kind: 'embedding' | 'reranking',
  tokens: number,
  inFlight: number,
  choice: MachineChoice = CHOICE
) => retrievalRows(kind, choice, tokens, inFlight);

test("a row's profile names its channels and its sink", () => {
  for (const kind of ['embedding', 'reranking'] as const) {
    for (const model of retrievalOfKind(kind)) {
      const profile = retrievalProfile(model);
      // Inputs survive in the book's canonical order; the dataset test pins the
      // vocabulary, so membership is the only claim to preserve here.
      assert.deepEqual(
        [...profile.input].sort(),
        [...model.modalities.inputs].sort(),
        model.id
      );
      assert.deepEqual(profile.output, [model.modalities.output], model.id);
    }
  }
});

test('each figure prices only its own family', () => {
  const embedders = rowsAt('embedding', 2048, 1);
  assert.deepEqual(
    embedders.map((row) => row.model.kind),
    embedders.map(() => 'embedding')
  );
  assert.equal(embedders.length, retrievalOfKind('embedding').length);
  const rerankers = rowsAt('reranking', 2048, 1);
  assert.equal(rerankers.length, retrievalOfKind('reranking').length);
});

test('a listed row fits the machine and reads the workload', () => {
  const rows = rowsAt('embedding', 2048, 8);
  const listed = listedRows(rows);
  assert.ok(listed.length > 0);
  assert.ok(listed.length < rows.length, 'some rows must be excluded');
  for (const row of listed) {
    assert.equal(row.verdict, 'fits', row.model.id);
    assert.ok(row.needGib > 0, row.model.id);
  }
});

test('the floor is the lightest listed row, and it splits into weights plus held', () => {
  const tokens = 2048;
  const inFlight = 8;
  const rows = rowsAt('embedding', tokens, inFlight);
  const bounds = retrievalBounds(CHOICE, rows, tokens, inFlight);
  const lightest = Math.min(...listedRows(rows).map((row) => row.needGib));
  assert.equal(bounds.floorGib, lightest);
  assert.equal(bounds.workingSetGib, workingSetGib(tokens, inFlight));
  assert.ok(
    Math.abs(bounds.weightsGib + bounds.workingSetGib - bounds.floorGib) < 1e-9
  );
});

test('a wider batch moves the held memory and the floor, never the budget', () => {
  const small = retrievalBounds(CHOICE, rowsAt('embedding', 2048, 1), 2048, 1);
  const wide = retrievalBounds(CHOICE, rowsAt('embedding', 2048, 32), 2048, 32);
  assert.ok(wide.workingSetGib > small.workingSetGib);
  assert.equal(wide.maxGib, small.maxGib);
});

test('the counts and the list agree: fitting plus exclusions is the total', () => {
  const rows = rowsAt('reranking', 2048, 16);
  const counts = retrievalCounts(rows);
  assert.equal(counts.total, rows.length);
  assert.equal(counts.fitting, listedRows(rows).length);
  assert.ok(counts.outOfRange > 0, 'the 512-token cap must bite at 2048');
});

test('a length past a card’s cap removes the row and names the cause', () => {
  const short = rowsAt('reranking', 512, 4);
  const long = rowsAt('reranking', 2048, 4);
  const byId = (rows: typeof short, id: string) =>
    rows.find((row) => row.model.id === id);
  const capped = retrievalOfKind('reranking').find(
    (model) => model.maxInput?.tokens === 512
  );
  assert.ok(capped);
  assert.equal(byId(short, capped.id)?.verdict, 'fits');
  assert.equal(byId(long, capped.id)?.verdict, 'outOfRange');
  assert.ok(
    retrievalCounts(long).outOfRange > retrievalCounts(short).outOfRange
  );
});

test('the token stops let MiniLM embed the full text at its default', () => {
  const [shortest, next] = TOKEN_STOPS;
  const hasMiniLm = (tokens: number) =>
    listedRows(rowsAt('embedding', tokens, 1)).some(
      ({ model }) => model.id === 'all-minilm-l6-v2'
    );
  assert.equal(hasMiniLm(shortest), true);
  assert.equal(hasMiniLm(next), false);
});

test('a 24 GiB card cannot hold the largest embedder at any stop', () => {
  const heaviest = retrievalOfKind('embedding')
    .filter((model) => model.weights !== null)
    .sort((a, b) => b.weights!.gib - a.weights!.gib)[0];
  for (const tokens of TOKEN_STOPS) {
    const row = rowsAt('embedding', tokens, 1).find(
      (candidate) => candidate.model.id === heaviest.id
    );
    assert.equal(row?.verdict, 'over', `${heaviest.id} at ${tokens}`);
  }
  // Small models still list on the same box: the figure is not empty.
  assert.ok(retrievalCounts(rowsAt('embedding', 512, 1)).fitting > 0);
});

test('the runtime filter lists only what it serves', () => {
  const engineId = 'tei';
  const rows = rowsAt('embedding', 1024, 1, { ...CHOICE, engineId });
  assert.ok(rows.length > 0);
  for (const row of rows) assert.ok(row.model.engineIds.includes(engineId));
  const scoped = retrievalEngines(rows).find(
    (entry) => entry.engineId === engineId
  );
  assert.equal(scoped?.coverage, rows.length);
});

test('a chip count is the list its own click leaves', () => {
  const every = rowsAt('embedding', 1024, 1);
  for (const entry of retrievalEngines(every)) {
    const scoped = rowsAt('embedding', 1024, 1, {
      ...CHOICE,
      engineId: entry.engineId,
    });
    assert.equal(
      retrievalCounts(scoped).fitting,
      entry.count,
      `${entry.engineId} chip disagrees with its list`
    );
    assert.ok(entry.count <= entry.coverage, entry.engineId);
  }
});

test('the rail prices the same workload the table does', () => {
  const rail = retrievalRail('embedding', CHOICE, 1024, 1);
  const fitting = retrievalCounts(rowsAt('embedding', 1024, 1)).fitting;
  // The chosen box's own chip is the list under it.
  const chosen = rail.devices.find((entry) => entry.target.id === 'rtx4090');
  assert.equal(chosen?.fits, fitting);
  assert.ok(rail.families.length > 0);
});

test('a wider batch or a longer text always holds at least as much', () => {
  // Monotonicity is the one claim a reader will check by hand.
  for (const kind of ['embedding', 'reranking'] as const) {
    for (const stop of KIND_SHAPES[kind].flightStops) {
      const narrow = retrievalBounds(
        CHOICE,
        rowsAt(kind, 512, stop),
        512,
        stop
      );
      const wide = retrievalBounds(
        CHOICE,
        rowsAt(kind, 2048, stop),
        2048,
        stop
      );
      assert.ok(wide.workingSetGib >= narrow.workingSetGib, kind);
    }
  }
});

test('both families open on a workload the rail offers', () => {
  for (const shape of [EMBEDDING, RERANKING]) {
    assert.ok(TOKEN_STOPS.includes(shape.tokensDefault as never));
    assert.ok(shape.flightStops.includes(shape.flightDefault));
  }
});
