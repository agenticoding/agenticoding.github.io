import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCorpus,
  idfCosine,
  lexicalRedundancyHits,
  sharedContentTerms,
  type Corpus,
} from './lexical.ts';
import { AUDIO_CONFIG } from './config.ts';
import {
  dialogueLexicalRedundancyProblems,
  dialogueRedundancyProblems,
} from './dialogueLexical.ts';
import type { DialogueFile } from './dialogueTypes.ts';
import { sharesContentTrigram } from './redundancy.ts';
import { ECHO_A, ECHO_B, PARAPHRASE_A, PARAPHRASE_B } from './testing.ts';

/** Bag-of-words repeat with no shared phrase: the vocabulary echo the run gate misses. */
const VOCAB_A =
  'The stored vector is compared against every candidate vector inside the index.';
const VOCAB_B =
  'Every candidate inside the index gets compared to the stored vector.';

/** Small explicit corpus: the fixtures plus neutral filler. */
const corpusOf = (extra: string[] = []): Corpus =>
  buildCorpus([
    ECHO_A,
    ECHO_B,
    PARAPHRASE_A,
    PARAPHRASE_B,
    VOCAB_A,
    VOCAB_B,
    'Embeddings map text to vectors; retrieval is a nearest neighbour lookup.',
    'Attention pools at the edges of the window and fades in the middle.',
    ...extra,
  ]);

const turn = (
  id: string,
  text: string,
  speaker: 'alex' | 'sam' = 'alex'
): DialogueFile['turns'][number] => ({
  id,
  speaker,
  text,
  anchor: { kind: 'heading', id: null },
});

const dialogue = (
  turns: DialogueFile['turns'],
  rest: Partial<DialogueFile> = {}
): DialogueFile => ({
  chapterId: 'demo',
  sourceHash: 'x'.repeat(64),
  turns,
  ...rest,
});

const fireOf = (turns: DialogueFile['turns'], corpus = corpusOf()): string[] =>
  dialogueLexicalRedundancyProblems('demo', dialogue(turns), corpus);

test('idfCosine of a text with itself is 1', () => {
  assert.equal(idfCosine(ECHO_A, ECHO_A, corpusOf()), 1);
});

test('idfCosine is symmetric and stays inside [0, 1]', () => {
  const corpus = corpusOf();
  for (const [a, b] of [
    [ECHO_A, ECHO_B],
    [ECHO_A, PARAPHRASE_A],
    [PARAPHRASE_A, PARAPHRASE_B],
    [VOCAB_A, VOCAB_B],
  ] as const) {
    const value = idfCosine(a, b, corpus);
    assert.equal(value, idfCosine(b, a, corpus), 'cosine must be symmetric');
    assert.ok(value >= 0 && value <= 1, `out of range: ${value}`);
  }
});

test('empty text has no lexical overlap', () => {
  const corpus = corpusOf();
  assert.equal(idfCosine('', ECHO_A, corpus), 0);
  assert.equal(idfCosine(ECHO_A, '', corpus), 0);
});

test('the echo outscores the paraphrase: lexical overlap, not meaning', () => {
  const corpus = corpusOf();
  const echo = idfCosine(ECHO_A, ECHO_B, corpus);
  const paraphrase = idfCosine(PARAPHRASE_A, PARAPHRASE_B, corpus);
  assert.ok(
    echo > paraphrase,
    `echo ${echo} should exceed paraphrase ${paraphrase}`
  );
  assert.ok(echo >= AUDIO_CONFIG.redundancy.lexical.cosineMin);
});

test('sharesContentTrigram sees a reused phrase, not scattered jargon', () => {
  assert.ok(sharesContentTrigram(PARAPHRASE_A, PARAPHRASE_B));
  assert.ok(!sharesContentTrigram(VOCAB_A, VOCAB_B));
});

test('intro t2/t4 function-word overlap does not fire', () => {
  assert.deepEqual(
    fireOf([
      turn('t2', "So it isn't a tool that waits for my next keystroke. It runs, and it builds to spec — which means the spec is the thing I have to get right."),
      turn('t4', 'So for the first time, the limit on what I can build is my intent, not my hands.'),
    ]),
    []
  );
});

test('intro t5/t6 cross-speaker restatement does not fire', () => {
  assert.deepEqual(
    fireOf([
      turn('t5', 'That skill is the whole prize. Operate the machine well and the labor moves to it while the judgment stays with you.', 'alex'),
      turn('t6', "The labor goes to the machine, the calls stay with me. That's the part I can't hand over.", 'sam'),
    ]),
    []
  );
});

test('the echo fires and names both turns', () => {
  const problems = fireOf([turn('t1', ECHO_A), turn('t2', ECHO_B)]);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /t1/);
  assert.match(problems[0]!, /t2/);
  assert.match(problems[0]!, /%/);
});

test('a cross-speaker restatement of a shared phrase passes', () => {
  const problems = fireOf([
    turn('t1', PARAPHRASE_A, 'alex'),
    turn('t2', PARAPHRASE_B, 'sam'),
  ]);
  assert.deepEqual(problems, []);
});

test('the same restatement from one speaker fires: self-repeat is the defect', () => {
  const problems = fireOf([turn('t1', PARAPHRASE_A), turn('t2', PARAPHRASE_B)]);
  assert.equal(problems.length, 1);
});

test('a paraphrase warns at the lexical gate but never trips the verbatim run gate', () => {
  // Paraphrase-vs-echo boundary: the same-speaker restatement fires the
  // advisory lexical WARN (the loadDialogue warnings channel) while the fatal
  // verbatim run gate stays silent — restatement is the format, copying is the defect.
  const turns = [turn('t1', PARAPHRASE_A), turn('t2', PARAPHRASE_B)];
  assert.equal(fireOf(turns).length, 1);
  assert.deepEqual(dialogueRedundancyProblems('demo', dialogue(turns)), []);
});

test('chained repeats collapse into one fact cluster', () => {
  const [a, b, c] = [
    'stored vector compared candidate vector index every query',
    'candidate vector index compared stored vector query every',
    'every query compared index stored vector candidate vector',
  ];
  const problems = fireOf([turn('t1', a!), turn('t2', b!), turn('t3', c!)]);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /t1, t2, t3/);
});

test('lexicalRedundancyHits is deterministic and skips turns too short to carry a fact', () => {
  const corpus = corpusOf();
  const { minTokens } = AUDIO_CONFIG.redundancy.lexical;
  const turns = [
    turn('t1', ECHO_A),
    turn('t2', ECHO_B),
    turn('t3', 'Exactly.'),
  ];
  const first = lexicalRedundancyHits(turns, corpus, { minTokens });
  const second = lexicalRedundancyHits(turns, corpus, { minTokens });
  assert.deepEqual(first, second);
  assert.equal(first.length, 1);
  assert.equal(first[0]!.phrase, true);
});

test('sharedContentTerms names the reused vocabulary, rarest first', () => {
  const corpus = corpusOf();
  const shared = sharedContentTerms(ECHO_A, ECHO_B, corpus);
  assert.ok(shared.includes('punctuation'));
  assert.ok(shared.includes('patch'));
  assert.deepEqual(
    sharedContentTerms(PARAPHRASE_A, 'Unrelated cooking text here.', corpus),
    []
  );
});
