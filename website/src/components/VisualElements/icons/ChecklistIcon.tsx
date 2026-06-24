import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Checklist icon — 3 rows: 2 checked items + 1 pending circle.
// Communicates "structured plan in progress." curved geometry throughout.
// Lines taper (11px → 8px → 6px) for visual progression.
export default function ChecklistIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Plan icon"
    >
      {/* Row 1 — checked */}
      <path d="M 3,5 L 5,7 L 8,3" strokeWidth="2" />
      <line x1="10" y1="5" x2="21" y2="5" strokeWidth="2" />
      {/* Row 2 — checked */}
      <path d="M 3,12 L 5,14 L 8,10" strokeWidth="2" />
      <line x1="10" y1="12" x2="18" y2="12" strokeWidth="2" />
      {/* Row 3 — pending (open circle, shorter line) */}
      <circle cx="5.5" cy="19" r="1.5" strokeWidth="1.5" />
      <line x1="10" y1="19" x2="16" y2="19" strokeWidth="2" />
    </svg>
  );
}
