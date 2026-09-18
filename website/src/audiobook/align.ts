/**
 * Pure alignment primitives shared by WER scoring and turn-boundary mapping.
 *
 * Both need the same Levenshtein DP over token arrays — WER needs the distance,
 * turn mapping needs the per-token correspondence — so they share one DP here
 * instead of each rolling their own.
 */

/** One word timestamp from the transcribe call: offsets are `"0.200s"`/`"1s"`. */
export type AsrWord = { word: string; startOffset: string; endOffset: string };

/** `"0.200s"`→200, `"1s"`→1000. Throws on anything that is not `<number>s`. */
export function parseOffsetToMs(offset: string): number {
  if (!offset.endsWith('s')) throw new Error(`bad ASR offset "${offset}"`);
  const seconds = parseFloat(offset.slice(0, -1));
  if (!Number.isFinite(seconds)) throw new Error(`bad ASR offset "${offset}"`);
  return Math.round(seconds * 1000);
}

const buildTable = (ref: string[], hyp: string[]): number[][] => {
  const table: number[][] = Array.from({ length: ref.length + 1 }, (_, i) => [
    i,
    ...Array<number>(hyp.length).fill(0),
  ]);
  for (let j = 1; j <= hyp.length; j++) table[0]![j] = j;
  ref.forEach((refWord, i) => {
    hyp.forEach((hypWord, j) => {
      const cost = refWord === hypWord ? 0 : 1;
      table[i + 1]![j + 1] = Math.min(
        table[i]![j]! + cost,
        table[i]![j + 1]! + 1,
        table[i + 1]![j]! + 1
      );
    });
  });
  return table;
};

/** Walk the table back to (0,0); diagonal wins ties, then deletion, then insertion. */
const backtrace = (
  table: number[][],
  ref: string[],
  hyp: string[]
): number[] => {
  const map: number[] = new Array(ref.length).fill(-1);
  let i = ref.length;
  let j = hyp.length;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      table[i]![j] ===
        table[i - 1]![j - 1]! + (ref[i - 1] === hyp[j - 1] ? 0 : 1)
    ) {
      map[i - 1] = j - 1;
      i--;
      j--;
    } else if (i > 0 && table[i]![j] === table[i - 1]![j]! + 1) {
      i--; // ref token deleted (not heard): stays -1
    } else {
      j--; // hyp token inserted (extra word heard)
    }
  }
  return map;
};

/**
 * Levenshtein over token arrays plus the alignment. `refToHyp[i]` is the hyp
 * index the i-th ref token aligned to, or -1 when the ref token was deleted.
 */
export function alignTokens(
  ref: string[],
  hyp: string[]
): { distance: number; refToHyp: number[] } {
  const table = buildTable(ref, hyp);
  return {
    distance: table[ref.length]![hyp.length]!,
    refToHyp: backtrace(table, ref, hyp),
  };
}
