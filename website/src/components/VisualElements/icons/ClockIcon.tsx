import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ClockIcon({ className, size = 24 }: IconProps) {
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
      aria-label="Clock icon"
    >
      {/* Clock face */}
      <circle cx="12" cy="12" r="9.5" strokeWidth="2" />
      {/* Minute hand — pointing to 12 o'clock */}
      <line x1="12" y1="12" x2="12" y2="6.5" strokeWidth="2" />
      {/* Hour hand — pointing to ~2 o'clock */}
      <line x1="12" y1="12" x2="15.5" y2="10" strokeWidth="2" />
      {/* Center pivot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
