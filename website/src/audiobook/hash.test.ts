import assert from 'node:assert/strict';
import test from 'node:test';
import { dialogueTranscript } from './dialogue.ts';
import { dialogueChunkCacheKey, promptCacheKey } from './hash.ts';

const turns = (
  texts: string[]
): Array<{ speaker: 'alex' | 'sam'; text: string }> =>
  texts.map((text, index) => ({ speaker: index % 2 ? 'sam' : 'alex', text }));

test('promptCacheKey changes whenever the prompt changes', () => {
  // The prompt (template line, speaker labels, turn text) IS the render contract:
  // any edit to it must re-render, so any edit must change the key.
  assert.equal(promptCacheKey('same'), promptCacheKey('same'));
  assert.notEqual(promptCacheKey('same'), promptCacheKey('same.'));
  assert.notEqual(promptCacheKey('Alex: one'), promptCacheKey('Sam: one'));
});

// The no-drift guarantee: the chunk cache key hashes the exact transcript the
// render request sends — never a second, drifting copy of it.
test('dialogueChunkCacheKey hashes the transcript the render request sends', () => {
  const chunk = turns(['one', 'two']);
  assert.equal(
    dialogueChunkCacheKey(chunk),
    promptCacheKey(dialogueTranscript(chunk))
  );
  assert.match(
    dialogueTranscript(chunk),
    /^TTS the following conversation between Alex and Sam\./
  );
  assert.match(dialogueTranscript(chunk), /Alex: one/);
  assert.match(dialogueTranscript(chunk), /Sam: two/);
});
