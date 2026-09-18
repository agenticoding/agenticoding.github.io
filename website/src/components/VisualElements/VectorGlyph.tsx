// A vector literal as a glyph: bracketed column of components. Used wherever
// the figure shows the embedding model *emitting vectors*, so the reader never
// confuses a vector with a token chip. Terminal Geometry — square caps/joins,
// sharp brackets — because brackets are code structure, not a container corner.

import React from 'react';
import { DIAGRAM_STROKE, DIAGRAM_TOKEN_SIZE } from './diagramScale';
import type { TokenUnitTone } from './TokenUnit';

type VectorGlyphProps = {
  x: number;
  y: number;
  size?: number;
  tone?: TokenUnitTone;
  /** Overrides the tone colour — a stored, inactive vector is drawn in the
   * figure's muted grey so it never reads as the model's own output. */
  color?: string;
};

/** Bracket inset and serif, as fractions of the glyph box. */
const BRACKET = { pad: 0.14, top: 0.2, serif: 0.18 } as const;
/** Component bars stacked inside the brackets. */
const BAR = { width: 0.34, height: 0.1, gap: 0.09 } as const;
const COMPONENTS = 3;

export function VectorGlyph({
  x,
  y,
  size = DIAGRAM_TOKEN_SIZE.flow,
  tone = 'indigo',
  color = `var(--visual-${tone})`,
}: VectorGlyphProps) {
  const pad = size * BRACKET.pad;
  const top = y + size * BRACKET.top;
  const bottom = y + size * (1 - BRACKET.top);
  const serif = size * BRACKET.serif;
  const barWidth = size * BAR.width;
  const barHeight = size * BAR.height;
  const gap = size * BAR.gap;
  const barX = x + (size - barWidth) / 2;
  const stackHeight = COMPONENTS * barHeight + (COMPONENTS - 1) * gap;
  const firstBarY = y + (size - stackHeight) / 2;
  return (
    <g
      aria-hidden="true"
      fill={color}
      stroke={color}
      strokeWidth={DIAGRAM_STROKE.default}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path
        d={`M ${x + pad + serif} ${top} L ${x + pad} ${top} L ${x + pad} ${bottom} L ${x + pad + serif} ${bottom}`}
        fill="none"
      />
      <path
        d={`M ${x + size - pad - serif} ${top} L ${x + size - pad} ${top} L ${x + size - pad} ${bottom} L ${x + size - pad - serif} ${bottom}`}
        fill="none"
      />
      {Array.from({ length: COMPONENTS }, (_, index) => (
        <rect
          key={index}
          x={barX}
          y={firstBarY + index * (barHeight + gap)}
          width={barWidth}
          height={barHeight}
          stroke="none"
        />
      ))}
    </g>
  );
}
