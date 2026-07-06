export type TokenTrainTiming = {
  startDelayMs?: number;
  cycleMs: number;
  travelMs: number;
  fadeMs: number;
  repeat?: 'loop' | 'once';
};

export type TokenTrainStagger =
  | { mode: 'pathSpacing'; spacingPx: number }
  | { mode: 'fixedStep'; stepMs: number };

export function tokenTrainBeginOffsetMs(
  index: number,
  length: number,
  stagger: TokenTrainStagger,
  travelMs: number
) {
  if (stagger.mode === 'fixedStep') return index * stagger.stepMs;
  return Math.round((index * stagger.spacingPx * travelMs) / length);
}

export function tokenTrainStaticDistance(
  index: number,
  length: number,
  stagger: TokenTrainStagger,
  travelMs: number
) {
  if (stagger.mode === 'fixedStep')
    return (index * stagger.stepMs * length) / travelMs;
  return index * stagger.spacingPx;
}

export function tokenTrainOpacityKeyTimes(timing: TokenTrainTiming) {
  const travelEnd = timing.travelMs / timing.cycleMs;
  return [
    0,
    Math.min(0.04, travelEnd / 2),
    travelEnd,
    Math.min(1, (timing.travelMs + timing.fadeMs) / timing.cycleMs),
    1,
  ];
}
