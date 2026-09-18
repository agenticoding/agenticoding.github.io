import { existsSync, readFileSync } from 'node:fs';
import { alignTokens, parseOffsetToMs, type AsrWord } from './align.ts';
import { AUDIO_CONFIG, type SpeakerRole } from './config.ts';
import { chapterMeta, type ChapterMeta } from './docs.ts';
import type { Block } from './extract.ts';
import { contentDice, redundancyHits } from './redundancy.ts';
import type { Anchor, NarrationScript, Segment } from './schemas.ts';
import { sha256, toCanonicalJson } from './serialize.ts';
import { missingCriticalTerms, normalizeForWer } from './wer.ts';

/** One authored turn: who speaks, what they say, and where it highlights. */
export type DialogueTurn = {
  id: string;
  speaker: SpeakerRole;
  text: string;
  anchor: Anchor;
  label?: string;
};

/** Committed, diffable dialogue script. Audio lags it; `sourceHash` detects drift. */
export type DialogueFile = {
  chapterId: string;
  sourceHash: string;
  turns: DialogueTurn[];
};

export const dialogueFile = (id: string): URL =>
  new URL(`../../audio/dialogue/${id}.json`, import.meta.url);

export const loadDialogueFile = (id: string): DialogueFile | null => {
  const file = dialogueFile(id);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as DialogueFile;
  } catch (error) {
    // A raw SyntaxError names no file; the operator would be debugging a mystery.
    throw new Error(
      `${file.pathname}: malformed dialogue JSON — ${error.message}`
    );
  }
};

/** Routing predicate: a committed dialogue script selects the two-speaker path. */
export const isDialogueChapter = (id: string): boolean =>
  existsSync(dialogueFile(id));

export function validateDialogue(id: string, data: DialogueFile): string[] {
  const problems: string[] = [];
  const roles = new Set<string>(Object.keys(AUDIO_CONFIG.speakers));
  if (data.chapterId !== id)
    problems.push(`chapterId "${data.chapterId}" does not match "${id}"`);
  if (!data.turns.length) problems.push('no turns');
  data.turns.forEach((turn, index) => {
    const where = `${id}#${turn.id ?? index + 1}`;
    if (turn.id !== `t${index + 1}`)
      problems.push(`${where}: id must be sequential (t1..tn)`);
    if (!turn.text?.trim()) problems.push(`${where}: empty text`);
    if (!roles.has(turn.speaker))
      problems.push(`${where}: unknown speaker "${turn.speaker}"`);
  });
  return problems;
}

/** Prose blocks grouped by the heading they sit under (null = before any heading). */
function proseGroups(meta: ChapterMeta): Map<string | null, Block[]> {
  const groups = new Map<string | null, Block[]>();
  for (const block of meta.blocks) {
    if (block.kind !== 'prose' || block.anchor.kind !== 'heading') continue;
    groups.set(block.anchor.id, [
      ...(groups.get(block.anchor.id) ?? []),
      block,
    ]);
  }
  return groups;
}

const sectionTitle = (meta: ChapterMeta, anchorId: string | null): string =>
  meta.headings.find((heading) => heading.id === anchorId)?.title ??
  String(anchorId);

const headingTurnIds = (data: DialogueFile): Set<string | null> =>
  new Set(
    data.turns.flatMap((turn) =>
      turn.anchor.kind === 'heading' ? [turn.anchor.id] : []
    )
  );

const headingTurnChars = (
  anchorId: string | null,
  data: DialogueFile
): number =>
  data.turns
    .filter(
      (turn) => turn.anchor.kind === 'heading' && turn.anchor.id === anchorId
    )
    .reduce((sum, turn) => sum + turn.text.length, 0);

const blockFigureIndexes = (meta: ChapterMeta): number[] =>
  meta.blocks.flatMap((block) =>
    block.kind === 'figure' && block.anchor.kind === 'figure'
      ? [block.anchor.index]
      : []
  );

const blockCodeIndexes = (meta: ChapterMeta): number[] =>
  meta.blocks.flatMap((block) =>
    block.kind === 'code' && block.anchor.kind === 'code'
      ? [block.anchor.index]
      : []
  );

const turnFigureIndexes = (data: DialogueFile): number[] =>
  data.turns.flatMap((turn) =>
    turn.anchor.kind === 'figure' ? [turn.anchor.index] : []
  );

const turnCodeIndexes = (data: DialogueFile): number[] =>
  data.turns.flatMap((turn) =>
    turn.anchor.kind === 'code' ? [turn.anchor.index] : []
  );

function uncovered(
  source: number[],
  covered: number[],
  report: (index: number) => string
): string[] {
  const seen = new Set(covered);
  return source.filter((index) => !seen.has(index)).map(report);
}

function coverageProblems(
  id: string,
  meta: ChapterMeta,
  data: DialogueFile
): string[] {
  const covered = headingTurnIds(data);
  const prose = [...proseGroups(meta)]
    .filter(([anchorId]) => !covered.has(anchorId))
    .map(
      ([anchorId, blocks]) =>
        `${id}: source section "${sectionTitle(meta, anchorId)}" (${blocks.length} prose block(s)) has no covering turn`
    );
  return [
    ...prose,
    ...uncovered(
      blockFigureIndexes(meta),
      turnFigureIndexes(data),
      (index) => `${id}: source figure ${index} has no covering turn`
    ),
    ...uncovered(
      blockCodeIndexes(meta),
      turnCodeIndexes(data),
      (index) => `${id}: source code block ${index} has no covering turn`
    ),
  ];
}

function termProblems(
  id: string,
  meta: ChapterMeta,
  data: DialogueFile
): string[] {
  const source = meta.blocks.map((block) => block.text).join(' ');
  const spoken = data.turns.map((turn) => turn.text).join(' ');
  return missingCriticalTerms(source, spoken).map(
    (term) => `${id}: critical term "${term}" missing from dialogue turns`
  );
}

/** Hard coverage: every source section, figure and code block must be spoken, and
    every critical term must survive. This is what catches authored invention. */
export const dialogueCoverageProblems = (
  id: string,
  meta: ChapterMeta,
  data: DialogueFile
): string[] => [
  ...coverageProblems(id, meta, data),
  ...termProblems(id, meta, data),
];

/** Non-fatal: a section whose turns balloon far past its source text reads as invented. */
export function dialogueBloatWarnings(
  meta: ChapterMeta,
  data: DialogueFile
): string[] {
  return [...proseGroups(meta)].flatMap(([anchorId, blocks]) => {
    const sourceChars = Math.max(
      1,
      blocks.reduce((sum, block) => sum + block.text.length, 0)
    );
    const spokenChars = headingTurnChars(anchorId, data);
    const cap = Math.max(1200, 3 * sourceChars);
    return spokenChars > cap
      ? [
          `section "${sectionTitle(meta, anchorId)}": ${spokenChars} spoken chars vs ${sourceChars} source chars (cap ${cap})`,
        ]
      : [];
  });
}

/**
 * Turns that repeat each other's content: the chapter says the same fact twice.
 * Chapter-global and content-based, so a near or far paraphrase-free echo is caught
 * alike. Paraphrase is the intended `sam` restatement, not a repeat. Fatal, because
 * no edit to the audio can fix it.
 */
export function dialogueRedundancyProblems(
  id: string,
  data: DialogueFile
): string[] {
  return redundancyHits(data.turns, AUDIO_CONFIG.redundancy).map(
    (hit) =>
      `${id}: ${hit.a} and ${hit.b} (${hit.distance} turn(s) apart) repeat a ${hit.runChars}-char content run: "${hit.run}"`
  );
}

/**
 * Generation-time hint: a figure or code narration that restates the prose beside
 * it makes the audio say the same thing twice. Non-fatal — the fix is editorial.
 */
export function narrationOverlapWarnings(meta: ChapterMeta): string[] {
  return meta.blocks.flatMap((block, index) =>
    block.kind === 'prose'
      ? []
      : adjacentProse(meta.blocks, index).flatMap((prose) =>
          echoWarning(block, prose)
        )
  );
}

/** The nearest prose block before and after `index`, skipping the blocks between. */
const adjacentProse = (blocks: Block[], index: number): Block[] =>
  [nearestProse(blocks, index, -1), nearestProse(blocks, index, 1)].filter(
    (block): block is Block => block !== undefined
  );

function nearestProse(
  blocks: Block[],
  index: number,
  step: 1 | -1
): Block | undefined {
  for (let at = index + step; at >= 0 && at < blocks.length; at += step) {
    if (blocks[at]!.kind === 'prose') return blocks[at];
  }
  return undefined;
}

/** A figure/code narration whose content words are largely the adjacent prose's. */
function echoWarning(narration: Block, prose: Block): string[] {
  const dice = contentDice(narration.text, prose.text);
  if (dice < AUDIO_CONFIG.redundancy.narrationOverlapDiceMin) return [];
  const kind = narration.kind === 'figure' ? 'figure' : 'code block';
  const index =
    narration.anchor.kind === 'heading'
      ? narration.anchor.id
      : narration.anchor.index;
  return [
    `${kind} ${index} restates the prose beside it (content Dice ${dice.toFixed(2)}); voice the consequence, not the definition`,
  ];
}

/** Single source of truth for the TTS speaker labels: the historic host names. */
export const roleLabel = (role: SpeakerRole): string =>
  role === 'alex' ? 'Alex' : 'Sam';

/**
 * The exact text prompt one render request sends. Lives beside `roleLabel` — not
 * in the render stage — because the chunk cache key hashes it (see hash.ts): the
 * prompt, its template line and the labels ARE the contract, so editing any of
 * them must re-render instead of serving a stale take.
 */
export function dialogueTranscript(
  turns: ReadonlyArray<{ speaker: SpeakerRole; text: string }>
): string {
  return [
    `TTS the following conversation between ${roleLabel('alex')} and ${roleLabel('sam')}.`,
    '',
    turns
      .map((turn) => `${roleLabel(turn.speaker)}: ${turn.text}`)
      .join('\n\n'),
  ].join('\n');
}

/** The synthesised chapter-title turn; authored turns map one-to-one after it. */
const titleSegment = (title: string): Segment => ({
  id: 't0',
  kind: 'title',
  text: title,
  anchor: { kind: 'heading', id: null },
  speaker: 'alex',
  label: title,
});

const turnSegments = (data: DialogueFile): Segment[] =>
  data.turns.map((turn, index) => ({
    id: turn.id ?? `t${index + 1}`,
    kind: 'turn',
    text: turn.text,
    anchor: turn.anchor,
    label: turn.label,
    speaker: turn.speaker,
  }));

/**
 * Turns → the `NarrationScript` shape the render/verify/encode stages consume,
 * prefixed with the spoken chapter title. Every chapter opens by saying its exact
 * title (historic podcast format), so the title turn is synthesised here, not
 * authored in the script. Each turn becomes one `turn` segment, so marks,
 * sections, verification and encoding all reuse the existing stages unchanged.
 */
function toScript(
  id: string,
  data: DialogueFile,
  meta: ChapterMeta
): NarrationScript {
  const segments = [titleSegment(meta.title), ...turnSegments(data)];
  return {
    chapterId: id,
    title: meta.title,
    sourceHash: meta.sourceHash,
    contentHash: sha256(toCanonicalJson(segments)),
    headings: meta.headings,
    segments,
  };
}

const DRIFT_PREFIX = 'stale dialogue';

/** Drift is expected (audio lags the authored text): it warns everywhere and never blocks a render. */
export const isDriftViolation = (violation: string): boolean =>
  violation.startsWith(DRIFT_PREFIX);

/** Everything else makes the chapter unfaithful: `lint` fails, and no render or verify starts. */
export const hardViolations = (violations: string[]): string[] =>
  violations.filter((violation) => !isDriftViolation(violation));

/**
 * Load one dialogue chapter. `violations` merges everything that can make the
 * chapter unfaithful — extraction violations, structural/coverage problems, and
 * the drift warning — so no caller can accidentally drop one of them. Drift
 * compares the hash recorded at authoring time against the content on disk now:
 * a mismatch means the book moved on while the dialogue script did not.
 */
export function loadDialogue(
  id: string
): { script: NarrationScript; violations: string[] } | null {
  const data = loadDialogueFile(id);
  if (!data) return null;
  const meta = chapterMeta(id);
  const violations = [
    ...meta.violations,
    ...validateDialogue(id, data),
    ...dialogueCoverageProblems(id, meta, data),
    ...dialogueRedundancyProblems(id, data),
  ];
  if (data.sourceHash !== meta.sourceHash) {
    violations.push(
      `${DRIFT_PREFIX}: chapter content changed since authoring (authored ${data.sourceHash.slice(0, 8)}, now ${meta.sourceHash.slice(0, 8)})`
    );
  }
  return { script: toScript(id, data, meta), violations };
}

/**
 * Map each turn to its start time from ASR word timestamps. Ref tokens (turn
 * texts) and hyp tokens (ASR words) share `normalizeForWer` so the alignment
 * sees the same token stream WER scoring sees; each turn start maps to its
 * aligned word's start, or the nearest heard neighbour when the token itself
 * was deleted. Output is monotonic non-decreasing; all zeros when no words.
 */
export function turnStartMs(turnTexts: string[], words: AsrWord[]): number[] {
  const zeros = turnTexts.map(() => 0);
  if (!turnTexts.length) return zeros;
  const { refTokens, turnStarts } = tokenizeTurns(turnTexts);
  const hypStartMs = hypStartTimes(words);
  if (!hypStartMs.length) return zeros;
  const { refToHyp } = alignTokens(
    refTokens,
    hypStartMs.map((entry) => entry.token)
  );
  const starts = turnTexts.map((_, turn) =>
    startForToken(turnStarts[turn]!, refToHyp, hypStartMs)
  );
  return enforceMonotonic(starts);
}

/** Turn texts → one token stream plus the ref index where each turn starts. */
function tokenizeTurns(turnTexts: string[]): {
  refTokens: string[];
  turnStarts: number[];
} {
  const refTokens: string[] = [];
  const turnStarts = turnTexts.map((turn) => {
    const start = refTokens.length;
    refTokens.push(...wordsOfNormalized(turn));
    return start;
  });
  return { refTokens, turnStarts };
}

/** ASR words → one start time per normalized token (multi-token words share it). */
function hypStartTimes(
  words: AsrWord[]
): Array<{ token: string; startMs: number }> {
  return words.flatMap((word) => {
    const startMs = parseOffsetToMs(word.startOffset);
    return wordsOfNormalized(word.word).map((token) => ({ token, startMs }));
  });
}

const wordsOfNormalized = (text: string): string[] =>
  normalizeForWer(text).split(' ').filter(Boolean);

/** Aligned word start, else nearest heard neighbour (forward first), else 0. */
function startForToken(
  refIndex: number,
  refToHyp: number[],
  hypStartMs: Array<{ token: string; startMs: number }>
): number {
  const direct = refToHyp[refIndex];
  if (direct !== undefined && direct !== -1) return hypStartMs[direct]!.startMs;
  for (let i = refIndex + 1; i < refToHyp.length; i++) {
    if (refToHyp[i] !== -1) return hypStartMs[refToHyp[i]!]!.startMs;
  }
  for (let i = refIndex - 1; i >= 0; i--) {
    if (refToHyp[i] !== -1) return hypStartMs[refToHyp[i]!]!.startMs;
  }
  return 0;
}

/** Timestamps can only move forward; the first turn starts at or after 0. */
const enforceMonotonic = (starts: number[]): number[] => {
  let previous = 0;
  return starts.map((start) => {
    previous = Math.max(previous, Math.max(0, start));
    return previous;
  });
};

/**
 * Slice bounds for one chunk's PCM into per-turn parts: turn i owns
 * [bounds[i], bounds[i+1]]. The first bound is pinned to 0 — a chunk's leading
 * PCM carries the first word's onset, so starting at the first turn's ASR start
 * would silently clip that word. `turnStartsBytes` are chunk-relative offsets.
 */
export function turnSliceBounds(
  turnStartsBytes: number[],
  totalBytes: number
): number[] {
  return [0, ...turnStartsBytes.slice(1), totalBytes];
}

/**
 * Pack turns into render chunks under `maxChars`, never splitting a turn. A
 * single turn longer than the cap becomes its own chunk, so an over-long turn
 * fails loudly at the API instead of being silently mangled here.
 */
export function chunkTurns(turns: Segment[], maxChars: number): Segment[][] {
  const chunks: Segment[][] = [];
  let current: Segment[] = [];
  let size = 0;
  for (const turn of turns) {
    if (current.length && size + turn.text.length > maxChars) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(turn);
    size += turn.text.length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}
