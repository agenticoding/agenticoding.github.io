import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MODEL_MODALITIES,
  modalityFlowCode,
  modalitySentence,
  modalityTokens,
} from './modalityProfile.ts';

test('every channel draws with a token shape and the book signal convention', () => {
  const tokens = modalityTokens(MODEL_MODALITIES);
  // A channel without a shape would draw as text and claim the wrong input.
  assert.deepEqual(
    tokens.map((token) => token.modality),
    [...MODEL_MODALITIES]
  );
  assert.deepEqual(
    tokens.map((token) => token.signal),
    ['ordinary', 'ordinary', 'ordinary', 'compressed']
  );
  assert.deepEqual(
    tokens.map((token) => token.label),
    [...MODEL_MODALITIES]
  );
});

test('a flow states its channels in words', () => {
  const sentence = (input: (typeof MODEL_MODALITIES)[number][]) =>
    modalitySentence({ input, output: ['text'] });
  assert.equal(sentence(['text']), 'Text input; text output');
  assert.equal(
    sentence(['text', 'image']),
    'Text and image input; text output'
  );
  assert.equal(
    sentence(['text', 'image', 'audio']),
    'Text, image, and audio input; text output'
  );
  assert.equal(
    sentence(['text', 'image', 'audio', 'video']),
    'Text, image, audio, and video input; text output'
  );
});

test('a flow has one machine form for the table contract', () => {
  assert.equal(
    modalityFlowCode({ input: ['text', 'image'], output: ['text'] }),
    'in:text+image;out:text'
  );
  // Sinks travel in the same code: an embedder ends in a vector, a reranker in
  // a score, so a contract can read either family's claim without a drawing.
  assert.equal(
    modalityFlowCode({ input: ['text'], output: ['vector'] }),
    'in:text;out:vector'
  );
  assert.equal(
    modalityFlowCode({ input: ['text'], output: ['score'] }),
    'in:text;out:score'
  );
});
