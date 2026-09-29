import { alignTokens, parseOffsetToMs, type AsrWord } from './align.ts';
import { AUDIO_CONFIG, type SpeakerRole } from './config.ts';
import { visualDeixisHits } from './deixis.ts';
import { chapterMeta, type ChapterMeta } from './docs.ts';
import { drawnLabelHits, drawnLabelProblem } from './drawnLabels.ts';
import type { Block } from './extract.ts';
import { contentDice } from './redundancy.ts';
import type { NarrationScript, Segment } from './schemas.ts';
import { sha256, toCanonicalJson } from './serialize.ts';
import { normalizeForWer } from './wer.ts';
import { dialogueCoverageProblems, validateDialogue } from './dialogueCoverage.ts';
import {
  dialogueLexicalRedundancyProblems,
  dialogueRedundancyProblems,
  docRedundancyProblems,
} from './dialogueLexical.ts';
import { loadDialogueFile, type DialogueFile } from './dialogueTypes.ts';

/**
 * Turns that point at an on-page visual: the listener has no page, so the reference
 * is meaningless. Fatal, because no edit to the audio or the reading page can fix it —
 * only re-voicing the idea the visual carries can. The vocabulary lives in
 * `AUDIO_CONFIG.deixis` and the narration sibling is enforced in `extract.ts`.
 */
export function dialogueDeixisProblems(
  id: string,
  data: DialogueFile
): string[] {
  return data.turns.flatMap((turn) =>
    visualDeixisHits(turn.text).map(
      (phrase) =>
        `${id}: ${turn.id} (${turn.speaker}) references "${phrase}": a listener cannot see the page — voice the idea it carries, not the visual`
    )
  );
}

/** The figure block one DOM index points at, if extraction produced one. */
const figureBlockAt = (
  blocks: Block[],
  index: number
): Extract<Block, { kind: 'figure' }> | undefined =>
  blocks.find(
    (block): block is Extract<Block, { kind: 'figure' }> =>
      block.kind === 'figure' &&
      block.anchor.kind === 'figure' &&
      block.anchor.index === index
  );

/**
 * Figure turns that read out the drawing: the authored voice must carry the idea, not
 * the labels painted on the page. Same contract and same declaration as the narration
 * sibling in `extract.ts`, so a paraphrase that survived extraction cannot reappear
 * here. Fatal — the audio cannot repair it, only re-voicing the beat can.
 */
export function dialogueDrawnLabelProblems(
  id: string,
  meta: ChapterMeta,
  data: DialogueFile
): string[] {
  return data.turns.flatMap((turn) => {
    if (turn.anchor.kind !== 'figure') return [];
    const figure = figureBlockAt(meta.blocks, turn.anchor.index);
    return drawnLabelHits(figure?.visual, turn.text).map(
      (label) =>
        `${id}: ${turn.id} (${turn.speaker}) ${drawnLabelProblem(label)}`
    );
  });
}

/**
 * Generation-time hint: a figure or code narration that restates text the listener is
 * already about to hear — the prose beside it, or the caption printed under the figure —
 * makes the audio say the same thing twice. Non-fatal: the fix is editorial, and a
 * caption echo is common (the caption is visible while the narration is spoken, so a
 * little overlap is harmless).
 */
export function narrationOverlapWarnings(meta: ChapterMeta): string[] {
  return meta.blocks.flatMap((block, index) => {
    if (block.kind === 'prose') return [];
    const echoes = adjacentProse(meta.blocks, index).flatMap((prose) =>
      overlapWarning(block, prose.text, 'the prose beside it')
    );
    return block.kind === 'figure' && block.caption
      ? [...echoes, ...overlapWarning(block, block.caption, 'its own caption')]
      : echoes;
  });
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

/** A narration whose content words are largely the text it sits next to, or draws. */
function overlapWarning(
  narration: Block,
  text: string,
  target: string
): string[] {
  const dice = contentDice(narration.text, text);
  if (dice < AUDIO_CONFIG.redundancy.narrationOverlapDiceMin) return [];
  const kind = narration.kind === 'figure' ? 'figure' : 'code block';
  const index =
    narration.anchor.kind === 'heading'
      ? narration.anchor.id
      : narration.anchor.index;
  return [
    `${kind} ${index} restates ${target} (content Dice ${dice.toFixed(2)}); voice the consequence, not the description`,
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
    requiredTerms: (data.declaredCriticalTerms ?? []).map(
      (entry) => entry.term
    ),
  };
}

const DRIFT_PREFIX = 'stale dialogue';

/** Drift is expected (audio lags the authored text): it warns in build/verify/list and never blocks a render. */
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
): { script: NarrationScript; violations: string[]; warnings: string[] } | null {
  const data = loadDialogueFile(id);
  if (!data) return null;
  const meta = chapterMeta(id);
  const violations = [
    ...meta.violations,
    ...validateDialogue(id, data),
    ...dialogueCoverageProblems(id, meta, data),
    ...dialogueDeixisProblems(id, data),
    ...dialogueDrawnLabelProblems(id, meta, data),
    ...dialogueRedundancyProblems(id, data),
  ];
  if (data.sourceHash !== meta.sourceHash) {
    violations.push(
      `${DRIFT_PREFIX}: chapter content changed since authoring (authored ${data.sourceHash.slice(0, 8)}, now ${meta.sourceHash.slice(0, 8)})`
    );
  }
  return {
    script: toScript(id, data, meta),
    violations,
    warnings: [
      ...docRedundancyProblems(id, meta),
      ...dialogueLexicalRedundancyProblems(id, data),
    ],
  };
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
