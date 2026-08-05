import React from 'react';

export function CodeSystemIcon({
  x,
  y,
  size = 32,
}: {
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      color="var(--text-muted)"
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="2.5"
        width="21"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M 6 8.5 L 10 12 L 6 15.5 M 12 16.5 H 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
