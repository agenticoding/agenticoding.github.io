import React from 'react';

interface Props {
  compact?: boolean;
}

// Sharp operator card path centered at (410, 148), 88×60.
const OPERATOR_PATH = 'M366.0,118.0 L454.0,118.0 L454.0,178.0 L366.0,178.0 Z';

export default function MentalModelComparison({ compact: _compact = false }: Props) {
  return (
    <svg
      viewBox="0 0 600 280"
      width="100%"
      role="img"
      aria-label="Side-by-side comparison: left panel shows AI as Teammate model with bidirectional relationship, right panel shows AI as Power Tool model with operator directing tool"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Arrow marker for rose */}
        <marker
          id="mmcArrowRose"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="var(--visual-rose)" />
        </marker>
        {/* Arrow marker for cyan (Terminal Geometry) */}
        <marker
          id="mmcArrowCyan"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="var(--visual-cyan)" />
        </marker>
      </defs>

      {/* ---- DIVIDER ---- */}
      <line
        x1="300"
        y1="0"
        x2="300"
        y2="280"
        stroke="var(--border-default)"
        strokeWidth="1"
      />

      {/* ================================================================
          LEFT PANEL — AI AS TEAMMATE
          ================================================================ */}

      {/* Header background */}
      <rect
        x="0"
        y="0"
        width="300"
        height="32"
        fill="var(--visual-bg-error)"
      />

      {/* Header label */}
      <text
        x="150"
        y="21"
        style={{ fontFamily: 'var(--font-mono-keyword)' }}
        fontSize="11"
        fontWeight="500"
        fill="var(--visual-error)"
        textAnchor="middle"
        dominantBaseline="auto"
      >
        ✗ AI AS TEAMMATE
      </text>

      {/* "You" circle */}
      <circle
        cx="90"
        cy="148"
        r="36"
        fill="var(--visual-bg-rose)"
        stroke="var(--visual-rose)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="90"
        y="148"
        style={{ fontFamily: 'var(--font-mono-human)' }}
        fontSize="13"
        fontWeight="500"
        fill="var(--visual-rose)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        You
      </text>

      {/* "AI" circle — dashed border */}
      <circle
        cx="215"
        cy="148"
        r="36"
        fill="var(--surface-raised)"
        stroke="var(--visual-rose)"
        strokeWidth="2"
        strokeDasharray="5 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="215"
        y="148"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize="13"
        fontWeight="400"
        fill="var(--visual-rose)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        AI
      </text>

      {/* Bidirectional arcs — You ↔ AI; curve communicates relationship flow. */}
      {/* Upper arc: You → AI */}
      <path
        d="M 126,148 Q 152,110 179,148"
        fill="none"
        stroke="var(--visual-rose)"
        strokeWidth="1.5"
        strokeLinecap="round"
        markerEnd="url(#mmcArrowRose)"
      />
      {/* Lower arc: AI → You */}
      <path
        d="M 179,148 Q 152,186 126,148"
        fill="none"
        stroke="var(--visual-rose)"
        strokeWidth="1.5"
        strokeLinecap="round"
        markerEnd="url(#mmcArrowRose)"
      />

      {/* Left description label */}
      <text
        x="150"
        y="242"
        style={{ fontFamily: 'var(--font-body)' }}
        fontSize="11"
        fill="var(--text-muted)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Waiting. Fixing line-by-line.
      </text>

      {/* ================================================================
          RIGHT PANEL — AI AS POWER TOOL
          ================================================================ */}

      {/* Header background */}
      <rect
        x="300"
        y="0"
        width="300"
        height="32"
        fill="var(--visual-bg-cyan)"
      />

      {/* Header label */}
      <text
        x="450"
        y="21"
        style={{ fontFamily: 'var(--font-mono-keyword)' }}
        fontSize="11"
        fontWeight="500"
        fill="var(--visual-cyan)"
        textAnchor="middle"
        dominantBaseline="auto"
      >
        ✓ AI AS POWER TOOL
      </text>

      {/* Operator node — sharp rectangular container */}
      <path
        d={OPERATOR_PATH}
        fill="var(--surface-raised)"
        stroke="var(--visual-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="410"
        y="148"
        style={{ fontFamily: 'var(--font-mono-spec)' }}
        fontSize="12"
        fontWeight="500"
        fill="var(--visual-cyan)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Operator
      </text>

      {/* Tool node — sharp rect (Terminal Geometry) */}
      <rect
        x="490"
        y="124"
        width="76"
        height="48"
        rx="0"
        fill="var(--visual-bg-cyan)"
        stroke="var(--visual-cyan)"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <text
        x="528"
        y="148"
        style={{ fontFamily: 'var(--font-mono)' }}
        fontSize="12"
        fontWeight="400"
        fill="var(--visual-cyan)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        AI Tool
      </text>

      {/* Directional arrow — operator controls tool (Terminal Geometry: square caps) */}
      <line
        x1="456"
        y1="148"
        x2="488"
        y2="148"
        stroke="var(--visual-cyan)"
        strokeWidth="2"
        strokeLinecap="square"
        markerEnd="url(#mmcArrowCyan)"
      />

      {/* Right description label */}
      <text
        x="452"
        y="242"
        style={{ fontFamily: 'var(--font-body)' }}
        fontSize="11"
        fill="var(--text-muted)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Direct. Systematic. Validate output.
      </text>
    </svg>
  );
}
