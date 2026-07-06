import React, { useId, type ReactNode } from 'react';

import {
  AnimatedTokenTrain,
  type TokenSequence,
  type TokenTrainOrientation,
} from './AnimatedTokenFlow';
import type { TokenTrainStagger, TokenTrainTiming } from './TokenTrainTiming';
import { ArrowMarker, trimPathEnd } from './diagramGeometry';
import { DIAGRAM_STROKE, DIAGRAM_TOKEN_SIZE } from './diagramScale';
import type { TokenUnitTone } from './TokenUnit';

type TokenTrainPathProps = {
  d: string;
  tokens: TokenSequence;
  stroke: string;
  tone?: TokenUnitTone;
  tokenPathD?: string;
  timing: TokenTrainTiming;
  stagger: TokenTrainStagger;
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
};

export type TokenArrowTrainProps = TokenTrainPathProps & {
  markerId?: string;
};

export type PairedTokenArrowTrainProps = {
  className?: string;
  request: TokenArrowTrainProps;
  response: TokenArrowTrainProps;
};

type TokenPathTrainProps = TokenTrainPathProps;

function svgId(id: string) {
  return id.replace(/:/g, '');
}

function tokenLaneOffset(
  size: number,
  strokeWidth: number,
  laneOffsetPx?: number
) {
  return laneOffsetPx ?? size / 2 + strokeWidth + 4;
}

function TrainPath({
  d,
  stroke,
  strokeWidth,
  strokeLinecap,
  strokeLinejoin,
  pathClassName,
  markerEnd,
}: Pick<
  TokenTrainPathProps,
  | 'd'
  | 'stroke'
  | 'strokeWidth'
  | 'strokeLinecap'
  | 'strokeLinejoin'
  | 'pathClassName'
> & { markerEnd?: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      markerEnd={markerEnd}
      className={pathClassName}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function TrainLabel({
  label,
  labelX,
  labelY,
  labelClassName,
  labelFill,
  stroke,
}: Pick<
  TokenTrainPathProps,
  'label' | 'labelX' | 'labelY' | 'labelClassName' | 'labelFill' | 'stroke'
>) {
  if (!label) return null;
  return (
    <text
      x={labelX}
      y={labelY}
      className={labelClassName}
      fill={labelFill ?? stroke}
    >
      {label}
    </text>
  );
}

function TrainTokens({
  d,
  tokenPathD,
  tokens,
  timing,
  stagger,
  size,
  tone,
  laneOffsetPx,
  laneOrientation,
}: Required<Pick<TokenTrainPathProps, 'size' | 'tone' | 'laneOrientation'>> &
  Pick<
    TokenTrainPathProps,
    'd' | 'tokenPathD' | 'tokens' | 'timing' | 'stagger' | 'laneOffsetPx'
  >) {
  return (
    <AnimatedTokenTrain
      pathD={tokenPathD ?? d}
      tokens={tokens}
      timing={timing}
      stagger={stagger}
      size={size}
      tone={tone}
      laneOffsetPx={laneOffsetPx}
      laneOrientation={laneOrientation}
    />
  );
}

function TrainBody({
  markerEnd,
  ...props
}: TokenTrainPathProps & { markerEnd?: string }) {
  const size = props.size ?? DIAGRAM_TOKEN_SIZE.flow;
  const strokeWidth = props.strokeWidth ?? DIAGRAM_STROKE.connector;
  const laneOrientation = props.laneOrientation ?? 'above';
  return (
    <>
      <TrainPath
        {...props}
        strokeWidth={strokeWidth}
        strokeLinecap={props.strokeLinecap ?? 'butt'}
        strokeLinejoin={props.strokeLinejoin ?? 'round'}
        markerEnd={markerEnd}
      />
      <TrainLabel {...props} />
      <TrainTokens
        {...props}
        size={size}
        tone={props.tone ?? 'violet'}
        laneOffsetPx={tokenLaneOffset(size, strokeWidth, props.laneOffsetPx)}
        laneOrientation={laneOrientation}
      />
    </>
  );
}

export function TokenArrowTrain({ markerId, ...props }: TokenArrowTrainProps) {
  const generatedId = svgId(useId());
  const arrowMarkerId = markerId ?? `token-arrow-${generatedId}`;
  return (
    <g className={props.className}>
      <defs>
        <ArrowMarker id={arrowMarkerId} fill={props.stroke} refX={0} />
      </defs>
      <TrainBody
        {...props}
        d={trimPathEnd(props.d)}
        markerEnd={`url(#${arrowMarkerId})`}
      />
    </g>
  );
}

export function PairedTokenArrowTrain({
  className,
  request,
  response,
}: PairedTokenArrowTrainProps) {
  return (
    <g className={className}>
      <TokenArrowTrain laneOrientation="above" {...request} />
      <TokenArrowTrain laneOrientation="below" {...response} />
    </g>
  );
}

export function TokenPathTrain(props: TokenPathTrainProps) {
  return (
    <g className={props.className}>
      <TrainBody {...props} />
    </g>
  );
}
