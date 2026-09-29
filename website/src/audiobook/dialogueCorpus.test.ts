import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIO_DOC_IDS, chapterMeta } from './docs.ts';
import {
  isDialogueChapter,
  loadDialogueFile,
} from './dialogueTypes.ts';
import {
  resetWholeBookCorpus,
  wholeBookCorpus,
} from './dialogueCorpus.ts';

// Resetting the memo forces a rebuild from disk: the next call returns a fresh
// corpus instead of the cached instance, so tests can isolate corpus state.
test('resetWholeBookCorpus discards the memoized corpus', () => {
  const before = wholeBookCorpus();
  assert.ok(before.documents > AUDIO_DOC_IDS.length);
  resetWholeBookCorpus();
  const after = wholeBookCorpus();
  assert.notEqual(after, before);
  assert.equal(after.documents, before.documents);
});

// The corpus is the live whole-book IDF: every chapter must contribute its
// source blocks plus its dialogue turns, or lexical scoring silently drifts.
test('every AUDIO_DOC_IDS chapter contributes its blocks and turns to the corpus', () => {
  resetWholeBookCorpus();
  const corpus = wholeBookCorpus();
  let expected = 0;
  for (const docId of AUDIO_DOC_IDS) {
    expected += chapterMeta(docId).blocks.length;
    if (isDialogueChapter(docId)) {
      const dialogue = loadDialogueFile(docId);
      assert.ok(dialogue, `${docId} is a dialogue chapter without a script`);
      expected += dialogue.turns.length;
    }
  }
  assert.equal(corpus.documents, expected);
});
