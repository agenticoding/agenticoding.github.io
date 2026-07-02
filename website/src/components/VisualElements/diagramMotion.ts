import type { CSSProperties } from 'react';

export const TOKEN_FLOW_FADE_OFFSET = 14;

export type AnimationDelayStyle = CSSProperties & { animationDelay: string };

export function delayStyle(delayMs: number): AnimationDelayStyle {
  return { animationDelay: `${delayMs}ms` };
}

export function tokenFlowFade(travel: number) {
  return travel + Math.sign(travel || 1) * TOKEN_FLOW_FADE_OFFSET;
}
