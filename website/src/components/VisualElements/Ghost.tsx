import React from 'react';
import clsx from 'clsx';
import shared from './diagram.module.css';
import { GHOST_STYLE } from './diagramConstants';

/** Returns CSS class string for a ghost placeholder element. */
export function ghostClass(mounted: boolean, reached: boolean): string {
  return clsx(
    shared.ghost,
    mounted && !reached && shared.ghostShown,
    reached && shared.ghostHidden,
  );
}

export interface GhostProps {
  x: number; y: number;
  width: number; height: number;
  rx?: number;
  fill: string; stroke: string;
  mounted: boolean; reached: boolean;
  style?: React.CSSProperties;
}
export function Ghost({ x, y, width, height, rx = 12, fill, stroke, mounted, reached, style }: GhostProps) {
  return (
    <rect
      x={x} y={y} width={width} height={height} rx={rx}
      fill={fill} stroke={stroke}
      {...GHOST_STYLE}
      className={ghostClass(mounted, reached)}
      style={style}
    />
  );
}
