// Single source of truth for the lost-in-the-middle attention model: one
// U-shaped curve every context-engineering figure renders. Attention at a
// context position depends on window FILL — the valley deepens and the
// primacy edge decays (J-curve toward recency) as the window fills. Figures
// never re-derive this math; they call attentionAt and the helpers below.
//
// Extracted from UShapeAttentionCurveGeometry (canonical, primacy-decay
// coefficient 0.3) and ContextPressureDiagram (whose 0.55 variant is deleted).

import { ZONE_FRACTIONS, type AttentionZone } from './contextZones.ts';

/* ── Core curve ─────────────────────────────────────────────────── */

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Normalize: public API takes fractions [0..1]; the U-shape figure feeds
// percentages [0..100] through createAttentionCurve, which converts.
function clampFill(fillRatio: number) {
  return clamp(fillRatio, 0, 1);
}

// Primacy-edge decay: past half-full the early context loses attention and
// the U tilts toward recency. 0 below 50% fill, ramps to 1 at 100%.
export function jCurveStrength(fillRatio: number): number {
  return Math.max(0, clampFill(fillRatio) - 0.5) * 2;
}

// The dead center — deepest valley — widens with fill (0.5 ± fill·0.15).
export function deadCenter(fillRatio: number): { start: number; end: number } {
  const half = clampFill(fillRatio) * 0.15;
  return { start: 0.5 - half, end: 0.5 + half };
}

// Attention at context position [0..1] given window fill [0..1]:
// quadratic valley centered at 0.5 (deepens with fill) plus a linear
// primacy decay (kicks in past half-full via the J-curve).
export function attentionAt(position: number, fillRatio: number): number {
  const fill = clampFill(fillRatio);
  const distanceFromCenter = 1 - Math.abs(position - 0.5) * 2;
  const primacyDecay = (1 - position) * jCurveStrength(fill) * 0.3;
  const drop = clamp(
    distanceFromCenter ** 2 * fill * 0.85 + primacyDecay,
    0,
    0.95
  );
  return 1 - drop;
}

/* ── Tiers & tones ──────────────────────────────────────────────── */

// Attention strength tiers — thresholds shared by tile tones, zone-band
// shading, and push-cue triggers so every figure degrades at the same point.
export const ATTENTION_TIERS = { strong: 0.45, degraded: 0.25 } as const;

export type AttentionTier = 'strong' | 'degraded' | 'collapsed';

export function tierAt(attention: number): AttentionTier {
  if (attention >= ATTENTION_TIERS.strong) return 'strong';
  if (attention >= ATTENTION_TIERS.degraded) return 'degraded';
  return 'collapsed';
}

export type Tone = 'success' | 'warning' | 'error';

export function toneAt(attention: number): Tone {
  const tier = tierAt(attention);
  return tier === 'strong'
    ? 'success'
    : tier === 'degraded'
      ? 'warning'
      : 'error';
}

export const TONE_BACKGROUNDS: Record<Tone, string> = {
  success: 'var(--visual-bg-success)',
  warning: 'var(--visual-bg-warning)',
  error: 'var(--visual-bg-error)',
};

export const TONE_COLORS: Record<Tone, string> = {
  success: 'var(--visual-success)',
  warning: 'var(--visual-warning)',
  error: 'var(--visual-error)',
};

// Band background per zone as a function of fill — the dynamic replacement
// for static ZONE_BAND_FILLS. Middle: the valley floor's own tier
// (muted → warning → error as the valley deepens). Primacy: cyan fades with
// the J-curve. Recency: stays cyan — the model keeps the recency edge strong.
export function zoneBandFill(zone: AttentionZone, fillRatio: number): string {
  if (zone === 'middle') {
    const tier = tierAt(attentionAt(0.5, fillRatio));
    return tier === 'strong'
      ? 'var(--surface-muted)'
      : TONE_BACKGROUNDS[tier === 'degraded' ? 'warning' : 'error'];
  }
  if (zone === 'primacy') {
    const strength = Math.round((1 - jCurveStrength(fillRatio) * 0.7) * 100);
    return `color-mix(in srgb, var(--visual-bg-cyan) ${strength}%, transparent)`;
  }
  return 'var(--visual-bg-cyan)';
}

// Inverse of attentionAt over fill: the fill at which a position's attention
// crosses a target (drives CSS keyframe stop positions — animation timing is
// model-derived, never hand-tuned). Bisection; attention falls as fill rises.
export function fillAtAttentionCrossing(
  position: number,
  target: number
): number {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (attentionAt(position, mid) > target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/* ── Curve geometry (dot layers + SVG projection) ───────────────── */

export interface PlotBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CurvePoint {
  position: number;
  attention: number;
  danger: boolean;
  cyanOpacity: number;
}

export interface AttentionCurve {
  fillRatio: number;
  deadCenterStart: number;
  deadCenterEnd: number;
  jCurveStrength: number;
  points: CurvePoint[];
}

export interface ProjectedCurvePoint extends CurvePoint {
  x: number;
  y: number;
}

const SAMPLE_COUNT = 9;

function getDotLayers(
  position: number,
  deadCenterStart: number,
  deadCenterEnd: number,
  jCurve: number
) {
  if (position >= deadCenterStart && position <= deadCenterEnd) {
    return { danger: true, cyanOpacity: 0 };
  }

  if (position >= ZONE_FRACTIONS.recencyStart)
    return { danger: false, cyanOpacity: 1 };
  if (position <= ZONE_FRACTIONS.primacyEnd)
    return { danger: false, cyanOpacity: 1 - jCurve };
  return { danger: false, cyanOpacity: 0 };
}

function createCurvePoint(
  position: number,
  fillRatio: number,
  deadCenterStart: number,
  deadCenterEnd: number,
  jCurve: number
): CurvePoint {
  return {
    position,
    attention: attentionAt(position, fillRatio),
    ...getDotLayers(position, deadCenterStart, deadCenterEnd, jCurve),
  };
}

// contextFill is a percentage [0..100] — the U-shape figure's input units.
export function createAttentionCurve(contextFill: number): AttentionCurve {
  const fillRatio = clamp(contextFill, 0, 100) / 100;
  const { start: deadCenterStart, end: deadCenterEnd } = deadCenter(fillRatio);
  const jCurve = jCurveStrength(fillRatio);
  const points = Array.from({ length: SAMPLE_COUNT }, (_, index) =>
    createCurvePoint(
      index / (SAMPLE_COUNT - 1),
      fillRatio,
      deadCenterStart,
      deadCenterEnd,
      jCurve
    )
  );

  return {
    fillRatio,
    deadCenterStart,
    deadCenterEnd,
    jCurveStrength: jCurve,
    points,
  };
}

export function projectCurve(
  points: CurvePoint[],
  { left, right, top, bottom }: PlotBounds
): ProjectedCurvePoint[] {
  const width = right - left;
  const height = bottom - top;

  return points.map((point) => ({
    ...point,
    x: left + point.position * width,
    y: bottom - point.attention * height,
  }));
}

export function curvePoints(points: ProjectedCurvePoint[]) {
  return points.map(({ x, y }) => `${x},${y}`).join(' ');
}

/* ── Smooth 100-sample SVG paths (pressure diagram panel) ───────── */

export interface CurvePaths {
  // Desktop: x = attention (right = strong), y = position (top = start).
  curvePath: string;
  fillPath: string;
  // Mobile: x = position (left = start), y = 100 - attention (top = strong).
  mobileCurvePath: string;
  mobileFillPath: string;
  minAttention: number;
}

export function buildCurvePaths(fillRatio: number): CurvePaths {
  const samples = 100;
  let minAttention = 1;
  const pts: Array<{ att: number; frac: number }> = [];

  for (let i = 0; i <= samples; i++) {
    const frac = i / samples;
    const att = attentionAt(frac, fillRatio);
    minAttention = Math.min(minAttention, att);
    pts.push({ att, frac });
  }

  const curvePath = pts
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${(p.att * 100).toFixed(1)},${(p.frac * 100).toFixed(1)}`
    )
    .join(' ');
  const fillPath = [
    'M 100,0',
    ...pts.map(
      (p) => `L ${(p.att * 100).toFixed(1)},${(p.frac * 100).toFixed(1)}`
    ),
    'L 100,100',
    'Z',
  ].join(' ');

  const mobileCurvePath = pts
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${(p.frac * 100).toFixed(1)},${(100 - p.att * 100).toFixed(1)}`
    )
    .join(' ');
  const mobileFillPath = [
    'M 0,0',
    ...pts.map(
      (p) => `L ${(p.frac * 100).toFixed(1)},${(100 - p.att * 100).toFixed(1)}`
    ),
    'L 100,0',
    'Z',
  ].join(' ');

  return { curvePath, fillPath, mobileCurvePath, mobileFillPath, minAttention };
}
