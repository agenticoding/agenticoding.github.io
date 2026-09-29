import { contentTokens, sharesContentTrigram } from './redundancy.ts';

/**
 * IDF-cosine lexical-overlap metric: bag-of-words overlap with inverse-document-
 * frequency weighting and cosine normalisation — the vocabulary echo the verbatim
 * run gate (`redundancy.ts`) cannot see, because there is no contiguous run to match.
 * It measures LEXICAL overlap, not meaning: a genuine paraphrase in different words
 * scores low and passes, while the same fact in largely the same words scores high.
 * `tf·idf` weighting (not binary presence) is what reproduces the calibrated defect
 * band. Pure: the only tokenizer is `contentTokens` (SSOT in `redundancy.ts`), and
 * the corpus is rebuilt live every run, never persisted.
 */

/** Whole-book document frequencies: live per-run IDF. */
export type Corpus = {
  df: Map<string, number>;
  documents: number;
};

const termCounts = (text: string): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const term of contentTokens(text))
    counts.set(term, (counts.get(term) ?? 0) + 1);
  return counts;
};

/** One document = one turn/block text; every text counts, even near-empty ones. */
export function buildCorpus(documentTexts: readonly string[]): Corpus {
  const df = new Map<string, number>();
  for (const text of documentTexts)
    for (const [term] of termCounts(text))
      df.set(term, (df.get(term) ?? 0) + 1);
  return { df, documents: documentTexts.length };
}

/** Rare facts (provenance, HNSW) weigh more than the jargon every turn shares. */
const idf = (term: string, corpus: Corpus): number =>
  Math.log(
    1 +
      (corpus.documents - (corpus.df.get(term) ?? 0) + 0.5) /
        ((corpus.df.get(term) ?? 0) + 0.5)
  );

/** A text as its `term → tf·idf` weight vector. */
const weighted = (text: string, corpus: Corpus): Map<string, number> => {
  const weights = new Map<string, number>();
  for (const [term, count] of termCounts(text))
    weights.set(term, idf(term, corpus) * count);
  return weights;
};

/** IDF cosine of two texts, 0..1 — 1 when they use the same content in the same measure. */
export function idfCosine(
  aText: string,
  bText: string,
  corpus: Corpus
): number {
  const left = weighted(aText, corpus);
  const right = weighted(bText, corpus);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (const [term, weight] of left) {
    leftNorm += weight * weight;
    dot += weight * (right.get(term) ?? 0);
  }
  for (const weight of right.values()) rightNorm += weight * weight;
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}

/** Content terms both texts share, rarest first — the vocabulary the echo reuses. */
export function sharedContentTerms(
  aText: string,
  bText: string,
  corpus: Corpus
): string[] {
  const right = new Set(contentTokens(bText));
  return [...new Set(contentTokens(aText))]
    .filter((term) => right.has(term))
    .sort((left, rightTerm) => idf(rightTerm, corpus) - idf(left, corpus));
}

/** One echo: the symmetric score catches one-sided recaps as well as mutual repeats. */
export type LexicalHit = {
  a: string;
  b: string;
  distance: number;
  score: number;
  shared: string[];
  /** Whether the pair reuses a ≥3-word content phrase — a wording repeat, not scattered jargon. */
  phrase: boolean;
};

/** Scores are rounded before any threshold compare, so float drift never flips a gate. */
const round4 = (value: number): number => Math.round(value * 10000) / 10000;

/**
 * Every pair of turns that each carry enough content to state a fact, loudest
 * echo first. Short turns ("Exactly.") are skipped: they cannot repeat a fact.
 */
export function lexicalRedundancyHits(
  turns: ReadonlyArray<{ id: string; text: string }>,
  corpus: Corpus,
  opts: { minTokens: number }
): LexicalHit[] {
  const hits: LexicalHit[] = [];
  turns.forEach((turn, index) => {
    if (contentTokens(turn.text).length < opts.minTokens) return;
    for (let other = index + 1; other < turns.length; other += 1) {
      const that = turns[other]!;
      if (contentTokens(that.text).length < opts.minTokens) continue;
      hits.push({
        a: turn.id,
        b: that.id,
        distance: other - index,
        score: round4(idfCosine(turn.text, that.text, corpus)),
        shared: sharedContentTerms(turn.text, that.text, corpus),
        phrase: sharesContentTrigram(turn.text, that.text),
      });
    }
  });
  return hits.sort((left, right) => right.score - left.score);
}
