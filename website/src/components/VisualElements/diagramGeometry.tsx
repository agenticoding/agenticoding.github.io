import React from 'react';
import { markerAttrs } from './diagramGeometryCore';
import { DIAGRAM_MARKER } from './diagramScale';

export * from './diagramGeometryCore';

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
