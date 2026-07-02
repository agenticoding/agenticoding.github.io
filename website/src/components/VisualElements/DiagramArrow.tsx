import React from 'react';
import { ArrowMarker } from './diagramGeometry';
import { DIAGRAM_STROKE } from './diagramScale';
import { tileToneVars, type DiagramTone } from './diagramTileLayout';

type DiagramArrowProps = {
  d: string;
  markerIdPrefix: string;
  tone?: DiagramTone;
  className?: string;
  label?: string;
  labelClassName?: string;
  labelX?: number;
  labelY?: number;
};

type DiagramArrowMarkersProps = {
  prefix: string;
  tones: readonly DiagramTone[];
};

export function DiagramArrowMarkers({ prefix, tones }: DiagramArrowMarkersProps) {
  return (
    <defs>
      {tones.map((tone) => (
        <ArrowMarker key={tone} id={markerId(prefix, tone)} fill={arrowColor(tone)} refX={0} />
      ))}
    </defs>
  );
}

export function DiagramArrow({ d, markerIdPrefix, tone = 'neutral', className, label, labelClassName, labelX, labelY }: DiagramArrowProps) {
  const stroke = arrowColor(tone);
  return (
    <g className={className}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={DIAGRAM_STROKE.connector} strokeLinecap="butt" strokeLinejoin="miter" markerEnd={`url(#${markerId(markerIdPrefix, tone)})`} vectorEffect="non-scaling-stroke" />
      {label && <text x={labelX} y={labelY} className={labelClassName} fill={stroke}>{label}</text>}
    </g>
  );
}

function markerId(prefix: string, tone: DiagramTone) {
  return `${prefix}-${tone}`;
}

function arrowColor(tone: DiagramTone) {
  return tileToneVars(tone).accent;
}
