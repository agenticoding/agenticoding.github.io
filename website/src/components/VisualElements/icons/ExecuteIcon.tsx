import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ExecuteIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      role="img"
      aria-label="Execute icon"
    >
      {/* > prompt chevron */}
      <path d="M3,8 L10,12 L3,16" />
      {/* _ cursor */}
      <line x1="12" y1="16" x2="21" y2="16" />
    </svg>
  );
}
