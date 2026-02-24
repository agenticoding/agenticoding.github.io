import React from 'react';
import { AgentNode } from '../ActorNodes';

interface IconProps {
  className?: string;
  size?: number;
}

// Checklist (left column) + AgentNode badge (right column).
// Rows at y=4/10/16. Agent at x=10,y=7 — head top at y≈8.05, center at y≈14.5.
// Row 1 complete (check+line above agent). Rows 2 & 3 show marks only; agent
// fills the right zone beside them (no x overlap: marks ≤x8, head ≥x11.05).
export default function PlanExecuteIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Plan and execute icon"
    >
      {/* Checklist strokes inherit currentColor */}
      <g stroke="currentColor">
        {/* Row 1 — checked */}
        <path d="M 3,4 L 5,6 L 8,2" strokeWidth="2" />
        <line x1="10" y1="4" x2="21" y2="4" strokeWidth="2" />
        {/* Row 2 — checked (no line; agent occupies right zone) */}
        <path d="M 3,10 L 5,12 L 8,8" strokeWidth="2" />
        {/* Row 3 — pending circle only (agent occupies right side) */}
        <circle cx="5.5" cy="16" r="1.5" strokeWidth="1.5" />
      </g>
      {/* AgentNode S=14 — right column, raised to y=7 for tighter composition.
          Head top lands at parent y≈8.05; center at y≈14.5 (between rows 2 & 3).
          Row 1 check+line (y=4) sit cleanly above. Rows 2 & 3 marks are to the
          left (x≤8) — no x overlap with head (x≥11.05). */}
      <svg x="10" y="7" width="14" height="14" viewBox="0 0 14 14" overflow="visible">
        <AgentNode x={0} y={0} size={14} />
      </svg>
    </svg>
  );
}
