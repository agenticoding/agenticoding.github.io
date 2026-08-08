import React, { useId, useState } from 'react';
import { ResponsiveDiagram } from './ResponsiveDiagram';
import styles from './UShapeAttentionCurve.module.css';
import rangeStyles from './RangeControl.module.css';
import {
  createAttentionCurve,
  curvePoints,
  projectCurve,
  type AttentionCurve,
  type PlotBounds,
  type ProjectedCurvePoint,
} from './attentionModel';
import regionStyles from './contextRegions.module.css';
import { ZONE_FRACTIONS, ZONE_LABELS, ZONE_LABEL_FILLS } from './contextZones';

interface UShapeAttentionCurveProps {
  initialContextFill?: number;
}

const DESKTOP_PLOT: PlotBounds = { left: 60, right: 760, top: 30, bottom: 260 };
const MOBILE_PLOT: PlotBounds = { left: 40, right: 316, top: 40, bottom: 176 };
const PRIMACY_END = ZONE_FRACTIONS.primacyEnd;
const RECENCY_START = ZONE_FRACTIONS.recencyStart;

function getSeverity(contextFill: number) {
  if (contextFill <= 20) {
    return {
      tier: 'MANAGEABLE',
      desc: 'middle receives moderate attention',
      mobileDesc: 'middle still usable',
      color: 'var(--visual-success)',
    };
  }
  if (contextFill <= 50) {
    return {
      tier: 'SIGNIFICANT',
      desc: 'middle content often missed on inferential tasks',
      mobileDesc: 'middle drops first',
      color: 'var(--visual-warning)',
    };
  }
  return {
    tier: 'SEVERE',
    desc: 'middle invisible — only recency remains reliable',
    mobileDesc: 'recency dominates',
    color: 'var(--visual-error)',
  };
}

function ZoneBackground({
  curve,
  plot,
}: {
  curve: AttentionCurve;
  plot: PlotBounds;
}) {
  const width = plot.right - plot.left;
  const x = (position: number) => plot.left + position * width;
  const zones = [
    [0, PRIMACY_END, 'var(--surface-muted)'],
    [0, PRIMACY_END, 'var(--visual-bg-cyan)', 1 - curve.jCurveStrength],
    [PRIMACY_END, curve.deadCenterStart, 'var(--surface-muted)'],
    [curve.deadCenterStart, curve.deadCenterEnd, 'var(--visual-bg-error)'],
    [curve.deadCenterEnd, RECENCY_START, 'var(--surface-muted)'],
    [RECENCY_START, 1, 'var(--visual-bg-cyan)'],
  ] as const;

  return zones.map(([start, end, fill, opacity], index) => (
    <rect
      key={index}
      x={x(start)}
      y={plot.top}
      width={x(end) - x(start)}
      height={plot.bottom - plot.top}
      fill={fill}
      opacity={opacity}
    />
  ));
}

function CurveDots({
  points,
  size,
}: {
  points: ProjectedCurvePoint[];
  size: number;
}) {
  return (
    <>
      {points.map((point) => (
        <g key={point.position}>
          <rect
            x={point.x - size / 2}
            y={point.y - size / 2}
            width={size}
            height={size}
            className={point.danger ? styles.dotDanger : styles.dot}
          />
          {!point.danger && point.cyanOpacity > 0 && (
            <rect
              x={point.x - size / 2}
              y={point.y - size / 2}
              width={size}
              height={size}
              className={styles.dotCyan}
              opacity={point.cyanOpacity}
            />
          )}
        </g>
      ))}
    </>
  );
}

export default function UShapeAttentionCurve({
  initialContextFill = 30,
}: UShapeAttentionCurveProps) {
  const [contextFill, setContextFill] = useState(
    Math.max(0, Math.min(100, initialContextFill))
  );
  const sliderMarksId = useId();
  const curve = createAttentionCurve(contextFill);
  const desktopPoints = projectCurve(curve.points, DESKTOP_PLOT);
  const mobilePoints = projectCurve(curve.points, MOBILE_PLOT);
  const severity = getSeverity(contextFill);
  const desktopZoneWidth = curve.deadCenterEnd - curve.deadCenterStart;
  const desktopAnnotationVisible = desktopZoneWidth >= 0.09;
  const desktopDescriptionVisible = desktopZoneWidth >= 0.18;
  const desktopZoneCenter =
    DESKTOP_PLOT.left +
    ((curve.deadCenterStart + curve.deadCenterEnd) / 2) *
      (DESKTOP_PLOT.right - DESKTOP_PLOT.left);

  return (
    <div className={styles.container}>
      <ResponsiveDiagram
        breakpoint="560px"
        mode="viewport"
        ariaLabel="Attention curve showing high attention at the start and end of a context window and lower attention in the middle"
        desktop={
          <svg
            className={`${styles.svg} ${styles.desktopDiagram}`}
            viewBox="0 0 800 320"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Attention curve showing high attention at the start and end of a context window and lower attention in the middle"
          >
            <ZoneBackground curve={curve} plot={DESKTOP_PLOT} />
            <line
              x1={DESKTOP_PLOT.left}
              y1={DESKTOP_PLOT.top}
              x2={DESKTOP_PLOT.left}
              y2={DESKTOP_PLOT.bottom}
              className={styles.axis}
            />
            <line
              x1={DESKTOP_PLOT.left}
              y1={DESKTOP_PLOT.bottom}
              x2={DESKTOP_PLOT.right}
              y2={DESKTOP_PLOT.bottom}
              className={styles.axis}
            />
            <polyline
              points={curvePoints(desktopPoints)}
              className={styles.curveLine}
            />
            <CurveDots points={desktopPoints} size={10} />

            <text
              x={DESKTOP_PLOT.left - 8}
              y={DESKTOP_PLOT.top + 4}
              textAnchor="end"
              className={styles.axisLabel}
            >
              High
            </text>
            <text
              x={DESKTOP_PLOT.left - 8}
              y={DESKTOP_PLOT.bottom}
              textAnchor="end"
              className={styles.axisLabel}
            >
              Low
            </text>
            <text
              x={
                DESKTOP_PLOT.left +
                (PRIMACY_END / 2) * (DESKTOP_PLOT.right - DESKTOP_PLOT.left)
              }
              y={DESKTOP_PLOT.bottom + 22}
              textAnchor="middle"
              className={regionStyles.zoneLabel}
              fill={ZONE_LABEL_FILLS.primacy}
            >
              {ZONE_LABELS.primacy}
            </text>
            <text
              x={410}
              y={DESKTOP_PLOT.bottom + 22}
              textAnchor="middle"
              className={regionStyles.zoneLabel}
              fill={ZONE_LABEL_FILLS.middle}
            >
              {ZONE_LABELS.middle}
            </text>
            <text
              x={
                DESKTOP_PLOT.left +
                ((1 + RECENCY_START) / 2) *
                  (DESKTOP_PLOT.right - DESKTOP_PLOT.left)
              }
              y={DESKTOP_PLOT.bottom + 22}
              textAnchor="middle"
              className={regionStyles.zoneLabel}
              fill={ZONE_LABEL_FILLS.recency}
            >
              {ZONE_LABELS.recency}
            </text>

            {desktopAnnotationVisible && (
              <text
                x={desktopZoneCenter}
                y={DESKTOP_PLOT.top + 16}
                textAnchor="middle"
                className={styles.zoneAnnotation}
              >
                <tspan
                  fill={severity.color}
                  className={styles.zoneAnnotationTier}
                >
                  {severity.tier}
                </tspan>
                {desktopDescriptionVisible && (
                  <tspan
                    x={desktopZoneCenter}
                    dy="14"
                    className={styles.zoneAnnotationDesc}
                  >
                    {severity.desc}
                  </tspan>
                )}
              </text>
            )}
          </svg>
        }
        mobile={
          <svg
            className={`${styles.svg} ${styles.mobileDiagram}`}
            viewBox="0 0 340 288"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Attention curve from context start to end: ${severity.tier.toLowerCase()}, ${severity.mobileDesc}`}
          >
            <text x={MOBILE_PLOT.left} y={18} className={styles.mobileHeading}>
              ATTENTION
            </text>
            <text
              x={MOBILE_PLOT.right}
              y={18}
              textAnchor="end"
              className={styles.axisLabel}
            >
              HIGH → LOW
            </text>
            <ZoneBackground curve={curve} plot={MOBILE_PLOT} />
            <line
              x1={MOBILE_PLOT.left}
              y1={MOBILE_PLOT.top}
              x2={MOBILE_PLOT.left}
              y2={MOBILE_PLOT.bottom}
              className={styles.axis}
            />
            <line
              x1={MOBILE_PLOT.left}
              y1={MOBILE_PLOT.bottom}
              x2={MOBILE_PLOT.right}
              y2={MOBILE_PLOT.bottom}
              className={styles.axis}
            />
            <polyline
              points={curvePoints(mobilePoints)}
              className={styles.curveLine}
            />
            <CurveDots points={mobilePoints} size={8} />

            <text
              x={MOBILE_PLOT.left - 8}
              y={MOBILE_PLOT.top + 4}
              textAnchor="end"
              className={styles.axisLabel}
            >
              High
            </text>
            <text
              x={MOBILE_PLOT.left - 8}
              y={MOBILE_PLOT.bottom}
              textAnchor="end"
              className={styles.axisLabel}
            >
              Low
            </text>
            <text
              x={
                MOBILE_PLOT.left +
                (PRIMACY_END / 2) * (MOBILE_PLOT.right - MOBILE_PLOT.left)
              }
              y={200}
              textAnchor="middle"
              className={regionStyles.zoneLabel}
              fill={ZONE_LABEL_FILLS.primacy}
            >
              {ZONE_LABELS.primacy}
            </text>
            <text
              x={178}
              y={200}
              textAnchor="middle"
              className={regionStyles.zoneLabel}
              fill={ZONE_LABEL_FILLS.middle}
            >
              {ZONE_LABELS.middle}
            </text>
            <text
              x={
                MOBILE_PLOT.left +
                ((1 + RECENCY_START) / 2) *
                  (MOBILE_PLOT.right - MOBILE_PLOT.left)
              }
              y={200}
              textAnchor="middle"
              className={regionStyles.zoneLabel}
              fill={ZONE_LABEL_FILLS.recency}
            >
              {ZONE_LABELS.recency}
            </text>
            <text
              x={178}
              y={220}
              textAnchor="middle"
              className={styles.mobileAxisTitle}
            >
              CONTEXT POSITION →
            </text>
            <text
              x={MOBILE_PLOT.left}
              y={248}
              className={styles.mobileSeverityTier}
            >
              <tspan fill={severity.color}>{severity.tier}</tspan>
              <tspan dx="8" className={styles.mobileSeverityDesc}>
                {severity.mobileDesc}
              </tspan>
            </text>
          </svg>
        }
      />

      <div className={rangeStyles.row}>
        <span className={rangeStyles.label}>Context Fill</span>
        <div className={rangeStyles.control}>
          <input
            type="range"
            min={0}
            max={100}
            value={contextFill}
            onChange={(event) => setContextFill(Number(event.target.value))}
            list={sliderMarksId}
            className={rangeStyles.slider}
            aria-label="Context fill percentage"
            aria-valuetext={`${contextFill}%, ${severity.tier}: ${severity.desc}`}
          />
          <datalist id={sliderMarksId}>
            <option value="0" label="0%" />
            <option value="50" label="50%" />
            <option value="100" label="100%" />
          </datalist>
          <div className={rangeStyles.marks} aria-hidden="true">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        <span className={rangeStyles.value}>{contextFill}%</span>
      </div>
    </div>
  );
}
