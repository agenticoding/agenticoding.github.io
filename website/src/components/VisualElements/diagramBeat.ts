// The book's arrival beat: one brief scale nudge and its echo, once per loop.
// A figure supplies only its own cycle and start offset; the shape lives here so
// every "this element is being touched" pulse in the book reads the same.

/** Beat shape. `windowMs` is an ABSOLUTE duration (not a fraction of the cycle),
 * so the pulse stays 900ms whether a figure loops in 7.4s or 11s — the nudge is
 * the same weight everywhere. `peakAt`/`settleAt` are fractions of that window;
 * `peakScale` is the nudge and `settleScale` its echo. */
export const ARRIVAL_BEAT = {
  windowMs: 900,
  peakAt: 0.25,
  settleAt: 0.56,
  peakScale: 1.07,
  settleScale: 1.015,
} as const;

/** The beat's keyframes for a caller's own cycle. A keyframe cannot live in a
 * stylesheet: an absolute window only becomes percentages once the cycle is known
 * (see the CSS class `.arrivalBeat` in diagram.module.css for the shared timing). */
export function arrivalBeatKeyframes(name: string, cycleMs: number): string {
  const at = (ms: number) => `${((ms / cycleMs) * 100).toFixed(2)}%`;
  const scale = (value: number) => `transform: scale(${value})`;
  const window = ARRIVAL_BEAT.windowMs;
  return [
    `@keyframes ${name} {`,
    `0% { ${scale(1)}; }`,
    `${at(window * ARRIVAL_BEAT.peakAt)} { ${scale(ARRIVAL_BEAT.peakScale)}; }`,
    `${at(window * ARRIVAL_BEAT.settleAt)} { ${scale(
      ARRIVAL_BEAT.settleScale
    )}; }`,
    `${at(window)}, 100% { ${scale(1)}; }`,
    `}`,
  ].join('\n');
}
