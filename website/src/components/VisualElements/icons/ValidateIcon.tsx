import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ValidateIcon({ className, size = 24 }: IconProps) {
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
      aria-label="Validate icon"
    >
      {/* Post */}
      <line x1="12" y1="6" x2="12" y2="21" strokeWidth="2" />
      {/* Beam */}
      <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2" />
      {/* Base */}
      <line x1="9" y1="21" x2="15" y2="21" strokeWidth="2" />
      {/* Pivot pin */}
      <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
      {/* Left chain and pan */}
      <line x1="5" y1="9" x2="5" y2="15" strokeWidth="1.5" />
      <line x1="2" y1="15" x2="8" y2="15" strokeWidth="2" />
      {/* Right chain and pan — 2px lower (weighing in progress) */}
      <line x1="19" y1="9" x2="19" y2="17" strokeWidth="1.5" />
      <line x1="16" y1="17" x2="22" y2="17" strokeWidth="2" />
    </svg>
  );
}
