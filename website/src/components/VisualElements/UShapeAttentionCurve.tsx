import React, { useState, useEffect, useRef } from 'react';
import styles from './UShapeAttentionCurve.module.css';

interface UShapeAttentionCurveProps {
  initialContextFill?: number; // Percentage of context window used (0-100)
}

export default function UShapeAttentionCurve({
  initialContextFill = 60,
}: UShapeAttentionCurveProps): JSX.Element {
  const [contextFill, setContextFill] = useState(initialContextFill);
  const [animatedPath, setAnimatedPath] = useState<string>('');
  const previousPathRef = useRef<string>('');
  const animationFrameRef = useRef<number | null>(null);

  // SVG dimensions
  const width = 800;
  const height = 300;
  const padding = 70;

  // Calculate curve parameters based on context fill percentage
  // More context = deeper U (worse middle attention)
  const curveDepth = 50 + (contextFill / 100) * 100; // Range: 50-150

  // Define the U-shaped curve using cubic Bézier
  // Start high (left), dip low (middle), end high (right)
  const startX = padding;
  const startY = padding;
  const endX = width - padding;
  const endY = padding;
  const middleX = width / 2;
  const middleY = padding + curveDepth;

  // Cubic Bézier path: smooth curve through three points
  const curvePath = `
    M ${startX},${startY}
    C ${startX + 100},${startY} ${middleX - 100},${middleY} ${middleX},${middleY}
    C ${middleX + 100},${middleY} ${endX - 100},${startY} ${endX},${endY}
  `.trim();

  // Animate path morphing for Safari compatibility
  useEffect(() => {
    // Initialize on first render
    if (!previousPathRef.current) {
      previousPathRef.current = curvePath;
      setAnimatedPath(curvePath);
      return;
    }

    // If path hasn't changed, skip animation
    if (previousPathRef.current === curvePath) {
      return;
    }

    // Parse path coordinates using regex
    const parsePathCoords = (path: string): number[] => {
      const matches = path.match(/[\d.]+/g);
      return matches ? matches.map(Number) : [];
    };

    const startCoords = parsePathCoords(previousPathRef.current);
    const endCoords = parsePathCoords(curvePath);

    // Animation parameters
    const duration = 600; // 600ms to match CSS timing
    const startTime = performance.now();

    // Cubic bezier easing function matching CSS cubic-bezier(0.4, 0, 0.2, 1)
    const cubicBezier = (
      p1x: number,
      p1y: number,
      p2x: number,
      p2y: number
    ) => {
      // Binary search to find t for given x
      const getTForX = (x: number): number => {
        let t = x;
        for (let i = 0; i < 8; i++) {
          const slope =
            3 * p1x * (1 - t) ** 2 +
            6 * (p2x - p1x) * t * (1 - t) +
            3 * (1 - p2x) * t ** 2;
          if (slope === 0) break;
          const currentX =
            3 * (1 - t) ** 2 * t * p1x + 3 * (1 - t) * t ** 2 * p2x + t ** 3;
          t -= (currentX - x) / slope;
        }
        return t;
      };

      return (x: number): number => {
        if (x === 0 || x === 1) return x;
        const t = getTForX(x);
        return 3 * (1 - t) ** 2 * t * p1y + 3 * (1 - t) * t ** 2 * p2y + t ** 3;
      };
    };

    const easing = cubicBezier(0.4, 0, 0.2, 1);

    // Animation loop
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      // Interpolate coordinates
      const interpolatedCoords = startCoords.map((start, i) => {
        const end = endCoords[i];
        return start + (end - start) * easedProgress;
      });

      // Reconstruct path string
      const [m1, m2, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12] =
        interpolatedCoords;
      const interpolatedPath = `M ${m1},${m2} C ${c1},${c2} ${c3},${c4} ${c5},${c6} C ${c7},${c8} ${c9},${c10} ${c11},${c12}`;

      setAnimatedPath(interpolatedPath);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        previousPathRef.current = curvePath;
      }
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when curvePath changes
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [curvePath]);

  // Area fill path (curve + bottom edge for filled area)
  const areaPath = `
    ${animatedPath || curvePath}
    L ${endX},${height - padding}
    L ${startX},${height - padding}
    Z
  `.trim();

  // Define gradient for attention levels
  const gradientId = 'attentionGradient';

  const contextLevels = [
    { label: 'Light', value: 30 },
    { label: 'Medium', value: 60 },
    { label: 'Heavy', value: 90 },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Context Window Attention Curve</h4>
        <span className={styles.subtitle}>
          Information at the beginning and end gets strong attention, middle
          gets skimmed
        </span>
      </div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="U-shaped attention curve showing high attention at start and end, low attention in middle"
      >
        {/* Define gradient for the curve */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor="var(--visual-capability)"
              stopOpacity="0.8"
            />
            <stop
              offset="50%"
              stopColor="var(--visual-error)"
              stopOpacity="0.6"
            />
            <stop
              offset="100%"
              stopColor="var(--visual-capability)"
              stopOpacity="0.8"
            />
          </linearGradient>

          {/* Gradient for area fill */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stopColor="var(--visual-workflow)"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="var(--visual-workflow)"
              stopOpacity="0.05"
            />
          </linearGradient>
        </defs>

        {/* Background grid for reference */}
        <line
          x1={startX}
          y1={height - padding}
          x2={endX}
          y2={height - padding}
          stroke="var(--ifm-color-emphasis-300)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Filled area under curve */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          className={styles.areaFill}
        />

        {/* The U-shaped curve line */}
        <path
          d={animatedPath || curvePath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeLinecap="round"
          className={styles.curve}
        />

        {/* Attention level markers */}
        {/* Start - High attention */}
        <circle
          cx={startX}
          cy={startY}
          r="8"
          fill="var(--visual-capability)"
          className={styles.marker}
        />

        {/* Middle - Low attention */}
        <circle
          cx={middleX}
          cy={middleY}
          r="8"
          fill="var(--visual-error)"
          className={styles.marker}
        />

        {/* End - High attention */}
        <circle
          cx={endX}
          cy={endY}
          r="8"
          fill="var(--visual-capability)"
          className={styles.marker}
        />

        {/* Labels */}
        <text
          x={startX}
          y={height - padding + 30}
          textAnchor="middle"
          className={styles.label}
        >
          Start
        </text>
        <text
          x={startX}
          y={height - padding + 50}
          textAnchor="middle"
          className={styles.sublabel}
        >
          (Primacy)
        </text>

        <text
          x={middleX}
          y={height - padding + 30}
          textAnchor="middle"
          className={styles.label}
        >
          Middle
        </text>
        <text
          x={middleX}
          y={height - padding + 50}
          textAnchor="middle"
          className={styles.sublabel}
        >
          (Lost in Middle)
        </text>

        <text
          x={endX}
          y={height - padding + 30}
          textAnchor="middle"
          className={styles.label}
        >
          End
        </text>
        <text
          x={endX}
          y={height - padding + 50}
          textAnchor="middle"
          className={styles.sublabel}
        >
          (Recency)
        </text>

        {/* Y-axis label */}
        <text
          x={padding - 40}
          y={padding}
          textAnchor="middle"
          className={styles.axisLabel}
        >
          High
        </text>
        <text
          x={padding - 40}
          y={padding}
          textAnchor="middle"
          className={styles.axisLabel}
          style={{ transform: `translateY(${middleY - padding}px)` }}
        >
          Low
        </text>
        <text
          x={padding - 40}
          y={height - padding}
          textAnchor="middle"
          className={styles.axisLabel}
        >
          ↑
        </text>
        <text
          x={padding - 40}
          y={height - padding + 15}
          textAnchor="middle"
          className={styles.axisLabelSmall}
        >
          Attention
        </text>
      </svg>

      <div className={styles.controls}>
        <span className={styles.controlLabel}>Context Usage:</span>
        {contextLevels.map((level) => (
          <button
            key={level.value}
            className={`${styles.button} ${
              contextFill === level.value ? styles.buttonActive : ''
            }`}
            onClick={() => setContextFill(level.value)}
          >
            {level.label}
          </button>
        ))}
      </div>

      <div className={styles.explanation}>
        <strong>The U-Curve Effect:</strong> As context usage increases, the
        attention drop in the middle becomes more pronounced. With light usage,
        degradation is minimal. With medium usage, the U-curve becomes
        noticeable. With heavy usage, only the beginning and end are reliably
        processed.
      </div>
    </div>
  );
}
