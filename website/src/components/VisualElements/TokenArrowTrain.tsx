import React, { useId, type ReactNode } from 'react';

import {
  AnimatedTokenTrain,
  type TokenSequence,
  type TokenTrainOrientation,
} from './AnimatedTokenFlow';
import type { TokenTrainStagger, TokenTrainTiming } from './TokenTrainTiming';
import { ArrowMarker } from './diagramGeometry';
import { DIAGRAM_STROKE, DIAGRAM_TOKEN_SIZE } from './diagramScale';
import type { TokenUnitTone } from './TokenUnit';

type TokenArrowTrainProps = {
  d: string;
  tokens: TokenSequence;
  stroke: string;
  tone?: TokenUnitTone;
  tokenPathD?: string;
  timing?: TokenTrainTiming;
  stagger?: TokenTrainStagger;
  startDelayMs?: number;
  durationMs?: number;
  travelMs?: number;
  spacingPx?: number;
  size?: number;
  laneOffsetPx?: number;
  laneOrientation?: TokenTrainOrientation;
  className?: string;
  pathClassName?: string;
  label?: ReactNode;
  labelX?: number;
  labelY?: number;
  labelClassName?: string;
  labelFill?: string;
  strokeWidth?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  markerId?: string;
};

function svgId(id: string) {
  return id.replace(/:/g, '');
}

export function TokenArrowTrain({
  d,
  tokens,
  stroke,
  tone = 'violet',
  tokenPathD,
  timing,
  stagger,
  startDelayMs,
  durationMs,
  travelMs,
  spacingPx,
  size = DIAGRAM_TOKEN_SIZE.flow,
  laneOffsetPx,
  laneOrientation = 'above',
  className,
  pathClassName,
  label,
  labelX,
  labelY,
  labelClassName,
  labelFill,
  strokeWidth = DIAGRAM_STROKE.connector,
  strokeLinecap = 'round',
  strokeLinejoin = 'round',
  markerId,
}: TokenArrowTrainProps) {
  const generatedId = svgId(useId());
  const arrowMarkerId = markerId ?? `token-arrow-${generatedId}`;
  const tokenLaneOffset = laneOffsetPx ?? size / 2 + strokeWidth + 4;
  const trainTiming = timing ?? legacyTiming(startDelayMs, durationMs, travelMs);
  const trainStagger = stagger ?? legacyStagger(spacingPx);
  return (
    <g className={className}>
      <defs>
        <ArrowMarker id={arrowMarkerId} fill={stroke} />
      </defs>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
        markerEnd={`url(#${arrowMarkerId})`}
        className={pathClassName}
        vectorEffect="non-scaling-stroke"
      />
      {label && (
        <text
          x={labelX}
          y={labelY}
          className={labelClassName}
          fill={labelFill ?? stroke}
        >
          {label}
        </text>
      )}
      <AnimatedTokenTrain
        pathD={tokenPathD ?? d}
        tokens={tokens}
        timing={trainTiming}
        stagger={trainStagger}
        size={size}
        tone={tone}
        laneOffsetPx={tokenLaneOffset}
        laneOrientation={laneOrientation}
      />
    </g>
  );
}

function legacyTiming(
  startDelayMs = 0,
  durationMs = 3600,
  travelMs = 1600
): TokenTrainTiming {
  return {
    startDelayMs,
    cycleMs: durationMs,
    travelMs,
    fadeMs: 320,
  };
}

function legacyStagger(spacingPx = 28): TokenTrainStagger {
  return { mode: 'pathSpacing', spacingPx };
}
