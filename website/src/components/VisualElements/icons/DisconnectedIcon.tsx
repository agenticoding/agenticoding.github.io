import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function DisconnectedIcon({ className, size = 24 }: IconProps) {
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
      aria-label="Disconnected network icon"
    >
      {/* Three nodes */}
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />

      {/* Broken/dashed connections */}
      <line
        x1="8"
        y1="12"
        x2="10"
        y2="12"
        strokeDasharray="2 2"
        opacity="0.5"
      />
      <line
        x1="14"
        y1="12"
        x2="16"
        y2="12"
        strokeDasharray="2 2"
        opacity="0.5"
      />
      <line x1="10" y1="8" x2="8" y2="10" strokeDasharray="2 2" opacity="0.5" />
      <line
        x1="14"
        y1="8"
        x2="16"
        y2="10"
        strokeDasharray="2 2"
        opacity="0.5"
      />
    </svg>
  );
}
