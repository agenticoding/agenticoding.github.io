import {type ReactNode} from 'react';
import type {Props} from '@theme/Icon/SystemColorMode';

// Stroked circle with vertical line — Smooth Circuit family (design system)
// Circle r=9 at center (12,12). Vertical line from (12,3) to (12,21).
// Conveys "split between light and dark" without using fill.
export default function IconSystemColorMode(props: Props): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round">
        <circle cx={12} cy={12} r={9} />
        <line x1={12} y1={3} x2={12} y2={21} />
      </g>
    </svg>
  );
}
