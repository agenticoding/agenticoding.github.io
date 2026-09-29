import { normalizeForWer } from './wer.ts';

/** A run of content words two turns share: the chapter would say the same fact twice. */
export type RedundancyHit = {
  a: string;
  b: string;
  runChars: number;
  run: string;
  distance: number;
};

/**
 * Function words every turn shares; they carry no fact, so they never count as overlap.
 * Kept deliberately narrow to closed-class words: pronouns, auxiliaries/modals, determiners,
 * prepositions and conjunctions. Content-bearing adverbs and subordinators (`any`, `every`,
 * `how`, `now`, `because`) stay OUT — they carry meaning inside phrases ("any single run"),
 * and filtering them broke the phrase/trigram calibration the lexical gate depends on.
 */
const FUNCTION_WORDS = new Set(
  `a am an and are as at be been being but by can could did do does done for from had has have he her
   his him i if in into is it its may me might mine more most must my no nor not of on or our ours she
   shall should so than that the their theirs them then there these they this those to up us was we were
   what when where which while who why will with would you your yours`.split(/\s+/)
);

/** normalizeForWer removes apostrophes; restore common contraction stems before filtering. */
const FUNCTION_CONTRACTIONS = new Set(
  `aint arent cant couldnt didnt doesnt dont hadnt hasnt havent isnt mightnt mustnt shant shouldnt
   wasnt werent wont wouldnt youre youve youll youd hes shes its theyre theyve theyll theyd
   were weve well wed im ive ill id thats theres heres whos whats wheres whens whys
   hows whens wheres lets`.split(/\s+/)
);

/** Content tokens: the words that carry the fact, minus the function words above. */
export const contentTokens = (text: string): string[] =>
  normalizeForWer(text)
    .split(' ')
    .filter(
      (word) =>
        (word.length > 1 || /\d/.test(word)) &&
        !FUNCTION_WORDS.has(word) &&
        !FUNCTION_CONTRACTIONS.has(word)
    );

/** Sørensen–Dice overlap of two texts' content-word sets (length-tolerant, 0..1). */
export function contentDice(a: string, b: string): number {
  const left = new Set(contentTokens(a));
  const right = new Set(contentTokens(b));
  if (!left.size || !right.size) return 0;
  const shared = [...left].filter((word) => right.has(word)).length;
  return (2 * shared) / (left.size + right.size);
}

/** The stream a repeated run is measured on: content words, so shared function
 * words ("the current context", "everything after it") never count as repetition. */
const contentStream = (text: string): string => contentTokens(text).join(' ');

/**
 * Longest common substring of two turns' content words. A repeated run of content
 * words — not a shared topic — is what makes the listener hear the same fact twice.
 */
export function longestContentRun(a: string, b: string): string {
  const left = contentStream(a);
  const right = contentStream(b);
  let previous = new Array<number>(right.length + 1).fill(0);
  let best = { length: 0, end: 0 };
  for (let i = 1; i <= left.length; i += 1) {
    const current = new Array<number>(right.length + 1).fill(0);
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = left[i - 1] === right[j - 1] ? previous[j - 1] + 1 : 0;
      if (current[j] > best.length) best = { length: current[j], end: i };
    }
    previous = current;
  }
  return left.slice(best.end - best.length, best.end);
}

/** Content trigrams: the smallest phrase that carries a fact's wording. */
const contentTrigrams = (text: string): Set<string> => {
  const words = contentTokens(text);
  const grams = new Set<string>();
  for (let i = 0; i + 3 <= words.length; i += 1)
    grams.add(words.slice(i, i + 3).join(' '));
  return grams;
};

/**
 * Whether two turns reuse a ≥3-word content phrase — a real wording repeat, not the
 * scattered jargon every same-topic turn shares. This is the phrase the sanctioned
 * `sam` restatement keeps (`any single run`), and it is what separates a paraphrase
 * from a vocabulary echo at the same cosine score.
 */
export function sharesContentTrigram(a: string, b: string): boolean {
  const right = contentTrigrams(b);
  for (const gram of contentTrigrams(a)) if (right.has(gram)) return true;
  return false;
}

/**
 * Every pair of turns in the chapter that shares a `runCharsMin`-char content run,
 * loudest repeat first. Chapter-global: a repeat is a defect wherever it sits, so a
 * closing recap must paraphrase too. Pairs with no shared content word are skipped
 * (they cannot repeat anything), which keeps the all-pairs scan cheap.
 */
export function redundancyHits(
  turns: ReadonlyArray<{ id: string; text: string }>,
  { runCharsMin }: { runCharsMin: number }
): RedundancyHit[] {
  const content = turns.map((turn) => new Set(contentTokens(turn.text)));
  const hits: RedundancyHit[] = [];
  turns.forEach((turn, index) => {
    for (let other = index + 1; other < turns.length; other += 1) {
      if (![...content[index]!].some((word) => content[other]!.has(word)))
        continue;
      const run = longestContentRun(turn.text, turns[other]!.text);
      if (run.length < runCharsMin) continue;
      hits.push({
        a: turn.id,
        b: turns[other]!.id,
        runChars: run.length,
        run,
        distance: other - index,
      });
    }
  });
  return hits.sort((left, right) => right.runChars - left.runChars);
}
