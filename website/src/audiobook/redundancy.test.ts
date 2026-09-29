import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dialogueRedundancyProblems,
  docRedundancyProblems,
} from './dialogueLexical.ts';
import { narrationOverlapWarnings } from './dialogueScript.ts';
import type { DialogueFile } from './dialogueTypes.ts';
import { buildCorpus } from './lexical.ts';
import type { ChapterMeta } from './docs.ts';
import type { Block } from './extract.ts';
import {
  longestContentRun,
  redundancyHits,
  sharesContentTrigram,
} from './redundancy.ts';
import { ECHO_A, ECHO_B, PARAPHRASE_A, PARAPHRASE_B } from './testing.ts';

/** The real how-llms-work t13/t17 defect: the figure narration re-lists the prose outputs. */
const NARRATION_ECHO_A =
  'Exactly. The output is one predicted next token, which immediately becomes part of the next context. That single loop is the mechanism behind every fluent paragraph, code patch, tool call, or chain of steps the model emits.';
const NARRATION_ECHO_B =
  'A fluent paragraph, a code patch, a tool call, a chain of steps — each is only that one small step repeating.';

const turn = (id: string, text: string): DialogueFile['turns'][number] => ({
  id,
  speaker: 'alex',
  text,
  anchor: { kind: 'heading', id: null },
});

const dialogue = (turns: DialogueFile['turns']): DialogueFile => ({
  chapterId: 'demo',
  sourceHash: 'x'.repeat(64),
  turns,
});

const metaOf = (blocks: Block[]): ChapterMeta => ({
  title: 'Demo',
  headings: [],
  sourceHash: 'x'.repeat(64),
  blocks,
  violations: [],
});

test('longestContentRun finds the content run shared by the real echo', () => {
  assert.equal(
    longestContentRun(ECHO_A, ECHO_B),
    'word punctuation image patch audio frame tool call'
  );
});

test('longestContentRun catches the narration echo the old run-based guard missed', () => {
  const run = longestContentRun(NARRATION_ECHO_A, NARRATION_ECHO_B);
  assert.ok(run.length >= 20, `expected a repeat, got "${run}"`);
});

test('longestContentRun ignores meaning: the intended paraphrase shares no long run', () => {
  assert.ok(longestContentRun(PARAPHRASE_A, PARAPHRASE_B).length < 20);
});

test('sharesContentTrigram finds a reused phrase and ignores scattered words', () => {
  assert.ok(sharesContentTrigram(PARAPHRASE_A, PARAPHRASE_B));
  assert.ok(
    !sharesContentTrigram(
      'The stored vector is compared against every candidate vector inside the index.',
      'Every candidate inside the index gets compared to the stored vector.'
    )
  );
});

test('redundancyHits flags a content repeat but never the intended paraphrase', () => {
  assert.equal(
    redundancyHits([turn('t1', ECHO_A), turn('t2', ECHO_B)], {
      runCharsMin: 20,
    }).length,
    1
  );
  assert.deepEqual(
    redundancyHits([turn('t1', PARAPHRASE_A), turn('t2', PARAPHRASE_B)], {
      runCharsMin: 20,
    }),
    []
  );
});

test('redundancyHits is chapter-global: distance never excuses a repeat', () => {
  const turns = [
    turn('t1', ECHO_A),
    ...Array.from({ length: 6 }, (_, i) => turn(`f${i}`, 'Filler.')),
    turn('t8', ECHO_B),
  ];
  assert.equal(redundancyHits(turns, { runCharsMin: 20 }).length, 1);
});

test('redundancyHits ignores shared function words: they repeat, but carry no fact', () => {
  const a = 'This is the one that is in the other of the many.';
  const b = 'That is the one that is in the other of the most.';
  assert.deepEqual(
    redundancyHits([turn('t1', a), turn('t2', b)], { runCharsMin: 20 }),
    []
  );
});

test('dialogueRedundancyProblems names both turns and the repeated content', () => {
  const problems = dialogueRedundancyProblems(
    'demo',
    dialogue([turn('t1', ECHO_A), turn('t2', ECHO_B)])
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /t1 and t2/);
  assert.match(problems[0]!, /content run/);
});

test('narrationOverlapWarnings flags a figure narration that restates the prose beside it', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'Tokens are the units the model processes and emits: a word, subword, punctuation, image patch, audio frame, or tool-call structure.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      kind: 'figure',
      text: 'A token is not a word. It is whatever unit the model reads and writes: a word, part of a word, punctuation, an image patch, an audio frame, or a tool call.',
      label: 'Token types',
      anchor: { kind: 'figure', index: 0 },
    },
  ];
  const warnings = narrationOverlapWarnings(metaOf(blocks));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0]!, /figure 0/);
});

test('narrationOverlapWarnings stays quiet when the narration adds a new idea', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'Tokens are the units the model processes and emits.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      kind: 'figure',
      text: 'Attention weighs every other position, so a bank beside a river reads differently than beside an account.',
      label: 'Attention',
      anchor: { kind: 'figure', index: 0 },
    },
  ];
  assert.deepEqual(narrationOverlapWarnings(metaOf(blocks)), []);
});

// The caption is printed under the figure while the narration is spoken: restating it
// out loud says the same thing twice. A hint only — page text and spoken text overlap.
test('narrationOverlapWarnings flags a figure narration that restates its own caption', () => {
  const blocks: Block[] = [
    {
      kind: 'figure',
      text: 'The selected token is appended to the context, then the same loop runs again to produce the next token.',
      label: 'Loop',
      anchor: { kind: 'figure', index: 0 },
      caption:
        'The selected token is appended to the context, then the loop runs again for the next token.',
    },
  ];
  const warnings = narrationOverlapWarnings(metaOf(blocks));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0]!, /figure 0 restates its own caption/);
});

test('narrationOverlapWarnings stays quiet when the caption only labels the parts', () => {
  const blocks: Block[] = [
    {
      kind: 'figure',
      text: 'Nothing in the wording tells you which answer was forced true, so validate outside the model.',
      label: 'Logic',
      anchor: { kind: 'figure', index: 0 },
      caption: 'A rule path on the left, a probability landscape on the right.',
    },
  ];
  assert.deepEqual(narrationOverlapWarnings(metaOf(blocks)), []);
});

const docCorpus = (blocks: Block[]): ReturnType<typeof buildCorpus> =>
  buildCorpus([
    ...blocks.map((block) => block.text),
    'Embeddings map text to vectors; retrieval is a nearest neighbour lookup.',
    'Attention pools at the edges of the window and fades in the middle.',
    'A workflow agent owns the loop and calls the model at bounded junctions.',
    'Context is the smallest set of high-signal tokens a task depends on.',
    'A sub-agent finds and compresses; the frontier model only thinks.',
  ]);

test('docRedundancyProblems fails a figure narration that restates the prose beside it', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'Tokens are the units the model processes and emits: a word, subword, punctuation, image patch, audio frame, or tool-call structure.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      kind: 'figure',
      text: 'A token is not a word. It is whatever unit the model reads and writes: a word, part of a word, punctuation, an image patch, an audio frame, or a tool call.',
      label: 'Token types',
      anchor: { kind: 'figure', index: 0 },
    },
  ];
  const meta = metaOf(blocks);
  const problems = docRedundancyProblems('demo', meta, docCorpus(blocks));
  assert.ok(problems.length >= 1, 'the doc echo must be reported');
  assert.match(problems[0]!, /figure 0 narration/);
});

test('docRedundancyProblems reports the same fact repeated across two prose sections', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'The index is built once and paid for once, so every later query is nearly free.',
      anchor: { kind: 'heading', id: 'a' },
    },
    {
      kind: 'prose',
      text: 'Because the index is built once and paid for once, a later query costs almost nothing.',
      anchor: { kind: 'heading', id: 'b' },
    },
  ];
  const meta = metaOf(blocks);
  const problems = docRedundancyProblems('demo', meta, docCorpus(blocks));
  assert.ok(problems.length >= 1, 'the prose repeat must be reported');
  assert.match(problems[0]!, /prose/);
});

test('docRedundancyProblems passes a narration that adds a new idea', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'Tokens are the units the model processes and emits.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      kind: 'figure',
      text: 'Attention weighs every other position, so a bank beside a river reads differently than beside an account.',
      label: 'Attention',
      anchor: { kind: 'figure', index: 0 },
    },
  ];
  assert.deepEqual(
    docRedundancyProblems('demo', metaOf(blocks), docCorpus(blocks)),
    []
  );
});
