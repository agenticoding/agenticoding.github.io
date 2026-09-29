import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dialogueDeixisProblems,
  dialogueDrawnLabelProblems,
} from './dialogueScript.ts';
import {
  isDialogueChapter,
  loadDialogueFile,
} from './dialogueTypes.ts';
import { wholeBookCorpus } from './dialogueCorpus.ts';
import { AUDIO_DOC_IDS, chapterMeta } from './docs.ts';

test('every document extracts without unclassified nodes or markup leakage', () => {
  const problems = AUDIO_DOC_IDS.flatMap((id) => chapterMeta(id).violations);
  assert.deepEqual(problems, []);
});

test('every document declares a title', () => {
  const missing = AUDIO_DOC_IDS.filter((id) => !chapterMeta(id).title);
  assert.deepEqual(missing, []);
});

// The production corpus path (not an injected fixture) is what the fatal gates
// actually run against; exercising it here keeps its real-corpus behavior visible
// to `npm test` instead of only to a manual `audio:dialogue:lint`.
test('the whole-book corpus builds from every chapter and is memoized', () => {
  const corpus = wholeBookCorpus();
  assert.ok(
    corpus.documents > AUDIO_DOC_IDS.length,
    `expected one document per block/turn, got ${corpus.documents}`
  );
  assert.ok(corpus.df.size > 0, 'corpus has no terms');
  assert.equal(wholeBookCorpus(), corpus, 'corpus must be memoized');
});

// Golden: a chapter's turns are its voice, and the voice has no page. Every
// authored dialogue is scanned so a new chapter cannot silently ship deixis; the
// narration sibling is already covered by the extraction check above.
test('no authored dialogue turn references a visual', () => {
  const authored = AUDIO_DOC_IDS.filter(isDialogueChapter);
  assert.ok(
    authored.length > 0,
    'no authored dialogue: the contract is vacuous'
  );
  const problems = authored.flatMap((id) =>
    dialogueDeixisProblems(id, loadDialogueFile(id)!)
  );
  assert.deepEqual(problems, []);
});

// Golden: the drawing is not a script. A figure turn that reads out its own painted
// labels is the same defect from the other end, so the authored voice is held to the
// rule `extract.ts` already applies to narration.
test('no authored dialogue turn names text drawn in its figure', () => {
  const problems = AUDIO_DOC_IDS.filter(isDialogueChapter).flatMap((id) =>
    dialogueDrawnLabelProblems(id, chapterMeta(id), loadDialogueFile(id)!)
  );
  assert.deepEqual(problems, []);
});

test('figure and code anchors are unique and code blocks resolve their heading', () => {
  const bad: string[] = [];
  for (const id of AUDIO_DOC_IDS) {
    const { blocks, headings } = chapterMeta(id);
    const figures = blocks.flatMap((block) =>
      block.kind === 'figure' && block.anchor.kind === 'figure'
        ? [block.anchor.index]
        : []
    );
    const codes = blocks.flatMap((block) =>
      block.kind === 'code' && block.anchor.kind === 'code'
        ? [block.anchor.index]
        : []
    );
    if (new Set(figures).size !== figures.length)
      bad.push(`${id}: duplicate figure anchors`);
    if (new Set(codes).size !== codes.length)
      bad.push(`${id}: duplicate code anchors`);
    const headingIds = new Set(headings.map((heading) => heading.id));
    for (const block of blocks) {
      if (
        block.kind === 'code' &&
        block.anchor.kind === 'code' &&
        block.anchor.headingId &&
        !headingIds.has(block.anchor.headingId)
      ) {
        bad.push(
          `${id}: code block ${block.anchor.index} points at unknown heading`
        );
      }
    }
  }
  assert.deepEqual(bad, []);
});
