import assert from 'node:assert/strict';
import test from 'node:test';
import {
  seededTokenTrain,
  seededZigzagPath,
  TOKEN_TRAIN_PALETTE,
} from './TokenTrainSequence.ts';
const VALID_SIGNALS = new Set(['ordinary', 'salient', 'compressed']);

test('seeded token trains are deterministic for a seed', () => {
  assert.deepEqual(
    seededTokenTrain('grounding-source', 10),
    seededTokenTrain('grounding-source', 10)
  );
});

test('seeded token trains change order across seeds', () => {
  assert.notDeepEqual(
    seededTokenTrain('grounding-source', 10),
    seededTokenTrain('harness-action', 10)
  );
});

test('seeded token trains cover the full modality palette at palette length', () => {
  const modalities = new Set(
    seededTokenTrain('coverage', TOKEN_TRAIN_PALETTE.length).map(
      (token) => token.modality
    )
  );

  assert.deepEqual(
    modalities,
    new Set(TOKEN_TRAIN_PALETTE.map((t) => t.modality))
  );
});

test('token train palette uses only canonical modalities', () => {
  assert.deepEqual(TOKEN_TRAIN_PALETTE, [
    { modality: 'text' },
    { modality: 'code' },
    { modality: 'image' },
    { modality: 'audio' },
    { modality: 'video' },
  ]);
});

test('seeded token trains only emit valid signals', () => {
  for (const token of seededTokenTrain('valid-signals', 24)) {
    assert.equal(VALID_SIGNALS.has(token.signal ?? 'ordinary'), true);
  }
});

test('seeded token trains avoid adjacent duplicate tokens when possible', () => {
  const tokens = seededTokenTrain('no-adjacent-duplicates', 24);

  for (let index = 1; index < tokens.length; index += 1) {
    assert.notDeepEqual(tokens[index], tokens[index - 1]);
  }
});

test('seeded zigzag paths preserve endpoints and alternate bends', () => {
  const path = seededZigzagPath(
    { x: 0, y: 0 },
    { x: 0, y: 40 },
    'vertical',
    'probability',
    3
  );
  const points = [...path.matchAll(/(-?\d+\.\d+) (-?\d+\.\d+)/g)].map(
    ([, x, y]) => ({ x: Number(x), y: Number(y) })
  );
  const bends = points.slice(1, -1);

  assert.equal(
    path,
    seededZigzagPath(
      { x: 0, y: 0 },
      { x: 0, y: 40 },
      'vertical',
      'probability',
      3
    )
  );
  assert.deepEqual(points.at(0), { x: 0, y: 0 });
  assert.deepEqual(points.at(-1), { x: 0, y: 40 });
  assert.equal(bends.length, 3);
  for (let index = 1; index < bends.length; index += 1) {
    assert.equal(bends[index - 1].x * bends[index].x < 0, true);
  }
});
