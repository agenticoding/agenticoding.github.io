import React from 'react';
import { DIAGRAM_MARKER, DIAGRAM_STROKE } from './diagramScale';

export function centerIn(size: number, childSize: number) {
  return (size - childSize) / 2;
}

export function markerAttrs(
  refX: number = DIAGRAM_MARKER.refX,
  markerUnits?: 'strokeWidth' | 'userSpaceOnUse'
) {
  return {
    markerWidth: DIAGRAM_MARKER.size,
    markerHeight: DIAGRAM_MARKER.size,
    refX,
    refY: DIAGRAM_MARKER.refY,
    orient: 'auto' as const,
    markerUnits,
  };
}

export function ArrowMarker({
  id,
  fill,
  refX,
  markerUnits,
}: {
  id: string;
  fill: string;
  refX?: number;
  markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
}) {
  return (
    <marker id={id} {...markerAttrs(refX, markerUnits)}>
      <polygon points={DIAGRAM_MARKER.points} fill={fill} />
    </marker>
  );
}

export const DIAGRAM_ARROW_TIP_TRIM = DIAGRAM_MARKER.size * DIAGRAM_STROKE.connector;

type Point = { x: number; y: number };

function trimPoint(end: Point, from: Point, amount: number): Point {
  const dx = end.x - from.x;
  const dy = end.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!length) return end;
  const trim = Math.min(amount, length);
  return { x: end.x - (dx / length) * trim, y: end.y - (dy / length) * trim };
}

function coord(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, '');
}

export function trimPathEnd(d: string, amount: number = DIAGRAM_ARROW_TIP_TRIM) {
  const cubic = d.match(/^(.*C\s*[-\d.]+\s+[-\d.]+,?\s*([-\d.]+)\s+([-\d.]+),?\s*)([-\d.]+)\s+([-\d.]+)$/);
  if (cubic) {
    const [, prefix, cx, cy, x, y] = cubic;
    const end = trimPoint({ x: Number(x), y: Number(y) }, { x: Number(cx), y: Number(cy) }, amount);
    return `${prefix}${coord(end.x)} ${coord(end.y)}`;
  }

  const horizontal = d.match(/^(.*\sH\s*)([-\d.]+)$/);
  if (horizontal) {
    const [, prefix, x] = horizontal;
    const prior = [...d.matchAll(/[-\d.]+/g)].map((match) => Number(match[0]));
    const fromX = prior.at(-3) ?? Number(x);
    const endX = Number(x);
    return `${prefix}${coord(endX - Math.sign(endX - fromX) * Math.min(amount, Math.abs(endX - fromX)))}`;
  }

  const vertical = d.match(/^(.*\sV\s*)([-\d.]+)$/);
  if (vertical) {
    const [, prefix, y] = vertical;
    const prior = [...d.matchAll(/[-\d.]+/g)].map((match) => Number(match[0]));
    const fromY = prior.at(-2) ?? Number(y);
    const endY = Number(y);
    return `${prefix}${coord(endY - Math.sign(endY - fromY) * Math.min(amount, Math.abs(endY - fromY)))}`;
  }

  const line = d.match(/^(.*[ML]\s*)([-\d.]+)\s+([-\d.]+)$/);
  if (line) {
    const [, prefix, x, y] = line;
    const prior = [...d.matchAll(/[-\d.]+/g)].map((match) => Number(match[0]));
    const end = trimPoint({ x: Number(x), y: Number(y) }, { x: prior.at(-4) ?? Number(x), y: prior.at(-3) ?? Number(y) }, amount);
    return `${prefix}${coord(end.x)} ${coord(end.y)}`;
  }

  return d;
}
