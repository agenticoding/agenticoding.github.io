/* eslint-disable react/prop-types -- TypeScript owns prop validation for SVG primitive props. */
import React, { useId, type ReactNode } from 'react';

import {
  AnimatedEmojiTrain,
  AnimatedTokenTrain,
  type TokenSequence,
  type TokenTrainOrientation,
} from './AnimatedTokenFlow';
import type { EmojiAsset } from './emojiAssets';
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

type EmojiTrainPathProps = Omit<TokenTrainPathProps, 'tokens' | 'tone'> & {
  asset: EmojiAsset;
};

type TrainFrameProps = Omit<
  TokenTrainPathProps,
  | 'tokens'
  | 'tone'
  | 'timing'
  | 'stagger'
  | 'size'
  | 'laneOffsetPx'
  | 'laneOrientation'
>;

export type TokenArrowTrainProps = TokenTrainPathProps & { markerId?: string };
export type EmojiArrowTrainProps = EmojiTrainPathProps & { markerId?: string };
export type PairedTokenArrowTrainProps = {
  className?: string;
  request: TokenArrowTrainProps;
  response: TokenArrowTrainProps;
};
type TokenPathTrainProps = TokenTrainPathProps;
type EmojiPathTrainProps = EmojiTrainPathProps;

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
  TrainFrameProps,
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

function TrainBody({
  markerEnd,
  traveler,
  ...props
}: TrainFrameProps & { markerEnd?: string; traveler: ReactNode }) {
  return (
    <>
      <TrainPath
        {...props}
        strokeWidth={props.strokeWidth ?? DIAGRAM_STROKE.connector}
        strokeLinecap={props.strokeLinecap ?? 'butt'}
        strokeLinejoin={props.strokeLinejoin ?? 'round'}
        markerEnd={markerEnd}
      />
      <TrainLabel {...props} />
      {traveler}
    </>
  );
}

function TokenTraveler(props: TokenTrainPathProps) {
  const size = props.size ?? DIAGRAM_TOKEN_SIZE.flow;
  const strokeWidth = props.strokeWidth ?? DIAGRAM_STROKE.connector;
  return (
    <AnimatedTokenTrain
      pathD={props.tokenPathD ?? props.d}
      tokens={props.tokens}
      timing={props.timing}
      stagger={props.stagger}
      size={size}
      tone={props.tone ?? 'violet'}
      laneOffsetPx={tokenLaneOffset(size, strokeWidth, props.laneOffsetPx)}
      laneOrientation={props.laneOrientation ?? 'above'}
    />
  );
}

function EmojiTraveler(props: EmojiTrainPathProps) {
  const size = props.size ?? DIAGRAM_TOKEN_SIZE.flow;
  const strokeWidth = props.strokeWidth ?? DIAGRAM_STROKE.connector;
  return (
    <AnimatedEmojiTrain
      pathD={props.tokenPathD ?? props.d}
      asset={props.asset}
      timing={props.timing}
      stagger={props.stagger}
      size={size}
      laneOffsetPx={tokenLaneOffset(size, strokeWidth, props.laneOffsetPx)}
      laneOrientation={props.laneOrientation ?? 'above'}
    />
  );
}

function ArrowTrain({
  markerId,
  props,
  traveler,
}: {
  markerId?: string;
  props: TrainFrameProps;
  traveler: ReactNode;
}) {
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
        traveler={traveler}
      />
    </g>
  );
}

export function TokenArrowTrain({ markerId, ...props }: TokenArrowTrainProps) {
  return (
    <ArrowTrain
      markerId={markerId}
      props={props}
      traveler={<TokenTraveler {...props} />}
    />
  );
}

export function EmojiArrowTrain({ markerId, ...props }: EmojiArrowTrainProps) {
  return (
    <ArrowTrain
      markerId={markerId}
      props={props}
      traveler={<EmojiTraveler {...props} />}
    />
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
      <TrainBody {...props} traveler={<TokenTraveler {...props} />} />
    </g>
  );
}

export function EmojiPathTrain(props: EmojiPathTrainProps) {
  return (
    <g className={props.className}>
      <TrainBody {...props} traveler={<EmojiTraveler {...props} />} />
    </g>
  );
}
