import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ConnectedIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Connected network icon"
    >
      {/* Three nodes */}
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />

      {/* Solid connections forming network */}
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="10" y1="8" x2="8" y2="10" />
      <line x1="14" y1="8" x2="16" y2="10" />
    </svg>
  );
}
