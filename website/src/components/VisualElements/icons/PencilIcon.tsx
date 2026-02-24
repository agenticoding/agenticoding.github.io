import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function PencilIcon({ className, size = 24 }: IconProps) {
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
      aria-label="Pencil icon"
    >
      {/* Shaft parallelogram at 45° */}
      <path d="M5,21 L19,7 L17,5 L3,19 Z" strokeWidth="2" />
      {/* Triangular nib */}
      <path d="M3,19 L2.5,21.5 L5,21" strokeWidth="2" />
      {/* Collar — graphite/wood boundary */}
      <line x1="5" y1="17" x2="7" y2="19" strokeWidth="1.5" />
      {/* Center axis */}
      <line x1="6" y1="18" x2="18" y2="6" strokeWidth="1" />
    </svg>
  );
}
