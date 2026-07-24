import { trainArrivalMs, type TokenTrainTiming } from './TokenTrainTiming.ts';

export const VALIDATION_FLOW_CYCLE_MS = 6400;
export const VALIDATION_TRAIN_GAP_MS = 720;
export const VALIDATION_TRAIN_TRAVEL_MS = 520;

export type ValidationClaimBenchSchedule = {
  claimTiming: TokenTrainTiming;
  evidenceTimings: readonly TokenTrainTiming[];
  conditionArrivalMs: readonly number[];
  outcomeArrivalMs: number;
};

function timing(startDelayMs: number): TokenTrainTiming {
  return {
    startDelayMs,
    cycleMs: VALIDATION_FLOW_CYCLE_MS,
    travelMs: VALIDATION_TRAIN_TRAVEL_MS,
    fadeMs: 160,
    repeat: 'loop',
  };
}

export function validationClaimBenchSchedule(): ValidationClaimBenchSchedule {
  const claimTiming = timing(0);
  const evidenceTimings = Array.from({ length: 4 }, (_, index) =>
    timing((index + 1) * VALIDATION_TRAIN_GAP_MS)
  );
  const arrivals = [
    trainArrivalMs(claimTiming),
    ...evidenceTimings.map(trainArrivalMs),
  ];
  return {
    claimTiming,
    evidenceTimings,
    conditionArrivalMs: arrivals.slice(0, 4),
    outcomeArrivalMs: arrivals[4],
  };
}
