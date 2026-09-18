/**
 * Artifact math for the loudness and join gates.
 *
 * Pure, so CI runs it: these are the defect classes the WER and loudness gates are
 * structurally blind to. WER only scores words, and LUFS/peak/RMS are whole-chapter
 * aggregates, so a master that pumps and a splice that chops a word both pass every
 * existing gate. The checks here are exact comparisons rather than heuristics,
 * because a heuristic threshold on speech would flap on the first unusual chapter.
 */

const FULL_SCALE = 32768;

/**
 * Peak-safe master contract: every mastered sample must be the raw sample times one
 * scalar gain. Any deviation is a dynamic gain change inside the master — the pumping
 * that made the published chapters dip up to 3.6 dB on their loudest syllables, which
 * no loudness gate can see. `toleranceLsb` absorbs only the s16 round-trip of the gain.
 */
export function linearityProblems(
  raw: Int16Array,
  mastered: Int16Array,
  gain: number,
  toleranceLsb: number
): string[] {
  if (raw.length !== mastered.length) {
    return [
      `mastered length ${mastered.length} differs from the raw ${raw.length}`,
    ];
  }
  let worst = 0;
  for (let at = 0; at < raw.length; at += 1) {
    const drift = Math.abs(mastered[at]! - Math.round(gain * raw[at]!));
    if (drift > worst) worst = drift;
  }
  if (worst <= toleranceLsb) return [];
  return [
    `mastered is not a single linear gain (${gain.toFixed(4)}): worst sample is ${worst} LSB off (tolerance ${toleranceLsb})`,
  ];
}

/** RMS in dBFS over `[from, to)` samples; an empty window has no energy. */
function windowRmsDb(pcm: Int16Array, from: number, to: number): number {
  const start = Math.max(0, from);
  const end = Math.min(pcm.length, to);
  if (end <= start) return -Infinity;
  let sum = 0;
  for (let at = start; at < end; at += 1) sum += pcm[at]! * pcm[at]!;
  return 20 * Math.log10(Math.sqrt(sum / (end - start)) / FULL_SCALE + 1e-12);
}

const windowSamples = (sampleRate: number, ms: number): number =>
  Math.round((sampleRate * ms) / 1000);

const joinProblem = (
  pcm: Int16Array,
  sampleRate: number,
  join: number,
  maxRmsDb: number
): string | undefined => {
  const loudest = Math.max(
    windowRmsDb(pcm, join - windowSamples(sampleRate, 20), join),
    windowRmsDb(pcm, join, join + windowSamples(sampleRate, 20))
  );
  const at = (join / sampleRate).toFixed(3);
  return loudest <= maxRmsDb
    ? undefined
    : `join at ${at}s sits in ${loudest.toFixed(1)} dBFS of audio (max ${maxRmsDb})`;
};

const stepProblem = (
  pcm: Int16Array,
  sampleRate: number,
  join: number,
  maxStepLsb: number
): string | undefined => {
  const step = Math.abs((pcm[join] ?? 0) - (pcm[join - 1] ?? 0));
  const at = (join / sampleRate).toFixed(3);
  return step <= maxStepLsb
    ? undefined
    : `join at ${at}s steps ${step} LSB (max ${maxStepLsb})`;
};

/**
 * Chunks are independent takes spliced at turn boundaries, so a join is only safe where
 * both sides are silent. A join inside speech chops a word, and a step across it is a
 * click; the manifest's marks record where a join is, never whether it was safe.
 */
export function spliceProblems(
  pcm: Int16Array,
  sampleRate: number,
  joins: readonly number[],
  maxRmsDb: number,
  maxStepLsb: number
): string[] {
  return joins.flatMap((join) =>
    [
      joinProblem(pcm, sampleRate, join, maxRmsDb),
      stepProblem(pcm, sampleRate, join, maxStepLsb),
    ].filter((problem): problem is string => problem !== undefined)
  );
}
