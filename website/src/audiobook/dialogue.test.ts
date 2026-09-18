import assert from 'node:assert/strict';
import test from 'node:test';
import type { AsrWord } from './align.ts';
import {
  dialogueBloatWarnings,
  dialogueCoverageProblems,
  chunkTurns,
  hardViolations,
  isDriftViolation,
  roleLabel,
  turnSliceBounds,
  turnStartMs,
  validateDialogue,
  type DialogueFile,
} from './dialogue.ts';
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

test('validateDialogue reports non-sequential ids, empty text and unknown speakers', () => {
  const problems = validateDialogue(
    'demo',
    dialogue([
      {
        id: 't2',
        speaker: 'alex',
        text: '',
        anchor: { kind: 'heading', id: null },
      },
      {
        id: 't2',
        speaker: 'narrator' as 'alex',
        text: 'ok',
        anchor: { kind: 'heading', id: null },
      },
    ])
  );
  assert.ok(
    problems.some((problem) => problem.includes('id must be sequential'))
  );
  assert.ok(problems.some((problem) => problem.includes('empty text')));
  assert.ok(problems.some((problem) => problem.includes('unknown speaker')));
});

test('validateDialogue accepts a well-formed script', () => {
  const problems = validateDialogue(
    'demo',
    dialogue([
      {
        id: 't1',
        speaker: 'alex',
        text: 'one',
        anchor: { kind: 'heading', id: null },
      },
      {
        id: 't2',
        speaker: 'sam',
        text: 'two',
        anchor: { kind: 'heading', id: null },
      },
    ])
  );
  assert.deepEqual(problems, []);
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

test('coverage passes when every section, figure and term is spoken', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: '100 percent.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      kind: 'figure',
      text: 'The loop.',
      label: 'Loop',
      anchor: { kind: 'figure', index: 0 },
    },
    {
      kind: 'code',
      text: 'Run the command.',
      label: 'bash',
      anchor: { kind: 'code', index: 0, headingId: 'intro' },
    },
  ];
  const data = dialogue([
    {
      id: 't1',
      speaker: 'alex',
      text: 'Section: Intro. 100 percent.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      id: 't2',
      speaker: 'sam',
      text: 'The loop.',
      anchor: { kind: 'figure', index: 0 },
    },
    {
      id: 't3',
      speaker: 'alex',
      text: 'Run the command.',
      anchor: { kind: 'code', index: 0, headingId: 'intro' },
    },
  ]);
  assert.deepEqual(dialogueCoverageProblems('demo', metaOf(blocks), data), []);
});

test('coverage reports uncovered sections, figures, code and missing terms', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'Start here 100.',
      anchor: { kind: 'heading', id: 'intro' },
    },
    {
      kind: 'figure',
      text: 'A loop.',
      label: 'Loop',
      anchor: { kind: 'figure', index: 0 },
    },
    {
      kind: 'code',
      text: 'Set --flag.',
      label: 'bash',
      anchor: { kind: 'code', index: 0, headingId: null },
    },
  ];
  const data = dialogue([
    {
      id: 't1',
      speaker: 'alex',
      text: 'Section: Why.',
      anchor: { kind: 'heading', id: 'why' },
    },
  ]);
  const problems = dialogueCoverageProblems('demo', metaOf(blocks), data);
  assert.ok(
    problems.some((problem) => problem.includes('source section "Intro"'))
  );
  assert.ok(problems.some((problem) => problem.includes('source figure 0')));
  assert.ok(
    problems.some((problem) => problem.includes('source code block 0'))
  );
  assert.ok(
    problems.some((problem) => problem.includes('critical term "100"'))
  );
});

test('bloat warns when a section speaks far more than its source', () => {
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'Short source.',
      anchor: { kind: 'heading', id: 'intro' },
    },
  ];
  const data = dialogue([
    {
      id: 't1',
      speaker: 'alex',
      text: 'x'.repeat(5000),
      anchor: { kind: 'heading', id: 'intro' },
    },
  ]);
  const warnings = dialogueBloatWarnings(metaOf(blocks), data);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0]!, /section "Intro"/);
});
