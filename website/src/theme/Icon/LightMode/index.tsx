import {type ReactNode} from 'react';
import type {Props} from '@theme/Icon/LightMode';

// Stroked sun icon — Smooth Circuit family (design system)
// Circle r=5 at center (12,12). 8 rays from r=8 to r=11.
// Diagonal coordinates computed: cos/sin at 45° intervals.
export default function IconLightMode(props: Props): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round">
        <circle cx={12} cy={12} r={5} />
        <line x1={12} y1={1} x2={12} y2={4} />
        <line x1={12} y1={20} x2={12} y2={23} />
        <line x1={1} y1={12} x2={4} y2={12} />
        <line x1={20} y1={12} x2={23} y2={12} />
        <line x1={4.22} y1={4.22} x2={6.34} y2={6.34} />
        <line x1={17.66} y1={17.66} x2={19.78} y2={19.78} />
        <line x1={4.22} y1={19.78} x2={6.34} y2={17.66} />
        <line x1={17.66} y1={6.34} x2={19.78} y2={4.22} />
      </g>
    </svg>
  );
}
