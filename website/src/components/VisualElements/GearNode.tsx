import React from 'react';

import { EmojiImage } from './ActorNodes';
import { EMOJI, OPENMOJI_VIEWBOX_SIZE } from './emojiAssets';

export type GearNodeProps = {
  x: number;
  y: number;
  size: number;
  className?: string;
  style?: React.CSSProperties;
};

const GEAR_NATIVE_CX = 36;
const GEAR_NATIVE_CY = 34.9064;

export function GearNode({ x, y, size, className, style }: GearNodeProps) {
  const pivotX = x + (size * GEAR_NATIVE_CX) / OPENMOJI_VIEWBOX_SIZE;
  const pivotY = y + (size * GEAR_NATIVE_CY) / OPENMOJI_VIEWBOX_SIZE;

  return (
    <g
      className={className}
      style={
        {
          ...style,
          transformBox: 'view-box',
          transformOrigin: `${pivotX}px ${pivotY}px`,
        } as React.CSSProperties
      }
    >
      <EmojiImage asset={EMOJI.gear} x={x} y={y} size={size} />
    </g>
  );
}
