import React from 'react';
import { superellipsePath } from '@site/src/utils/svgMath';

interface Props {
  compact?: boolean;
}

// Precomputed superellipsePath(410, 148, 44, 30, 3.5)
const OPERATOR_PATH =
  'M454.0,148.0 L453.9,156.0 L453.5,159.8 L452.9,162.8 L452.1,165.3 L451.0,167.5 L449.6,169.4 L448.0,171.1 L446.1,172.6 L443.9,173.9 L441.4,175.0 L438.6,175.9 L435.4,176.7 L431.7,177.3 L427.3,177.7 L421.7,177.9 L410.0,178.0 L398.3,177.9 L392.7,177.7 L388.3,177.3 L384.6,176.7 L381.4,175.9 L378.6,175.0 L376.1,173.9 L373.9,172.6 L372.0,171.1 L370.4,169.4 L369.0,167.5 L367.9,165.3 L367.1,162.8 L366.5,159.8 L366.1,156.0 L366.0,148.0 L366.1,140.0 L366.5,136.2 L367.1,133.2 L367.9,130.7 L369.0,128.5 L370.4,126.6 L372.0,124.9 L373.9,123.4 L376.1,122.1 L378.6,121.0 L381.4,120.1 L384.6,119.3 L388.3,118.7 L392.7,118.3 L398.3,118.1 L410.0,118.0 L421.7,118.1 L427.3,118.3 L431.7,118.7 L435.4,119.3 L438.6,120.1 L441.4,121.0 L443.9,122.1 L446.1,123.4 L448.0,124.9 L449.6,126.6 L451.0,128.5 L452.1,130.7 L452.9,133.2 L453.5,136.2 L453.9,140.0 L454.0,148.0Z';

export default function MentalModelComparison({ compact = false }: Props) {
  return (
    <svg
      viewBox="0 0 600 280"
      width="100%"
      height="auto"
      role="img"
      aria-label="Side-by-side comparison: left panel shows AI as Teammate model with bidirectional relationship, right panel shows AI as Power Tool model with operator directing tool"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Arrow marker for rose (Smooth Circuit) */}
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

      {/* Bidirectional arcs — You ↔ AI (Smooth Circuit: round linecaps) */}
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

      {/* Operator node — squircle (Smooth Circuit) */}
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
        rx="2"
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
