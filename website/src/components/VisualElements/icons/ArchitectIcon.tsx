import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ArchitectIcon({ className, size = 24 }: IconProps) {
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
      aria-label="Architect icon"
    >
      {/* Set square body */}
      <path d="M 3,3 L 3,21 L 21,21 Z" strokeWidth="2" />
      {/* Right-angle marker at bottom-left corner */}
      <path d="M 3,18 L 6,18 L 6,21" strokeWidth="1.5" />
      {/* Tick marks along hypotenuse */}
      <line x1="7.9" y1="10.1" x2="10.1" y2="7.9" strokeWidth="1" />
      <line x1="13.9" y1="16.1" x2="16.1" y2="13.9" strokeWidth="1" />
    </svg>
  );
}
