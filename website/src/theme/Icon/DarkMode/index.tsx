import {type ReactNode} from 'react';
import type {Props} from '@theme/Icon/DarkMode';

// Stroked crescent moon — Smooth Circuit family (design system)
// Standard Lucide-style moon path at 24x24 viewBox.
export default function IconDarkMode(props: Props): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...props}>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
