import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './CompoundQualityVisualization.module.css';

interface IterationPoint {
  x: number;
  y: number;
  label: string;
  sublabel?: string;
}

export default function CompoundQualityVisualization({
  compact = false,
  homepageMode = false,
}: PresentationAwareProps & { homepageMode?: boolean } = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  // SVG dimensions
  const width = 800;
  const height = 400;
  const startX = 120; // Left side starting point
  const endX = 720; // Right side ending point
  const centerY = height / 2;

  // Generate exponential curve paths
  const generateExponentialCurve = (direction: 'up' | 'down'): string => {
    const points: string[] = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = startX + (endX - startX) * progress;

      // Exponential growth: y = e^(kx) - 1
      // Scaled to fit our viewport
      const exponentialProgress = Math.exp(progress * 2.5) - 1;
      const maxDisplacement = 150; // Maximum vertical displacement
      const displacement =
        (exponentialProgress / (Math.exp(2.5) - 1)) * maxDisplacement;

      const y =
        direction === 'up' ? centerY - displacement : centerY + displacement;

      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }

    return points.join(' ');
  };

  // Positive curve (upward exponential) - starts at left, curves up as it goes right
  const positiveCurvePath = generateExponentialCurve('up');

  // Negative curve (downward exponential) - starts at left, curves down as it goes right
  const negativeCurvePath = generateExponentialCurve('down');

  // Helper function to calculate point on exponential curve
  const getPointOnCurve = (direction: 'up' | 'down', progress: number) => {
    const x = startX + (endX - startX) * progress;
    const exponentialProgress = Math.exp(progress * 2.5) - 1;
    const maxDisplacement = 150;
    const displacement =
      (exponentialProgress / (Math.exp(2.5) - 1)) * maxDisplacement;
    const y =
      direction === 'up' ? centerY - displacement : centerY + displacement;
    return { x, y };
  };

  // Iteration markers for positive curve (upward exponential)
  const positiveIterations: IterationPoint[] = [
    { ...getPointOnCurve('up', 0.33), label: 'Iter 1', sublabel: '10 files' },
    { ...getPointOnCurve('up', 0.66), label: 'Iter 2', sublabel: '12 files' },
    { ...getPointOnCurve('up', 1.0), label: 'Iter 3', sublabel: '14 files' },
  ];

  // Iteration markers for negative curve (downward exponential)
  const negativeIterations: IterationPoint[] = [
    { ...getPointOnCurve('down', 0.33), label: 'Iter 1', sublabel: '8g / 2b' },
    { ...getPointOnCurve('down', 0.66), label: 'Iter 2', sublabel: '6g / 4b' },
    { ...getPointOnCurve('down', 1.0), label: 'Iter 3', sublabel: '4g / 6b' },
  ];

  return (
    <div
      className={containerClassName}
      role="region"
      aria-label="Compound quality visualization showing positive and negative feedback loops"
    >
      {!compact && (
        <div className={styles.header}>
          <h4 className={styles.title}>Quality Compounds Exponentially</h4>
          <p className={styles.subtitle}>
            Each iteration amplifies the dominant pattern—good code generates
            more good code, bad code generates more bad code
          </p>
        </div>
      )}

      <div className={styles.comparisonWrapper}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Diverging exponential curves showing code quality compounding - positive and negative feedback loops"
        >
          {/* Define gradients */}
          <defs>
            <linearGradient
              id="positiveGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="var(--visual-success)"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="var(--visual-success)"
                stopOpacity="1"
              />
            </linearGradient>
            <linearGradient
              id="negativeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="var(--visual-error)"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="var(--visual-error)"
                stopOpacity="1"
              />
            </linearGradient>
            <linearGradient id="positiveFill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor="var(--visual-success)"
                stopOpacity="0.1"
              />
              <stop
                offset="100%"
                stopColor="var(--visual-success)"
                stopOpacity="0.2"
              />
            </linearGradient>
            <linearGradient id="negativeFill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor="var(--visual-error)"
                stopOpacity="0.1"
              />
              <stop
                offset="100%"
                stopColor="var(--visual-error)"
                stopOpacity="0.2"
              />
            </linearGradient>
            <marker
              id="arrowPositive"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="var(--visual-success)"
              />
            </marker>
            <marker
              id="arrowNegative"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="var(--visual-error)" />
            </marker>
          </defs>

          {/* Y-axis (left side) */}
          <line
            x1={startX}
            y1="50"
            x2={startX}
            y2={height - 50}
            className={homepageMode ? styles.homepageAxis : undefined}
            stroke={homepageMode ? undefined : 'var(--ifm-color-emphasis-300)'}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x={startX - 15}
            y="45"
            className={`${styles.axisLabel} ${homepageMode ? styles.homepageAxisLabel : ''}`}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={homepageMode ? undefined : 'var(--ifm-color-emphasis-600)'}
            transform={`rotate(-90, ${startX - 15}, 45)`}
          >
            Code Quality
          </text>

          {/* X-axis label */}
          <text
            x={width / 2}
            y={height - 15}
            className={`${styles.axisLabel} ${homepageMode ? styles.homepageAxisLabel : ''}`}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={homepageMode ? undefined : 'var(--ifm-color-emphasis-600)'}
          >
            Time / Iterations →
          </text>

          {/* Negative curve fill area */}
          <path
            d={`${negativeCurvePath} L ${endX} ${centerY} L ${startX} ${centerY} Z`}
            fill="url(#negativeFill)"
          />

          {/* Positive curve fill area */}
          <path
            d={`${positiveCurvePath} L ${endX} ${centerY} L ${startX} ${centerY} Z`}
            fill="url(#positiveFill)"
          />

          {/* Negative curve path */}
          <path
            d={negativeCurvePath}
            className={styles.curvePathNegative}
            fill="none"
            stroke="url(#negativeGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Positive curve path */}
          <path
            d={positiveCurvePath}
            className={styles.curvePathPositive}
            fill="none"
            stroke="url(#positiveGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Starting point (left side where both curves begin) */}
          <circle
            cx={startX}
            cy={centerY}
            r="7"
            className={homepageMode ? styles.homepageStartPoint : undefined}
            fill={homepageMode ? undefined : 'var(--ifm-color-emphasis-700)'}
            stroke="var(--ifm-background-color)"
            strokeWidth="2"
          />
          <text
            x={startX - 35}
            y={centerY + 5}
            className={`${styles.startLabel} ${homepageMode ? styles.homepageStartPoint : ''}`}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={homepageMode ? undefined : 'var(--ifm-color-emphasis-700)'}
          >
            Start
          </text>

          {/* Positive feedback label (upper area) */}
          <text
            x={width / 2}
            y="60"
            className={`${styles.sideLabel} ${styles.sideLabelPositive} ${homepageMode ? styles.sideLabelHomepage : ''}`}
            textAnchor="middle"
            fontWeight="600"
            fill="var(--visual-success)"
          >
            POSITIVE FEEDBACK
          </text>

          {/* Negative feedback label (lower area) */}
          <text
            x={width / 2}
            y={height - 60}
            className={`${styles.sideLabel} ${styles.sideLabelNegative} ${homepageMode ? styles.sideLabelHomepage : ''}`}
            textAnchor="middle"
            fontWeight="600"
            fill="var(--visual-error)"
          >
            NEGATIVE FEEDBACK
          </text>

          {/* Positive iteration markers */}
          {positiveIterations.map((iter, index) => (
            <g key={`positive-${index}`} className={styles.iterationGroup}>
              <circle
                cx={iter.x}
                cy={iter.y}
                r="6"
                className={styles.iterationMarkerPositive}
                fill="var(--visual-success)"
              />
              <text
                x={iter.x}
                y={iter.y - 15}
                className={styles.iterationLabel}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
              >
                {iter.label}
              </text>
              <text
                x={iter.x}
                y={iter.y - 3}
                className={styles.iterationSublabel}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ifm-color-emphasis-600)"
              >
                {iter.sublabel}
              </text>
            </g>
          ))}

          {/* Negative iteration markers */}
          {negativeIterations.map((iter, index) => (
            <g key={`negative-${index}`} className={styles.iterationGroup}>
              <circle
                cx={iter.x}
                cy={iter.y}
                r="6"
                className={styles.iterationMarkerNegative}
                fill="var(--visual-error)"
              />
              <text
                x={iter.x}
                y={iter.y + 20}
                className={styles.iterationLabel}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
              >
                {iter.label}
              </text>
              <text
                x={iter.x}
                y={iter.y + 32}
                className={styles.iterationSublabel}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ifm-color-emphasis-600)"
              >
                {iter.sublabel}
              </text>
            </g>
          ))}

          {/* Arrow at positive end - pointing upward-right */}
          <path
            d={`M ${endX - 7} ${centerY - 145} L ${endX + 13} ${centerY - 160}`}
            stroke="var(--visual-success)"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowPositive)"
          />

          {/* Arrow at negative end - pointing downward-right */}
          <path
            d={`M ${endX - 7} ${centerY + 145} L ${endX + 13} ${centerY + 160}`}
            stroke="var(--visual-error)"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowNegative)"
          />
        </svg>

        {/* Descriptions below */}
        <div className={styles.descriptionWrapper}>
          <div className={styles.descriptionPositive}>
            <strong>Positive:</strong> Good patterns compound into better code.
            Each iteration strengthens quality.
          </div>
          <div className={styles.descriptionNegative}>
            <strong>Negative:</strong> Bad patterns compound into worse code.
            Each iteration degrades quality.
          </div>
        </div>
      </div>

      {!compact && (
        <div className={styles.circuitBreakerBox}>
          <strong>Your Role as Circuit Breaker:</strong> Code review (
          <a href="/docs/practical-techniques/lesson-9-reviewing-code">
            Lesson 9
          </a>
          ) is where you intervene. Accepting bad patterns lets them enter the
          compounding cycle. Rejecting them breaks the negative feedback loop
          before it accelerates.
        </div>
      )}
    </div>
  );
}
