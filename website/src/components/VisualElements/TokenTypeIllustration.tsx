import React from 'react';

import {
  TokenUnit,
  type TokenUnitModality,
  type TokenUnitSignal,
} from './TokenUnit';

type TokenExample = {
  modality: TokenUnitModality;
  signal: TokenUnitSignal;
  label: string;
};

// All chips use violet tone — consistent with TokenPredictionDiagram and
// PatternToUsefulWorkFunnel which both use a single tone. Shapes (modality)
// provide the visual distinction; color carries no per-modality meaning here.
const TONE = 'violet' as const;

const TOKEN_EXAMPLES: TokenExample[] = [
  { modality: 'text', signal: 'salient', label: 'word' },
  { modality: 'text', signal: 'ordinary', label: 'subword' },
  { modality: 'code', signal: 'salient', label: 'code' },
  { modality: 'image', signal: 'compressed', label: 'image' },
  { modality: 'audio', signal: 'ordinary', label: 'audio' },
  { modality: 'video', signal: 'compressed', label: 'video' },
  { modality: 'generic', signal: 'ordinary', label: 'tool' },
];

const CHIP_SIZE = 28;
const GAP = 16;
const LABEL_GAP = 4;
const LABEL_HEIGHT = 14;
const EDGE_PAD = 8;
const TOTAL_W = TOKEN_EXAMPLES.length * (CHIP_SIZE + GAP) - GAP + EDGE_PAD * 2;
const SVG_H = CHIP_SIZE + LABEL_GAP + LABEL_HEIGHT;

export default function TokenTypeIllustration() {
  return (
    <svg
      viewBox={`0 0 ${TOTAL_W} ${SVG_H}`}
      width="100%"
      style={{ maxWidth: TOTAL_W, margin: '0.5rem auto', display: 'block' }}
      aria-hidden="true"
    >
      {TOKEN_EXAMPLES.map(({ modality, signal, label }, i) => {
        const x = EDGE_PAD + i * (CHIP_SIZE + GAP);
        return (
          <g key={`${modality}-${label}`}>
            <TokenUnit
              x={x}
              y={0}
              width={CHIP_SIZE}
              height={CHIP_SIZE}
              tone={TONE}
              modality={modality}
              signal={signal}
            />
            <text
              x={x + CHIP_SIZE / 2}
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
    </svg>
  );
}
