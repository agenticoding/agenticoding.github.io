import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function BugIcon({ className, size = 24 }: IconProps) {
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
      aria-label="Bug icon"
    >
      {/* Head */}
      <circle cx="12" cy="6.5" r="2.5" strokeWidth="2" />
      {/* Body */}
      <ellipse cx="12" cy="14" rx="5" ry="6" strokeWidth="2" />
      {/* Left antenna */}
      <line x1="10" y1="4.5" x2="7" y2="2.5" strokeWidth="1.5" />
      {/* Right antenna */}
      <line x1="14" y1="4.5" x2="17" y2="2.5" strokeWidth="1.5" />
      {/* Left legs */}
      <path d="M7,11 L4,9 M7,14 L3.5,14 M7.5,17 L5,19" strokeWidth="1" />
      {/* Right legs */}
      <path d="M17,11 L20,9 M17,14 L20.5,14 M16.5,17 L19,19" strokeWidth="1" />
    </svg>
  );
}
