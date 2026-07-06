import React from 'react';

import { EmojiImage } from './ActorNodes';
import { EMOJI, OPENMOJI_VIEWBOX_SIZE } from './emojiAssets';

export type GearSpin = {
  activeMs: number;
  cycleMs: number;
  delayMs: number;
  turns: number;
};

export type GearNodeProps = {
  x: number;
  y: number;
  size: number;
  className?: string;
  spin?: GearSpin;
  style?: React.CSSProperties;
};

const GEAR_NATIVE_CX = 36;
const GEAR_NATIVE_CY = 34.9064;

export function GearNode({ x, y, size, className, spin, style }: GearNodeProps) {
  const pivot = gearPivot(x, y, size);

  if (spin) {
    return (
      <g className={className} style={style}>
        <g transform={`translate(${pivot.x} ${pivot.y})`}>
          <g>
            <EmojiImage
              asset={EMOJI.gear}
              x={x - pivot.x}
              y={y - pivot.y}
              size={size}
            />
            <animateTransform
              attributeName="transform"
              begin={`${spin.delayMs}ms`}
              calcMode="linear"
              dur={`${spin.cycleMs}ms`}
              keyTimes={`0;${activeSpinKeyTime(spin)};1`}
              repeatCount="indefinite"
              type="rotate"
              values={`0; ${spin.turns * 360}; ${spin.turns * 360}`}
            />
          </g>
        </g>
      </g>
    );
  }

  return (
    <g
      className={className}
      style={
        {
          ...style,
          transformBox: 'view-box',
          transformOrigin: `${pivot.x}px ${pivot.y}px`,
        } as React.CSSProperties
      }
    >
      <EmojiImage asset={EMOJI.gear} x={x} y={y} size={size} />
    </g>
  );
}

function gearPivot(x: number, y: number, size: number) {
  return {
    x: x + (size * GEAR_NATIVE_CX) / OPENMOJI_VIEWBOX_SIZE,
    y: y + (size * GEAR_NATIVE_CY) / OPENMOJI_VIEWBOX_SIZE,
  };
}

function activeSpinKeyTime({ activeMs, cycleMs }: GearSpin): string {
  return `${Math.min(1, activeMs / cycleMs).toFixed(4)}`;
}
