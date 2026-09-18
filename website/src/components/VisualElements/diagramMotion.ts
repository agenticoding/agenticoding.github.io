import type { CSSProperties } from 'react';

export const TOKEN_FLOW_FADE_OFFSET = 14;

export type AnimationDelayStyle = CSSProperties & { animationDelay: string };

/** A staggered beat: the animation delay is the only per-item difference, so every
 * staggered primitive in the book shares this one helper. */
export function delayStyle(
  delayMs: number | undefined
): AnimationDelayStyle | undefined {
  if (delayMs === undefined) return undefined;
  return { animationDelay: `${delayMs}ms` };
}

export function tokenFlowFade(travel: number) {
  return travel + Math.sign(travel || 1) * TOKEN_FLOW_FADE_OFFSET;
}
