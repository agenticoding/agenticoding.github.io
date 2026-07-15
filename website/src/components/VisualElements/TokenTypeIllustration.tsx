import React from 'react';

import {
  TokenUnit,
  type TokenUnitModality,
  type TokenUnitSignal,
} from './TokenUnit';

export type TokenExample = {
  modality: TokenUnitModality;
  signal: TokenUnitSignal;
  label: string;
};

// All chips use violet tone — consistent with TokenPredictionDiagram. Shapes
// (modality) provide the visual distinction; color carries no per-modality meaning here.
const TONE = 'violet' as const;

const TOKEN_EXAMPLES: TokenExample[] = [
  { modality: 'text', signal: 'ordinary', label: 'text' },
  { modality: 'code', signal: 'salient', label: 'call' },
  { modality: 'image', signal: 'ordinary', label: 'image' },
  { modality: 'audio', signal: 'ordinary', label: 'audio' },
  { modality: 'video', signal: 'compressed', label: 'video' },
];

const CHIP_SIZE = 28;
const GAP = 16;
const LABEL_GAP = 4;
const LABEL_HEIGHT = 14;
const EDGE_PAD = 8;
export const tokenIllustrationWidth = (count: number) =>
  count * (CHIP_SIZE + GAP) - GAP + EDGE_PAD * 2;
const TOTAL_W = tokenIllustrationWidth(TOKEN_EXAMPLES.length);
const SVG_H = CHIP_SIZE + LABEL_GAP + LABEL_HEIGHT;

export function TokenTypeTokens({
  examples,
  x = 0,
  y = 0,
  className,
  itemClassName,
}: {
  examples: readonly TokenExample[];
  x?: number;
  y?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      {examples.map(({ modality, signal, label }, i) => {
        const tokenX = EDGE_PAD + i * (CHIP_SIZE + GAP);
        return (
          <g className={itemClassName} key={`${modality}-${label}`}>
            <TokenUnit
              x={tokenX}
              y={0}
              width={CHIP_SIZE}
              height={CHIP_SIZE}
              tone={TONE}
              modality={modality}
              signal={signal}
            />
            <text
              x={tokenX + CHIP_SIZE / 2}
              y={CHIP_SIZE + LABEL_GAP + LABEL_HEIGHT - 2}
              textAnchor="middle"
              fontFamily="var(--font-mono-keyword)"
              fontSize="9"
              fill="var(--text-muted)"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function TokenTypeIllustration() {
  return (
    <svg
      viewBox={`0 0 ${TOTAL_W} ${SVG_H}`}
      width="100%"
      style={{ maxWidth: TOTAL_W, margin: '0.5rem auto', display: 'block' }}
      aria-hidden="true"
    >
      <TokenTypeTokens examples={TOKEN_EXAMPLES} />
    </svg>
  );
}
