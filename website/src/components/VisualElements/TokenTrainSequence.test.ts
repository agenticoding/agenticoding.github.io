import assert from 'node:assert/strict';
import test from 'node:test';
import {
  seededTokenTrain,
  TOKEN_TRAIN_PALETTE,
} from './TokenTrainSequence.ts';
const VALID_SIGNALS = new Set([
  'ordinary',
  'salient',
  'compressed',
]);

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

  assert.deepEqual(modalities, new Set(TOKEN_TRAIN_PALETTE.map((t) => t.modality)));
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
