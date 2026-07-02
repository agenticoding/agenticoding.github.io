import React, { type CSSProperties } from 'react';
import clsx from 'clsx';

import {
  TokenUnit,
  type TokenUnitModality,
  type TokenUnitSignal,
  type TokenUnitTone,
} from './TokenUnit';
import { DIAGRAM_TOKEN_SIZE } from './diagramScale';
import { tokenFlowFade } from './diagramMotion';
import styles from './AnimatedTokenFlow.module.css';

export type AnimatedTokenFlowSpec = {
  delay: string;
  modality: TokenUnitModality;
  signal: TokenUnitSignal;
};

export type TokenSequence = readonly {
  modality: TokenUnitModality;
  signal?: TokenUnitSignal;
}[];

type PathPoint = { x: number; y: number };

type PathSegment = { from: PathPoint; to: PathPoint; length: number };

type FlowVariant =
  | 'input'
  | 'gear'
  | 'output'
  | 'verticalInput'
  | 'verticalOutput'
  | 'direct'
  | 'burstOutput'
  | 'burstVerticalInput'
  | 'burstVerticalOutput'
  | 'sequenceInput'
  | 'sequenceOutput'
  | 'sequenceVerticalInput'
  | 'sequenceVerticalOutput';

type MotionStyle = CSSProperties & {
  '--delay': string;
  '--travel-x'?: string;
  '--fade-x'?: string;
  '--travel-y'?: string;
  '--fade-y'?: string;
  '--flow-duration'?: string;
};

type AnimatedTokenFlowProps = {
  x: number;
  y: number;
  tokens: readonly AnimatedTokenFlowSpec[];
  variant: FlowVariant;
  size?: number;
  tone?: TokenUnitTone;
  travelX?: number;
  travelY?: number;
  durationMs?: number;
  className?: string;
};

export type TokenTrainOrientation = 'above' | 'below';

export type TokenTrainTiming = {
  startDelayMs?: number;
  cycleMs: number;
  travelMs: number;
  fadeMs: number;
  repeat?: 'loop' | 'once';
};

export type TokenTrainStagger =
  | { mode: 'pathSpacing'; spacingPx: number }
  | { mode: 'fixedStep'; stepMs: number };

type AnimatedTokenTrainProps = {
  pathD: string;
  tokens: TokenSequence;
  timing: TokenTrainTiming;
  stagger: TokenTrainStagger;
  size?: number;
  tone?: TokenUnitTone;
  laneOffsetPx?: number;
  laneOrientation?: TokenTrainOrientation;
  className?: string;
};

const VARIANT_CLASS: Record<FlowVariant, string> = {
  input: styles.inputTokenFlow,
  gear: styles.gearTokenFlow,
  output: styles.outputTokenFlow,
  verticalInput: styles.verticalInputTokenFlow,
  verticalOutput: styles.verticalOutputTokenFlow,
  direct: styles.directTokenFlow,
  burstOutput: styles.burstOutputTokenFlow,
  burstVerticalInput: styles.burstVerticalInputTokenFlow,
  burstVerticalOutput: styles.burstVerticalOutputTokenFlow,
  sequenceInput: styles.sequenceInputTokenFlow,
  sequenceOutput: styles.sequenceOutputTokenFlow,
  sequenceVerticalInput: styles.sequenceVerticalInputTokenFlow,
  sequenceVerticalOutput: styles.sequenceVerticalOutputTokenFlow,
};

export function tokenFlowSpecs(
  tokens: TokenSequence,
  startDelayMs: number,
  stepMs: number
): AnimatedTokenFlowSpec[] {
  return tokens.map(({ modality, signal = 'ordinary' }, index) => ({
    delay: `${startDelayMs + index * stepMs}ms`,
    modality,
    signal,
  }));
}

function motionStyle(
  delay: string,
  travelX = 126,
  travelY = 0,
  durationMs?: number
): MotionStyle {
  return {
    '--delay': delay,
    '--travel-x': `${travelX}px`,
    '--fade-x': `${tokenFlowFade(travelX)}px`,
    '--travel-y': `${travelY}px`,
    '--fade-y': `${tokenFlowFade(travelY)}px`,
    ...(durationMs ? { '--flow-duration': `${durationMs}ms` } : {}),
  };
}

const COMMAND = /^[MLHVCSQTAZ]$/i;
const CURVE_STEPS = 24;

function parsePathTokens(pathD: string) {
  return pathD.match(/[MLHVCSQTAZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
}

function isCommand(token: string) {
  return COMMAND.test(token);
}

function segmentLength(from: PathPoint, to: PathPoint) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function addSegment(segments: PathSegment[], from: PathPoint, to: PathPoint) {
  const length = segmentLength(from, to);
  if (length > 0) segments.push({ from, to, length });
}

function readNumber(tokens: string[], index: number) {
  const value = Number(tokens[index]);
  if (!Number.isFinite(value))
    throw new Error(`Invalid path coordinate: ${tokens[index]}`);
  return value;
}

function linePoint(segment: PathSegment, distance: number) {
  const t = Math.min(1, Math.max(0, distance / segment.length));
  return {
    x: segment.from.x + (segment.to.x - segment.from.x) * t,
    y: segment.from.y + (segment.to.y - segment.from.y) * t,
  };
}

function parsePath(pathD: string) {
  const state: PathState = {
    tokens: parsePathTokens(pathD),
    i: 0,
    command: '',
  };
  const segments: PathSegment[] = [];
  let point = { x: 0, y: 0 };
  let subpathStart = point;
  let lastCubic: PathPoint | undefined;
  let lastQuadratic: PathPoint | undefined;
  while (state.i < state.tokens.length) {
    if (isCommand(state.tokens[state.i]))
      state.command = state.tokens[state.i++];
    const result = readPathCommand(state, segments, point, subpathStart, {
      lastCubic,
      lastQuadratic,
    });
    point = result.point;
    subpathStart = result.subpathStart;
    lastCubic = result.lastCubic;
    lastQuadratic = result.lastQuadratic;
  }
  if (segments.length === 0)
    throw new Error('Token train path must contain a visible segment.');
  return segments;
}

type PathState = { tokens: string[]; i: number; command: string };
type CurveMemory = { lastCubic?: PathPoint; lastQuadratic?: PathPoint };

function readPathCommand(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint,
  memory: CurveMemory
) {
  const command = state.command;
  if (!command) throw new Error('Token train path must start with a command.');
  if (command.toUpperCase() === 'Z') {
    addSegment(segments, point, subpathStart);
    return resetCurveMemory(subpathStart, subpathStart);
  }
  return readDrawableCommand(state, segments, point, subpathStart, memory);
}

function resetCurveMemory(point: PathPoint, subpathStart: PathPoint) {
  return {
    point,
    subpathStart,
    lastCubic: undefined,
    lastQuadratic: undefined,
  };
}

function readDrawableCommand(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint,
  memory: CurveMemory
) {
  const command = state.command.toUpperCase();
  if (command === 'M') return moveTo(state, point);
  if (command === 'L') return lineTo(state, segments, point, subpathStart);
  if (command === 'H')
    return horizontalTo(state, segments, point, subpathStart);
  if (command === 'V') return verticalTo(state, segments, point, subpathStart);
  if (command === 'C') return cubicTo(state, segments, point, subpathStart);
  if (command === 'S')
    return smoothCubicTo(
      state,
      segments,
      point,
      subpathStart,
      memory.lastCubic
    );
  if (command === 'Q') return quadraticTo(state, segments, point, subpathStart);
  if (command === 'T')
    return smoothQuadraticTo(
      state,
      segments,
      point,
      subpathStart,
      memory.lastQuadratic
    );
  if (command === 'A') return arcTo(state, segments, point, subpathStart);
  throw new Error(`Unsupported token train path command: ${state.command}`);
}

function absolutePoint(state: PathState, point: PathPoint, xIndex: number) {
  const next = {
    x: readNumber(state.tokens, xIndex),
    y: readNumber(state.tokens, xIndex + 1),
  };
  return state.command === state.command.toLowerCase()
    ? { x: point.x + next.x, y: point.y + next.y }
    : next;
}

function moveTo(state: PathState, point: PathPoint) {
  const next = absolutePoint(state, point, state.i);
  state.i += 2;
  state.command = state.command === 'm' ? 'l' : 'L';
  return resetCurveMemory(next, next);
}

function lineTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint
) {
  const next = absolutePoint(state, point, state.i);
  state.i += 2;
  addSegment(segments, point, next);
  return resetCurveMemory(next, subpathStart);
}

function horizontalTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint
) {
  const x = readNumber(state.tokens, state.i++);
  const next = { x: state.command === 'h' ? point.x + x : x, y: point.y };
  addSegment(segments, point, next);
  return resetCurveMemory(next, subpathStart);
}

function verticalTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint
) {
  const y = readNumber(state.tokens, state.i++);
  const next = { x: point.x, y: state.command === 'v' ? point.y + y : y };
  addSegment(segments, point, next);
  return resetCurveMemory(next, subpathStart);
}

function cubicTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint
) {
  const c1 = absolutePoint(state, point, state.i);
  const c2 = absolutePoint(state, point, state.i + 2);
  const next = absolutePoint(state, point, state.i + 4);
  state.i += 6;
  addSampledCurve(segments, point, (t) => cubicPoint(point, c1, c2, next, t));
  return { point: next, subpathStart, lastCubic: c2, lastQuadratic: undefined };
}

function smoothCubicTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint,
  lastCubic?: PathPoint
) {
  const c1 = lastCubic ? reflect(lastCubic, point) : point;
  const c2 = absolutePoint(state, point, state.i);
  const next = absolutePoint(state, point, state.i + 2);
  state.i += 4;
  addSampledCurve(segments, point, (t) => cubicPoint(point, c1, c2, next, t));
  return { point: next, subpathStart, lastCubic: c2, lastQuadratic: undefined };
}

function quadraticTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint
) {
  const c = absolutePoint(state, point, state.i);
  const next = absolutePoint(state, point, state.i + 2);
  state.i += 4;
  addSampledCurve(segments, point, (t) => quadraticPoint(point, c, next, t));
  return { point: next, subpathStart, lastCubic: undefined, lastQuadratic: c };
}

function smoothQuadraticTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint,
  lastQuadratic?: PathPoint
) {
  const c = lastQuadratic ? reflect(lastQuadratic, point) : point;
  const next = absolutePoint(state, point, state.i);
  state.i += 2;
  addSampledCurve(segments, point, (t) => quadraticPoint(point, c, next, t));
  return { point: next, subpathStart, lastCubic: undefined, lastQuadratic: c };
}

function arcTo(
  state: PathState,
  segments: PathSegment[],
  point: PathPoint,
  subpathStart: PathPoint
) {
  const params = Array.from({ length: 5 }, (_, offset) =>
    readNumber(state.tokens, state.i + offset)
  );
  const next = absolutePoint(state, point, state.i + 5);
  state.i += 7;
  addArcSegments(segments, point, next, params);
  return resetCurveMemory(next, subpathStart);
}

function addSampledCurve(
  segments: PathSegment[],
  start: PathPoint,
  sample: (t: number) => PathPoint
) {
  let previous = start;
  for (let step = 1; step <= CURVE_STEPS; step++) {
    const next = sample(step / CURVE_STEPS);
    addSegment(segments, previous, next);
    previous = next;
  }
}

function cubicPoint(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  t: number
) {
  const m = 1 - t;
  return {
    x:
      m ** 3 * p0.x +
      3 * m ** 2 * t * p1.x +
      3 * m * t ** 2 * p2.x +
      t ** 3 * p3.x,
    y:
      m ** 3 * p0.y +
      3 * m ** 2 * t * p1.y +
      3 * m * t ** 2 * p2.y +
      t ** 3 * p3.y,
  };
}

function quadraticPoint(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  t: number
) {
  const m = 1 - t;
  return {
    x: m ** 2 * p0.x + 2 * m * t * p1.x + t ** 2 * p2.x,
    y: m ** 2 * p0.y + 2 * m * t * p1.y + t ** 2 * p2.y,
  };
}

function reflect(point: PathPoint, around: PathPoint) {
  return { x: around.x * 2 - point.x, y: around.y * 2 - point.y };
}

function addArcSegments(
  segments: PathSegment[],
  from: PathPoint,
  to: PathPoint,
  params: number[]
) {
  const arc = arcCenter(from, to, params);
  if (!arc) return addSegment(segments, from, to);
  addSampledCurve(segments, from, (t) => ({
    x:
      arc.cx +
      arc.rx * Math.cos(arc.start + arc.delta * t) * Math.cos(arc.phi) -
      arc.ry * Math.sin(arc.start + arc.delta * t) * Math.sin(arc.phi),
    y:
      arc.cy +
      arc.rx * Math.cos(arc.start + arc.delta * t) * Math.sin(arc.phi) +
      arc.ry * Math.sin(arc.start + arc.delta * t) * Math.cos(arc.phi),
  }));
}

function arcCenter(
  from: PathPoint,
  to: PathPoint,
  [rx0, ry0, angle, large, sweep]: number[]
) {
  let rx = Math.abs(rx0),
    ry = Math.abs(ry0);
  if (rx === 0 || ry === 0 || (from.x === to.x && from.y === to.y))
    return undefined;
  const phi = (angle * Math.PI) / 180;
  const p = arcPrimePoint(from, to, phi);
  const scale = Math.sqrt(Math.max(1, p.x ** 2 / rx ** 2 + p.y ** 2 / ry ** 2));
  rx *= scale;
  ry *= scale;
  const centerPrime = arcPrimeCenter(p, rx, ry, large, sweep);
  const { cx, cy } = unrotateCenter(centerPrime, from, to, phi);
  const start = vectorAngle(
    { x: 1, y: 0 },
    { x: (p.x - centerPrime.x) / rx, y: (p.y - centerPrime.y) / ry }
  );
  let delta = vectorAngle(
    { x: (p.x - centerPrime.x) / rx, y: (p.y - centerPrime.y) / ry },
    { x: (-p.x - centerPrime.x) / rx, y: (-p.y - centerPrime.y) / ry }
  );
  if (!sweep && delta > 0) delta -= Math.PI * 2;
  if (sweep && delta < 0) delta += Math.PI * 2;
  return { cx, cy, rx, ry, phi, start, delta };
}

function arcPrimePoint(from: PathPoint, to: PathPoint, phi: number) {
  const dx = (from.x - to.x) / 2,
    dy = (from.y - to.y) / 2;
  return {
    x: Math.cos(phi) * dx + Math.sin(phi) * dy,
    y: -Math.sin(phi) * dx + Math.cos(phi) * dy,
  };
}

function arcPrimeCenter(
  p: PathPoint,
  rx: number,
  ry: number,
  large: number,
  sweep: number
) {
  const sign = large === sweep ? -1 : 1;
  const numerator = rx ** 2 * ry ** 2 - rx ** 2 * p.y ** 2 - ry ** 2 * p.x ** 2;
  const denominator = rx ** 2 * p.y ** 2 + ry ** 2 * p.x ** 2;
  const coef = sign * Math.sqrt(Math.max(0, numerator / denominator));
  return { x: (coef * rx * p.y) / ry, y: (-coef * ry * p.x) / rx };
}

function unrotateCenter(
  center: PathPoint,
  from: PathPoint,
  to: PathPoint,
  phi: number
) {
  return {
    cx:
      Math.cos(phi) * center.x - Math.sin(phi) * center.y + (from.x + to.x) / 2,
    cy:
      Math.sin(phi) * center.x + Math.cos(phi) * center.y + (from.y + to.y) / 2,
  };
}

function vectorAngle(a: PathPoint, b: PathPoint) {
  const cross = a.x * b.y - a.y * b.x;
  const dot = a.x * b.x + a.y * b.y;
  return Math.atan2(cross, dot);
}

function pathLength(segments: readonly PathSegment[]) {
  return segments.reduce((sum, segment) => sum + segment.length, 0);
}

function pathPointAt(segments: readonly PathSegment[], distance: number) {
  let remaining = Math.max(0, distance);
  for (const segment of segments) {
    if (remaining <= segment.length) return linePoint(segment, remaining);
    remaining -= segment.length;
  }
  return segments[segments.length - 1].to;
}

function tokenTrainEntries(tokens: TokenSequence) {
  return tokens.map(({ modality, signal = 'ordinary' }, index) => ({
    modality,
    signal,
    index,
  }));
}

export function tokenTrainBeginOffsetMs(
  index: number,
  length: number,
  stagger: TokenTrainStagger,
  travelMs: number
) {
  if (stagger.mode === 'fixedStep') return index * stagger.stepMs;
  return Math.round((index * stagger.spacingPx * travelMs) / length);
}

function tokenTrainStaticDistance(
  index: number,
  length: number,
  stagger: TokenTrainStagger,
  travelMs: number
) {
  if (stagger.mode === 'fixedStep') return (index * stagger.stepMs * length) / travelMs;
  return index * stagger.spacingPx;
}

function seconds(ms: number) {
  return `${(ms / 1000).toFixed(3)}s`;
}

function laneTransform(
  segments: readonly PathSegment[],
  offset: number,
  orientation: TokenTrainOrientation
) {
  if (offset === 0) return undefined;
  const normal = orientedNormal(segments[0], orientation);
  const distance = Math.abs(offset);
  return `translate(${normal.x * distance} ${normal.y * distance})`;
}

function orientedNormal(
  segment: PathSegment,
  orientation: TokenTrainOrientation
) {
  const length = segment.length || 1;
  const normal = {
    x: (segment.from.y - segment.to.y) / length,
    y: (segment.to.x - segment.from.x) / length,
  };
  if (Math.abs(normal.y) < 0.001) return verticalNormal(orientation);
  const shouldFlip = orientation === 'above' ? normal.y > 0 : normal.y < 0;
  return shouldFlip ? { x: -normal.x, y: -normal.y } : normal;
}

function verticalNormal(orientation: TokenTrainOrientation) {
  // Vertical arrows have no screen-space above/below normal; choose stable sides.
  return orientation === 'above' ? { x: -1, y: 0 } : { x: 1, y: 0 };
}

export function AnimatedTokenFlow({
  x,
  y,
  tokens,
  variant,
  size = DIAGRAM_TOKEN_SIZE.flow,
  tone = 'violet',
  travelX,
  travelY,
  durationMs,
  className,
}: AnimatedTokenFlowProps) {
  return (
    <>
      {tokens.map(({ delay, modality, signal }) => (
        <g
          key={`${delay}-${modality}-${signal}`}
          className={clsx(styles.tokenFlow, VARIANT_CLASS[variant], className)}
          style={motionStyle(delay, travelX, travelY, durationMs)}
          aria-hidden="true"
        >
          <TokenUnit
            x={x}
            y={y}
            width={size}
            height={size}
            tone={tone}
            modality={modality}
            signal={signal}
          />
        </g>
      ))}
    </>
  );
}

export function AnimatedTokenTrain({
  pathD,
  tokens,
  timing,
  stagger,
  size = DIAGRAM_TOKEN_SIZE.flow,
  tone = 'violet',
  laneOffsetPx = 0,
  laneOrientation = 'above',
  className,
}: AnimatedTokenTrainProps) {
  const segments = parsePath(pathD);
  const length = pathLength(segments);
  const entries = tokenTrainEntries(tokens).reverse();
  const lane = laneTransform(segments, laneOffsetPx, laneOrientation);
  const startDelayMs = timing.startDelayMs ?? 0;
  return (
    <g className={className} aria-hidden="true">
      <g className={styles.tokenTrainAnimated} transform={lane}>
        {entries.map(({ modality, signal, index }) => (
          <TokenTrainMotion
            key={`${index}-${modality}-${signal}`}
            pathD={pathD}
            beginMs={
              startDelayMs +
              tokenTrainBeginOffsetMs(index, length, stagger, timing.travelMs)
            }
            timing={timing}
            size={size}
            tone={tone}
            modality={modality}
            signal={signal}
          />
        ))}
      </g>
      <g className={styles.tokenTrainStatic} transform={lane}>
        {entries.map(({ modality, signal, index }) => {
          const point = pathPointAt(
            segments,
            Math.min(
              length,
              tokenTrainStaticDistance(index, length, stagger, timing.travelMs)
            )
          );
          return (
            <TokenUnit
              key={`${index}-${modality}-${signal}`}
              x={point.x - size / 2}
              y={point.y - size / 2}
              width={size}
              height={size}
              tone={tone}
              modality={modality}
              signal={signal}
            />
          );
        })}
      </g>
    </g>
  );
}

function TokenTrainMotion({
  pathD,
  beginMs,
  timing,
  size,
  tone,
  modality,
  signal,
}: {
  pathD: string;
  beginMs: number;
  timing: TokenTrainTiming;
  size: number;
  tone: TokenUnitTone;
  modality: TokenUnitModality;
  signal: TokenUnitSignal;
}) {
  const travelEnd = timing.travelMs / timing.cycleMs;
  const fadeEnd = Math.min(1, (timing.travelMs + timing.fadeMs) / timing.cycleMs);
  const repeatCount = timing.repeat === 'once' ? undefined : 'indefinite';
  return (
    <g className={styles.tokenTrainItem} opacity="0">
      <TokenUnit
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        tone={tone}
        modality={modality}
        signal={signal}
      />
      <animateMotion
        path={pathD}
        dur={seconds(timing.cycleMs)}
        begin={seconds(beginMs)}
        repeatCount={repeatCount}
        rotate="0"
        keyPoints="0;1;1"
        keyTimes={`0;${travelEnd};1`}
        calcMode="linear"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0;0"
        dur={seconds(timing.cycleMs)}
        begin={seconds(beginMs)}
        repeatCount={repeatCount}
        keyTimes={`0;0.04;${travelEnd};${fadeEnd};1`}
      />
    </g>
  );
}
