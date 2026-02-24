import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ReviewLensIcon({ className, size = 24 }: IconProps) {
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
      aria-label="Review lens icon"
    >
      {/* Lens circle */}
      <circle cx="10" cy="10" r="6.5" strokeWidth="2" />
      {/* Handle */}
      <line x1="14.6" y1="14.6" x2="21" y2="21" strokeWidth="2" />
      {/* Checkmark inside lens */}
      <path d="M7,10 L9.5,12.5 L12.5,7.5" strokeWidth="1.5" />
    </svg>
  );
}
