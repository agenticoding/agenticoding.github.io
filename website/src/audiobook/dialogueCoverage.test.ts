import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  dialogueBloatWarnings,
  dialogueCoverageProblems,
  validateDialogue,
} from './dialogueCoverage.ts';
import type { DialogueFile } from './dialogueTypes.ts';
import type { ChapterMeta } from './docs.ts';
import type { Block } from './extract.ts';

const dialogue = (turns: DialogueFile['turns']): DialogueFile => ({
  chapterId: 'demo',
  sourceHash: 'x'.repeat(64),
  turns,
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

// A described literal is an arbitrary example the voice describes instead of
// speaks: the book keeps it, the ear is spared. The declaration exempts it from
// term coverage, but only with a reason and only for a real source critical term.
const literalMeta = () =>
  metaOf([
    {
      kind: 'prose',
      text: 'Prepend the string AKJSs89sal to the fifth poem.',
      anchor: { kind: 'heading', id: 'intro' },
    },
  ]);

const literalData = (
  describedLiterals?: DialogueFile['describedLiterals']
): DialogueFile => ({
  chapterId: 'demo',
  sourceHash: 'x'.repeat(64),
  ...(describedLiterals ? { describedLiterals } : {}),
  turns: [
    {
      id: 't1',
      speaker: 'alex',
      text: 'Prepend a short random prefix to the fifth poem.',
      anchor: { kind: 'heading', id: 'intro' },
    },
  ],
});

test('a declared literal with a reason is exempt from the critical-term requirement', () => {
  assert.deepEqual(
    dialogueCoverageProblems(
      'demo',
      literalMeta(),
      literalData([
        {
          term: 'AKJSs89sal',
          reason:
            'arbitrary benchmark example literal; the voice describes it as a short random prefix',
        },
      ])
    ),
    []
  );
});

test('a described literal with a whitespace-only reason fails', () => {
  const problems = dialogueCoverageProblems(
    'demo',
    literalMeta(),
    literalData([{ term: 'AKJSs89sal', reason: '   ' }])
  );
  assert.ok(
    problems.some((problem) => problem.includes('needs a non-empty reason'))
  );
});

test('a semantic flag absent from the source can never be a describedLiteral', () => {
  // describedLiterals exempts voiced terms; it must never smuggle a new
  // semantic token (flag, number, identifier) past the voice.
  const problems = dialogueCoverageProblems(
    'demo',
    literalMeta(),
    literalData([
      { term: '--dry-run', reason: 'trying to hide a new flag' },
    ])
  );
  assert.ok(
    problems.some((problem) =>
      problem.includes('is not a critical term of the chapter source')
    )
  );
});

test('a plain source word can never be a describedLiteral, only a critical term can', () => {
  // "strawberry" is in the source but carries no critical pattern (no digit,
  // caps, or separator), so describing it away is rejected — plain words go
  // through declaredCriticalTerms, never describedLiterals.
  const data: DialogueFile = {
    chapterId: 'demo',
    sourceHash: 'x'.repeat(64),
    describedLiterals: [
      { term: 'strawberry', reason: 'the named example' },
    ],
    turns: [
      {
        id: 't1',
        speaker: 'alex',
        text: "Counting r's in strawberry proves nothing about reasoning.",
        anchor: { kind: 'heading', id: 'intro' },
      },
    ],
  };
  const problems = dialogueCoverageProblems('demo', strawberryMeta(), data);
  assert.ok(
    problems.some((problem) =>
      problem.includes('is not a critical term of the chapter source')
    )
  );
});

test('a described literal with an empty reason fails', () => {
  const problems = dialogueCoverageProblems(
    'demo',
    literalMeta(),
    literalData([{ term: 'AKJSs89sal', reason: '' }])
  );
  assert.ok(
    problems.some((problem) => problem.includes('needs a non-empty reason'))
  );
});

test('a described literal that is not a source critical term fails', () => {
  const problems = dialogueCoverageProblems(
    'demo',
    literalMeta(),
    literalData([{ term: 'ZZZ999', reason: 'some reason' }])
  );
  assert.ok(
    problems.some((problem) =>
      problem.includes('is not a critical term of the chapter source')
    )
  );
});

test('an undeclared critical term still fails as before', () => {
  const problems = dialogueCoverageProblems(
    'demo',
    literalMeta(),
    literalData()
  );
  assert.ok(
    problems.some((problem) =>
      problem.includes('critical term "AKJSs89sal" missing')
    )
  );
});

// A plain word the pattern classifier cannot see: declared per chapter so a
// paraphrase that drops the named example fails the gate instead of shipping.
const strawberryMeta = (): ChapterMeta =>
  metaOf([
    {
      kind: 'prose',
      text: "Counting r's in strawberry proves nothing about reasoning.",
      anchor: { kind: 'heading', id: 'intro' },
    },
  ]);

const strawberryData = (
  text: string,
  declaredCriticalTerms?: DialogueFile['declaredCriticalTerms']
): DialogueFile => ({
  chapterId: 'demo',
  sourceHash: 'x'.repeat(64),
  ...(declaredCriticalTerms ? { declaredCriticalTerms } : {}),
  turns: [
    {
      id: 't1',
      speaker: 'alex',
      text,
      anchor: { kind: 'heading', id: 'intro' },
    },
  ],
});

const STRAWBERRY = [
  { term: 'strawberry', reason: 'the named example the section turns on' },
];

test('a declared plain word is required and fails when the voice drops it', () => {
  const data = strawberryData(
    "Counting r's in a word proves nothing.",
    STRAWBERRY
  );
  assert.deepEqual(dialogueCoverageProblems('demo', strawberryMeta(), data), [
    'demo: critical term "strawberry" missing from dialogue turns',
  ]);
});

test('a declared plain word passes once spoken verbatim', () => {
  const data = strawberryData(
    "Counting r's in strawberry proves nothing.",
    STRAWBERRY
  );
  assert.deepEqual(dialogueCoverageProblems('demo', strawberryMeta(), data), []);
});

test('a declared word needs a non-empty reason', () => {
  const data = strawberryData(
    "Counting r's in strawberry proves nothing.",
    [{ term: 'strawberry', reason: '  ' }]
  );
  const problems = dialogueCoverageProblems('demo', strawberryMeta(), data);
  assert.ok(
    problems.some((problem) => problem.includes('needs a non-empty reason'))
  );
});

test('a declared word that is absent from the source is rejected', () => {
  const data = strawberryData(
    "Counting r's in strawberry proves nothing.",
    [{ term: 'pineapple', reason: 'not in the source' }]
  );
  const problems = dialogueCoverageProblems('demo', strawberryMeta(), data);
  assert.ok(
    problems.some((problem) =>
      problem.includes('is not a word of the chapter source')
    )
  );
});

test('declaring an already auto-critical term is rejected as redundant', () => {
  const data: DialogueFile = {
    chapterId: 'demo',
    sourceHash: 'x'.repeat(64),
    declaredCriticalTerms: [
      { term: 'AKJSs89sal', reason: 'already classified by pattern' },
    ],
    turns: [
      {
        id: 't1',
        speaker: 'alex',
        text: 'Prepend AKJSs89sal to the fifth poem.',
        anchor: { kind: 'heading', id: 'intro' },
      },
    ],
  };
  const problems = dialogueCoverageProblems('demo', literalMeta(), data);
  assert.ok(
    problems.some((problem) =>
      problem.includes('already an auto-classified critical term')
    )
  );
});

// The DialogueFile top-level keys are a closed set (single source of truth:
// the type in dialogueTypes.ts). A typo like singular `describedLiteral`
// would otherwise read as "no literals declared" and silently pass.
const KNOWN_DIALOGUE_KEYS = new Set([
  'chapterId',
  'sourceHash',
  'turns',
  'describedLiterals',
  'declaredCriticalTerms',
]);

const unknownDialogueKeys = (data: Record<string, unknown>): string[] =>
  Object.keys(data).filter((key) => !KNOWN_DIALOGUE_KEYS.has(key));

test('an unknown top-level dialogue key is rejected, not silently ignored', () => {
  assert.deepEqual(unknownDialogueKeys({ describedLiteral: [] }), [
    'describedLiteral',
  ]);
  assert.deepEqual(
    unknownDialogueKeys({ chapterId: 'demo', sourceHash: 'x', turns: [] }),
    []
  );
});

test('every committed dialogue file uses only known top-level keys', () => {
  const dir = new URL('../../audio/dialogue/', import.meta.url);
  const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
  assert.ok(files.length > 0);
  for (const name of files) {
    const data = JSON.parse(readFileSync(new URL(name, dir), 'utf8'));
    assert.deepEqual(unknownDialogueKeys(data), [], `${name} has an unknown top-level key`);
  }
});
