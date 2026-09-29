import assert from 'node:assert/strict';
import test from 'node:test';
import type { AsrWord } from './align.ts';
import {
  dialogueDeixisProblems,
  dialogueDrawnLabelProblems,
  chunkTurns,
  hardViolations,
  isDriftViolation,
  roleLabel,
  turnSliceBounds,
  turnStartMs,
} from './dialogueScript.ts';
import type { DialogueFile } from './dialogueTypes.ts';
import {
  dialogueLexicalRedundancyProblems,
  dialogueRedundancyProblems,
} from './dialogueLexical.ts';
import { buildCorpus } from './lexical.ts';
import {
  ECHO_A,
  ECHO_B,
  PARAPHRASE_A,
  PARAPHRASE_B,
} from './testing.ts';
import type { ChapterMeta } from './docs.ts';
import type { Block } from './extract.ts';
import type { Segment } from './schemas.ts';

const turn = (id: string, speaker: 'alex' | 'sam', text: string): Segment => ({
  id,
  kind: 'turn',
  text,
  anchor: { kind: 'heading', id: null },
  speaker,
});

const word = (text: string, startMs: number): AsrWord => ({
  word: text,
  startOffset: `${startMs / 1000}s`,
  endOffset: `${(startMs + 400) / 1000}s`,
});

const dialogue = (turns: DialogueFile['turns']): DialogueFile => ({
  chapterId: 'demo',
  sourceHash: 'x'.repeat(64),
  turns,
});

const metaOf = (blocks: Block[]): ChapterMeta => ({
  title: 'Demo',
  headings: [
    { id: 'intro', title: 'Intro' },
    { id: 'why', title: 'Why' },
  ],
  sourceHash: 'x'.repeat(64),
  blocks,
  violations: [],
});

test('chunkTurns keeps every turn in order and never splits on the cap', () => {
  const turns = [
    turn('t1', 'alex', 'a'.repeat(1200)),
    turn('t2', 'sam', 'b'.repeat(1200)),
    turn('t3', 'alex', 'c'),
  ];
  const chunks = chunkTurns(turns, 2000);
  assert.deepEqual(
    chunks.map((chunk) => chunk.map((segment) => segment.id)),
    [['t1'], ['t2', 't3']]
  );
  assert.deepEqual(chunks.flat(), turns);
});

test('chunkTurns gives an over-long single turn its own chunk', () => {
  const chunks = chunkTurns([turn('t1', 'alex', 'a'.repeat(2500))], 2000);
  assert.deepEqual(
    chunks.map((chunk) => chunk.length),
    [1]
  );
});

test('drift is a warning, everything else is a hard violation', () => {
  const drift =
    'stale dialogue: chapter content changed since authoring (authored aaaa, now bbbb)';
  const coverage = 'demo: source figure 0 has no covering turn';
  assert.equal(isDriftViolation(drift), true);
  assert.equal(isDriftViolation(coverage), false);
  assert.deepEqual(hardViolations([drift, coverage]), [coverage]);
});

test('verbatim repeats are fatal, restatements are advisory, drift splits by gate', () => {
  const echo: DialogueFile['turns'] = [
    { id: 't1', speaker: 'alex', text: ECHO_A, anchor: { kind: 'heading', id: null } },
    { id: 't2', speaker: 'alex', text: ECHO_B, anchor: { kind: 'heading', id: null } },
  ];
  const restatement: DialogueFile['turns'] = [
    { id: 't1', speaker: 'alex', text: PARAPHRASE_A, anchor: { kind: 'heading', id: null } },
    { id: 't2', speaker: 'alex', text: PARAPHRASE_B, anchor: { kind: 'heading', id: null } },
  ];
  const corpus = buildCorpus([
    ECHO_A,
    ECHO_B,
    PARAPHRASE_A,
    PARAPHRASE_B,
    'Embeddings map text to vectors; retrieval is a nearest neighbour lookup.',
    'Attention pools at the edges of the window and fades in the middle.',
  ]);
  // Same-speaker restatement warns on the advisory channel, never the fatal one.
  assert.equal(
    dialogueLexicalRedundancyProblems('demo', dialogue(restatement), corpus)
      .length,
    1
  );
  assert.deepEqual(
    dialogueRedundancyProblems('demo', dialogue(restatement)),
    []
  );
  // The echo copies wording: fatal under both gates, drift-style warning never.
  const verbatim = dialogueRedundancyProblems('demo', dialogue(echo));
  assert.equal(verbatim.length, 1);
  const drift =
    'stale dialogue: chapter content changed since authoring (authored aaaa, now bbbb)';
  const mixed = [drift, ...verbatim];
  // Lint gates authored text, so it sees every violation including drift;
  // build/verify (hardViolations) filters drift out and only warns on it.
  assert.deepEqual(hardViolations(mixed), verbatim);
});

test('roleLabel returns the historic host names', () => {
  assert.equal(roleLabel('alex'), 'Alex');
  assert.equal(roleLabel('sam'), 'Sam');
});

test('turnStartMs maps turn starts to word offsets, monotonic with first 0', () => {
  const starts = turnStartMs(
    ['hello world', 'goodbye world'],
    [
      word('hello', 0),
      word('world', 500),
      word('goodbye', 1000),
      word('world', 1500),
    ]
  );
  assert.deepEqual(starts, [0, 1000]);
});

test('turnStartMs returns all zeros when there are no words', () => {
  assert.deepEqual(turnStartMs(['hello', 'world'], []), [0, 0]);
});

test('turnSliceBounds pins the first bound to 0 so a chunk keeps its leading word onset', () => {
  // The first turn's ASR start (7200 bytes = 300 ms @ 24 B/ms) must not become the first bound,
  // or the chunk's opening audio is sliced off before mastering.
  assert.deepEqual(turnSliceBounds([7200, 96000], 480000), [0, 96000, 480000]);
});

test('turnSliceBounds keeps every part contiguous from 0 to the chunk end', () => {
  const bounds = turnSliceBounds([0, 100, 250, 400], 1000);
  assert.deepEqual(bounds, [0, 100, 250, 400, 1000]);
  assert.equal(bounds.length, 5);
});

test('turnStartMs stays sane and non-decreasing when the first token was deleted', () => {
  const starts = turnStartMs(
    ['oh hello', 'world'],
    [word('hello', 300), word('world', 900)]
  );
  assert.equal(starts.length, 2);
  assert.ok(starts[0]! >= 0 && starts[1]! >= starts[0]!);
});

// The listener has no page: a turn that points at a figure is unfixable in audio.
test('dialogueDeixisProblems flags a turn that references a visual', () => {
  const data = dialogue([
    {
      id: 't1',
      speaker: 'alex',
      text: 'The figure shows the drift for one conversation.',
      anchor: { kind: 'heading', id: null },
    },
  ]);
  const problems = dialogueDeixisProblems('demo', data);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /t1 \(alex\) references "the figure"/);
});

test('dialogueDeixisProblems stays quiet on ear-first turns', () => {
  const data = dialogue([
    {
      id: 't1',
      speaker: 'alex',
      text: 'A single conversation drifts on its own.',
      anchor: { kind: 'heading', id: null },
    },
  ]);
  assert.deepEqual(dialogueDeixisProblems('demo', data), []);
});

// The figure paints its own words; a turn that reads them out is the narration defect
// with a voice. Resolution runs through the figure block, so it is per diagram.
const drawnFigure = (index: number, visual: string): Block[] => [
  {
    kind: 'figure',
    text: 'Two runs part company early.',
    label: 'Runs',
    anchor: { kind: 'figure', index },
    visual,
  },
];

test('dialogueDrawnLabelProblems flags a figure turn naming its drawn text', () => {
  const data = dialogue([
    {
      id: 't1',
      speaker: 'alex',
      text: 'One run lands on trust earned, another on a surprise fee.',
      anchor: { kind: 'figure', index: 0 },
    },
  ]);
  const problems = dialogueDrawnLabelProblems(
    'demo',
    metaOf(drawnFigure(0, 'LocalChoicesGlobalCoherenceDiagram')),
    data
  );
  assert.equal(problems.length, 2);
  assert.match(problems[0]!, /t1 \(alex\) names "trust earned": text drawn/);
});

test('dialogueDrawnLabelProblems ignores turns elsewhere and labels not painted', () => {
  const data = dialogue([
    {
      id: 't1',
      speaker: 'alex',
      text: 'One run lands on trust earned, another on a surprise fee.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      id: 't2',
      speaker: 'sam',
      text: 'And the other ends with trust earned.',
      anchor: { kind: 'figure', index: 1 },
    },
  ]);
  assert.deepEqual(
    dialogueDrawnLabelProblems(
      'demo',
      metaOf(drawnFigure(0, 'LocalChoicesGlobalCoherenceDiagram')),
      data
    ),
    []
  );
});
