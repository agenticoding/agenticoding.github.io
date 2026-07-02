import React from 'react';
import { DIAGRAM_MARKER } from './diagramScale';

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
