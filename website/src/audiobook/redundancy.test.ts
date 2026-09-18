import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dialogueRedundancyProblems,
  narrationOverlapWarnings,
  type DialogueFile,
} from './dialogue.ts';
import type { ChapterMeta } from './docs.ts';
import type { Block } from './extract.ts';
import { longestContentRun, redundancyHits } from './redundancy.ts';

/** The real how-llms-work t19/t20 echo: adjacent turns that restate the token list. */
const ECHO_A =
  "Now tokens. They're the units the model processes and emits: a word, a subword, punctuation, an image patch, an audio frame, or a tool-call structure, depending on the modality.";
const ECHO_B =
  "And a token is not a word. It's whatever unit the model actually reads and writes: a word, part of a word, punctuation, an image patch, an audio frame, or a tool call.";

/** The real how-llms-work t13/t17 defect: the figure narration re-lists the prose outputs. */
const NARRATION_ECHO_A =
  'Exactly. The output is one predicted next token, which immediately becomes part of the next context. That single loop is the mechanism behind every fluent paragraph, code patch, tool call, or chain of steps the model emits.';
const NARRATION_ECHO_B =
  'A fluent paragraph, a code patch, a tool call, a chain of steps — each is only that one small step repeating.';

/** The intended `sam` restatement (t29/t30): same idea, different words — not a repeat. */
const PARAPHRASE_A =
  'And while the most common answer keeps improving with more thinking, any single run gets less predictable.';
const PARAPHRASE_B =
  "So more thinking doesn't remove the variance. It moves the center of the answers in the right direction, while any single run wanders further.";

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
