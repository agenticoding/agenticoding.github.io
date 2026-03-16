export const CONNECTOR_STYLE = {
  stroke: 'var(--text-muted)',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  fill: 'none',
};

export const GHOST_STYLE = { strokeWidth: 1, strokeDasharray: '3 4' } as const;
export const ARROWHEAD_POINTS     = '-8,-4 0,0 -8,4';   // tip-at-origin, right-pointing 8×8
export const ARROWHEAD_POINTS_REV = '8,-4 0,0 8,4';     // tip-at-origin, left-pointing 8×8
export const ARROWHEAD_POINTS_SM  = '-5,-2.5 0,0 -5,2.5'; // tip-at-origin, right-pointing 5×5 (compact layouts)
const ARROW_FADE_START = 0.85;

/** Arrowhead opacity: fades in as its arc completes (last 15% of draw window). */
export function arrowOpacity(t: number): number {
  return Math.min(Math.max((t - ARROW_FADE_START) / (1 - ARROW_FADE_START), 0), 1);
}
