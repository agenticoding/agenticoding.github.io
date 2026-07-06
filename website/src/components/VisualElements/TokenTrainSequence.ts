import type { TokenSequence } from './AnimatedTokenFlow';

const LCG_MODULUS = 2 ** 32;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

export const TOKEN_TRAIN_PALETTE = [
  { modality: 'text' },
  { modality: 'code' },
  { modality: 'image' },
  { modality: 'audio' },
  { modality: 'video' },
] as const satisfies TokenSequence;

function seedState(seed: string) {
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  return state || 1;
}

function nextState(state: number) {
  return (Math.imul(state, LCG_MULTIPLIER) + LCG_INCREMENT) >>> 0;
}

function shuffle<T>(items: readonly T[], seed: string) {
  const shuffled = [...items];
  let state = seedState(seed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = nextState(state);
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function sameToken(
  a: TokenSequence[number] | undefined,
  b: TokenSequence[number] | undefined
) {
  return !!a && !!b && a.modality === b.modality && a.signal === b.signal;
}

function appendWithoutAdjacentDuplicate(
  tokens: TokenSequence[number][],
  candidates: readonly TokenSequence[number][]
) {
  const nextIndex = candidates.findIndex(
    (candidate) => !sameToken(candidate, tokens[tokens.length - 1])
  );
  tokens.push(candidates[nextIndex < 0 ? 0 : nextIndex]);
}

export function seededTokenTrain(
  seed: string,
  count: number,
  palette: TokenSequence = TOKEN_TRAIN_PALETTE
): TokenSequence {
  if (count < 1) return [];
  if (palette.length < 1) throw new Error('Token train palette cannot be empty.');

  const tokens: TokenSequence[number][] = [];
  for (let cycle = 0; tokens.length < count; cycle += 1) {
    const candidates = shuffle(palette, `${seed}:${cycle}`);
    while (tokens.length < count && candidates.length > 0) {
      appendWithoutAdjacentDuplicate(tokens, candidates);
      candidates.splice(candidates.indexOf(tokens[tokens.length - 1]), 1);
    }
  }
  return tokens;
}

export type TokenDriftOptions = {
  minOffsetPx?: number;
  maxOffsetPx?: number;
};

function seededUnits(seed: string, count: number) {
  let state = seedState(seed);
  return Array.from({ length: count }, () => {
    state = nextState(state);
    return state / LCG_MODULUS;
  });
}

function driftSign(seed: string, index: number) {
  const start = seedState(seed) % 2 === 0 ? 1 : -1;
  return index % 2 === 0 ? start : -start;
}

export function seededTokenDrift(
  seed: string,
  count: number,
  { minOffsetPx = 6, maxOffsetPx = 22 }: TokenDriftOptions = {}
) {
  return seededUnits(seed, count).map((unit, index) => {
    const amplitude = minOffsetPx + unit * (maxOffsetPx - minOffsetPx);
    return Math.round(amplitude * driftSign(seed, index));
  });
}
