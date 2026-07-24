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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getDotLayers(
  position: number,
  deadCenterStart: number,
  deadCenterEnd: number,
  jCurveStrength: number
) {
  if (position >= deadCenterStart && position <= deadCenterEnd) {
    return { danger: true, cyanOpacity: 0 };
  }

  if (position >= 0.8) return { danger: false, cyanOpacity: 1 };
  if (position <= 0.2)
    return { danger: false, cyanOpacity: 1 - jCurveStrength };
  return { danger: false, cyanOpacity: 0 };
}

function createCurvePoint(
  position: number,
  fillRatio: number,
  deadCenterStart: number,
  deadCenterEnd: number,
  jCurveStrength: number
): CurvePoint {
  const distanceFromCenter = 1 - Math.abs(position - 0.5) * 2;
  const primacyDecay = (1 - position) * jCurveStrength * 0.3;
  const drop = clamp(
    distanceFromCenter ** 2 * fillRatio * 0.85 + primacyDecay,
    0,
    0.95
  );

  return {
    position,
    attention: 1 - drop,
    ...getDotLayers(position, deadCenterStart, deadCenterEnd, jCurveStrength),
  };
}

function createCurvePoints(
  fillRatio: number,
  deadCenterStart: number,
  deadCenterEnd: number,
  jCurveStrength: number
) {
  return Array.from({ length: SAMPLE_COUNT }, (_, index) =>
    createCurvePoint(
      index / (SAMPLE_COUNT - 1),
      fillRatio,
      deadCenterStart,
      deadCenterEnd,
      jCurveStrength
    )
  );
}

export function createAttentionCurve(contextFill: number): AttentionCurve {
  const fillRatio = clamp(contextFill, 0, 100) / 100;
  const deadCenterHalf = fillRatio * 0.15;
  const deadCenterStart = 0.5 - deadCenterHalf;
  const deadCenterEnd = 0.5 + deadCenterHalf;
  const jCurveStrength = Math.max(0, fillRatio - 0.5) * 2;
  const points = createCurvePoints(
    fillRatio,
    deadCenterStart,
    deadCenterEnd,
    jCurveStrength
  );

  return { fillRatio, deadCenterStart, deadCenterEnd, jCurveStrength, points };
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
