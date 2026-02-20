import React from 'react';

interface Props {
  compact?: boolean;
}

export default function AdoptionGapDiagram({ compact = false }: Props) {
  const viewBox = compact ? '0 0 560 200' : '0 0 560 210';

  return (
    <svg
      viewBox={viewBox}
      width="100%"
      height="auto"
      role="img"
      aria-label="Bar chart showing the adoption gap: 77% AI tool adoption versus only 3% high trust in AI output"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Baseline */}
      <line
        x1="80"
        y1="173"
        x2="480"
        y2="173"
        stroke="var(--border-subtle)"
        strokeWidth="1"
        strokeLinecap="square"
      />

      {/* Adoption bar (77%) — x=100 y=20 width=48 height=150 */}
      <rect
        x="100"
        y="20"
        width="48"
        height="150"
        rx="2"
        fill="var(--visual-bg-warning)"
        stroke="var(--visual-warning)"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Trust bar (3%) — x=400 y=162 width=48 height=8 */}
      <rect
        x="400"
        y="162"
        width="48"
        height="8"
        rx="2"
        fill="var(--visual-bg-error)"
        stroke="var(--visual-error)"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Gap connector — polyline from adoption bar midpoint to trust bar midpoint */}
      <polyline
        points="152,95 260,95 260,166 396,166"
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Gap diamond marker on the vertical segment */}
      <polygon
        points="260,118 268,130 260,142 252,130"
        fill="var(--visual-bg-warning)"
        stroke="var(--visual-warning)"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />

      {/* Gap label */}
      <text
        x="280"
        y="122"
        style={{ fontFamily: 'var(--font-mono-keyword)' }}
        fontSize="11"
        fill="var(--visual-warning)"
        dominantBaseline="middle"
      >
        The Gap
      </text>

      {/* Adoption bar — percentage label above */}
      <text
        x="124"
        y="14"
        style={{ fontFamily: 'var(--font-mono-keyword)' }}
        fontSize="13"
        fontWeight="600"
        fill="var(--visual-warning)"
        textAnchor="middle"
        dominantBaseline="auto"
      >
        77%
      </text>

      {/* Adoption bar — category label below baseline */}
      <text
        x="124"
        y="186"
        style={{ fontFamily: 'var(--font-mono-keyword)' }}
        fontSize="11"
        fill="var(--text-muted)"
        textAnchor="middle"
        dominantBaseline="hanging"
      >
        Adoption
      </text>

      {/* Trust bar — percentage label above */}
      <text
        x="424"
        y="156"
        style={{ fontFamily: 'var(--font-mono-keyword)' }}
        fontSize="13"
        fontWeight="600"
        fill="var(--visual-error)"
        textAnchor="middle"
        dominantBaseline="auto"
      >
        3%
      </text>

      {/* Trust bar — category label below baseline */}
      <text
        x="424"
        y="186"
        style={{ fontFamily: 'var(--font-mono-keyword)' }}
        fontSize="11"
        fill="var(--text-muted)"
        textAnchor="middle"
        dominantBaseline="hanging"
      >
        Trust
      </text>
    </svg>
  );
}
