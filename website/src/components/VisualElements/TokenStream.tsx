import React from 'react';

import {
  TokenUnit,
  type TokenUnitModality,
  type TokenUnitSignal,
  type TokenUnitTone,
} from './TokenUnit';

export type TokenStreamToken = {
  modality: TokenUnitModality;
  signal?: TokenUnitSignal;
};

type TokenStreamProps = {
  x: number;
  y: number;
  tokens: readonly TokenStreamToken[];
  direction?: 'right' | 'down';
  gap?: number;
  size?: number;
  tone?: TokenUnitTone;
  className?: string;
  tokenClassName?: string;
};

export const MIXED_CONTEXT_TOKENS = [
  { modality: 'code', signal: 'salient' },
  { modality: 'text' },
  { modality: 'image', signal: 'compressed' },
  { modality: 'audio' },
  { modality: 'video', signal: 'compressed' },
  { modality: 'generic' },
  { modality: 'text', signal: 'compressed' },
  { modality: 'code' },
  { modality: 'generic', signal: 'salient' },
] as const satisfies readonly TokenStreamToken[];

export const TEXT_CONTEXT_TOKENS = [
  { modality: 'text' },
  { modality: 'text', signal: 'compressed' },
  { modality: 'text', signal: 'salient' },
] as const satisfies readonly TokenStreamToken[];

export const OUTPUT_TOKENS = [
  { modality: 'code', signal: 'salient' },
  { modality: 'text' },
  { modality: 'generic', signal: 'compressed' },
] as const satisfies readonly TokenStreamToken[];

const positionFor = (index: number, direction: 'right' | 'down', step: number) => ({
  dx: direction === 'right' ? index * step : 0,
  dy: direction === 'down' ? index * step : 0,
});

export function TokenStream({
  x,
  y,
  tokens,
  direction = 'right',
  gap = 6,
  size = 22,
  tone = 'indigo',
  className,
  tokenClassName,
}: TokenStreamProps) {
  const step = size + gap;

  return (
    <g className={className} aria-hidden="true">
      {tokens.map((token, index) => {
        const { dx, dy } = positionFor(index, direction, step);
        return (
          <TokenUnit
            key={`${token.modality}-${token.signal ?? 'ordinary'}-${index}`}
            x={x + dx}
            y={y + dy}
            width={size}
            height={size}
            tone={tone}
            modality={token.modality}
            signal={token.signal}
            className={tokenClassName}
          />
        );
      })}
    </g>
  );
}
