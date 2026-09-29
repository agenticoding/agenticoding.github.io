import { AUDIO_CONFIG, type SpeakerRole } from './config.ts';
import type { ChapterMeta } from './docs.ts';
import type { Block } from './extract.ts';
import {
  lexicalRedundancyHits,
  type Corpus,
  type LexicalHit,
} from './lexical.ts';
import { redundancyHits } from './redundancy.ts';
import { wholeBookCorpus } from './dialogueCorpus.ts';
import { sectionTitle } from './dialogueCoverage.ts';
import type { DialogueFile } from './dialogueTypes.ts';

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
 * Turns that echo each other in the same words: the lexical shadow of the
 * verbatim run gate, which only sees contiguous runs. **Advisory** — the bag-of-words
 * IDF cosine cannot separate a benign same-topic overlap from a genuine recap on the
 * real corpus: measured false positives (0.29–0.31) outscore the user-blessed golden
 * paraphrase (0.20) and approach the true defect (0.52), so no threshold splits them.
 * The fatal repeat guard remains the verbatim run gate (`dialogueRedundancyProblems`).
 * Paraphrase in different words scores low and passes: that restatement is the
 * format, not a defect. `corpus` defaults to the live whole-book IDF.
 *
 * A pair fires when same-speaker turns reach `cosineMin` — different speakers reusing
 * a content phrase is `sam` paraphrasing `alex`, the format itself. Alex repeating
 * himself keeps firing. Fired pairs are grouped into fact clusters so the author fixes
 * a fact once, not N pairs.
 */
export function dialogueLexicalRedundancyProblems(
  id: string,
  data: DialogueFile,
  corpus: Corpus = wholeBookCorpus()
): string[] {
  const hits = dialogueLexicalHits(id, data, corpus);
  return redundancyProblems(
    id,
    gatedRepeats(hits, data),
    turnIds(data),
    (turn) => turn
  );
}

/** The pairs loud enough to gate: same-speaker only, in score order. */
function gatedRepeats(
  hits: LexicalHit[],
  data: DialogueFile
): LexicalHit[] {
  const speakers = speakerByTurn(data);
  return hits.filter((hit) => gatedRepeat(hit, speakers));
}

/** Fatal lines for a fired set: loud repeats as fact clusters, soft ones as pairs. */
function redundancyProblems(
  id: string,
  hits: LexicalHit[],
  ids: string[],
  labelOf: (id: string) => string
): string[] {
  const clusters = clusterRepeats(hits, ids);
  const clustered = new Set(
    clusters.flatMap((cluster) => cluster.map((hit) => pairKey(hit.a, hit.b)))
  );
  return [
    ...clusters.map((cluster) => clusterProblem(id, cluster, labelOf)),
    ...hits
      .filter((hit) => !clustered.has(pairKey(hit.a, hit.b)))
      .map((hit) => pairProblem(id, hit, labelOf)),
  ];
}

/** Ranked echo list for reporting (`audio:dialogue:source` prints the top few). */
export function dialogueLexicalHits(
  id: string,
  data: DialogueFile,
  corpus: Corpus = wholeBookCorpus()
): LexicalHit[] {
  const { minTokens } = AUDIO_CONFIG.redundancy.lexical;
  return lexicalRedundancyHits(data.turns, corpus, { minTokens });
}

/**
 * Source-level redundancy: the same fact repeated across the chapter's own prose and
 * figure/code narrations. Advisory only: prose can repeat across authored blocks
 * without producing a repeated spoken dialogue. Fix the SOURCE first; the
 * dialogue gate then follows. Captions are page text, never spoken, so they are not
 * gated here (`narrationOverlapWarnings` keeps the caption echo as a hint).
 */
export function docRedundancyProblems(
  id: string,
  meta: ChapterMeta,
  corpus: Corpus = wholeBookCorpus()
): string[] {
  const items = docItems(meta);
  const hits = lexicalRedundancyHits(items, corpus, {
    minTokens: AUDIO_CONFIG.redundancy.lexical.minTokens,
  }).filter((hit) => hit.score >= AUDIO_CONFIG.redundancy.lexical.cosineMin);
  const label = (blockId: string): string =>
    items.find((item) => item.id === blockId)?.label ?? blockId;
  return redundancyProblems(
    id,
    hits,
    items.map((item) => item.id),
    label
  );
}

const docItems = (
  meta: ChapterMeta
): Array<{ id: string; text: string; label: string }> =>
  meta.blocks.map((block, index) => ({
    id: `b${index}`,
    text: block.text,
    label: blockLabel(meta, block, index),
  }));

/** A doc block's stable label for a redundancy message: the surface it speaks from. */
function blockLabel(meta: ChapterMeta, block: Block, index: number): string {
  if (block.kind === 'prose')
    return `prose #${index} "${sectionTitle(meta, block.anchor.kind === 'heading' ? block.anchor.id : null)}"`;
  const figureIndex =
    block.anchor.kind === 'figure' || block.anchor.kind === 'code'
      ? block.anchor.index
      : '?';
  return `${block.kind} ${figureIndex} narration`;
}

/** The pair's two turn ids, order-insensitive, so a declared recap matches either way. */
const pairKey = (a: string, b: string): string => [a, b].sort().join('|');

const speakerByTurn = (data: DialogueFile): Map<string, SpeakerRole> =>
  new Map(data.turns.map((turn) => [turn.id, turn.speaker]));

const turnIds = (data: DialogueFile): string[] =>
  data.turns.map((turn) => turn.id);

/**
 * A gated repeat: loud enough lexical overlap between turns from the same speaker.
 * Cross-speaker reuse is the format; verbatim-run checks still catch copied wording.
 */
const gatedRepeat = (
  hit: LexicalHit,
  speakers: Map<string, SpeakerRole>
): boolean =>
  hit.score >= AUDIO_CONFIG.redundancy.lexical.cosineMin &&
  speakers.get(hit.a) === speakers.get(hit.b);

/**
 * Group gated repeats into fact clusters via union-find over turn ids, so the author
 * fixes the fact once instead of N pairs. Only loud edges (≥ `defectBand`) union: a
 * softer same-topic edge stays its own cluster, or chained overlap merges distinct
 * facts into one blob (the reliability chapter's whole retrieval half).
 */
function clusterRepeats(hits: LexicalHit[], turnIds: string[]): LexicalHit[][] {
  const at = new Map(turnIds.map((turnId, index) => [turnId, index]));
  const root = Int32Array.from(turnIds, (_, index) => index);
  const find = (index: number): number =>
    root[index] === index ? index : (root[index] = find(root[index]!));
  const loud = hits.filter(
    (hit) => hit.score >= AUDIO_CONFIG.redundancy.lexical.defectBand
  );
  for (const hit of loud) root[find(at.get(hit.a)!)] = find(at.get(hit.b)!);
  const groups = new Map<number, LexicalHit[]>();
  for (const hit of loud) {
    const group = groups.get(find(at.get(hit.a)!));
    if (group) group.push(hit);
    else groups.set(find(at.get(hit.a)!), [hit]);
  }
  return [...groups.values()];
}

/** t2 before t10: turn ids sort by ordinal, never lexically. */
const byTurnOrdinal = (a: string, b: string): number =>
  Number(a.slice(1)) - Number(b.slice(1));

/** One cluster's fatal line: member surfaces, the loudest evidence, and the fact to fix. */
function clusterProblem(
  id: string,
  cluster: LexicalHit[],
  labelOf: (id: string) => string
): string {
  const loudest = cluster.reduce((top, hit) =>
    hit.score > top.score ? hit : top
  );
  const members = [
    ...new Set(
      cluster
        .flatMap((hit) => [hit.a, hit.b])
        .sort(byTurnOrdinal)
        .map(labelOf)
    ),
  ];
  return `${id}: ${members.join(', ')} repeat one fact across ${cluster.length} pair(s) (loudest ${labelOf(loudest.a)} and ${labelOf(loudest.b)} at ${Math.round(loudest.score * 100)}%: "${loudest.shared.slice(0, 6).join(', ')}") — consolidate the fact to one surface and give the rest a new claim`;
}

/** One soft repeated pair, below the clustering band. */
const pairProblem = (
  id: string,
  hit: LexicalHit,
  labelOf: (id: string) => string
): string =>
  `${id}: ${labelOf(hit.a)} and ${labelOf(hit.b)} (${hit.distance} apart) repeat ${Math.round(hit.score * 100)}% of each other's content: "${hit.shared.slice(0, 6).join(', ')}"`;
