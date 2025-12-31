import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './KnowledgeExpansionDiamond.module.css';

export default function KnowledgeExpansionDiamond({
  compact = false,
}: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  // Layout constants
  const viewBoxWidth = 460;
  const viewBoxHeight = 400;
  const centerX = viewBoxWidth / 2;

  // Box dimensions - consistent 1.25x progression for pleasing funnel effect
  const specBoxWidth = 140;
  const designBoxWidth = 175;
  const codeBoxWidth = 220;
  const boxHeight = 52;
  const codeBoxHeight = 68;

  // Vertical positions - increased spacing (85px gaps) for graceful curves
  const specY = 20;
  const designY = specY + boxHeight + 85;
  const codeY = designY + boxHeight + 85;

  // Arrow curve control - tighter offset keeps arrows closer to content
  const arrowCurveOffset = 90;

  // Annotation x-positions - consistent margins from arrows
  const leftAnnotationX = centerX - arrowCurveOffset - 12;
  const rightAnnotationX = centerX + arrowCurveOffset + 12;

  // Helper function for quadratic bezier arrow paths
  const createArrowPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    curveX: number
  ) => {
    const midY = (startY + endY) / 2;
    return `M ${startX} ${startY} Q ${curveX} ${midY} ${endX} ${endY}`;
  };

  // Left arrows (Traditional - downward) - start from box corners
  const leftArrow1 = createArrowPath(
    centerX - specBoxWidth / 2 + 8,
    specY + boxHeight,
    centerX - designBoxWidth / 2 + 8,
    designY,
    centerX - arrowCurveOffset
  );

  const leftArrow2 = createArrowPath(
    centerX - designBoxWidth / 2 + 8,
    designY + boxHeight,
    centerX - codeBoxWidth / 2 + 8,
    codeY,
    centerX - arrowCurveOffset
  );

  // Right arrows (AI - upward) - start from box corners, symmetric offset
  const rightArrow1 = createArrowPath(
    centerX + codeBoxWidth / 2 - 8,
    codeY,
    centerX + designBoxWidth / 2 - 8,
    designY + boxHeight,
    centerX + arrowCurveOffset
  );

  const rightArrow2 = createArrowPath(
    centerX + designBoxWidth / 2 - 8,
    designY,
    centerX + specBoxWidth / 2 - 8,
    specY + boxHeight,
    centerX + arrowCurveOffset
  );

  // Annotation Y positions - centered in arrow gaps
  const annotation1Y = specY + boxHeight + 42;
  const annotation2Y = designY + boxHeight + 42;

  // Legend Y position
  const legendY = codeY + codeBoxHeight + 32;

  return (
    <div
      className={containerClassName}
      role="img"
      aria-label="Knowledge Flow Diagram: Traditional software development expands knowledge downward from spec to code. AI coding agents enable extraction upward from code to spec—each layer appears once, with bidirectional flow."
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for code layer emphasis */}
          <linearGradient
            id="codeGlowGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor="var(--visual-workflow)"
              stopOpacity="0.7"
            />
            <stop
              offset="50%"
              stopColor="var(--visual-capability)"
              stopOpacity="1"
            />
            <stop
              offset="100%"
              stopColor="var(--visual-workflow)"
              stopOpacity="0.7"
            />
          </linearGradient>

          {/* Subtle shadow filter for CODE box */}
          <filter id="codeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="4"
              floodColor="var(--visual-workflow)"
              floodOpacity="0.15"
            />
          </filter>

          {/* Glow filter for AI arrows */}
          <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow markers - refined size */}
          <marker
            id="arrowTraditional"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            className={styles.arrowMarkerTraditional}
          >
            <polygon points="0 0, 6 3, 0 6" />
          </marker>

          <marker
            id="arrowAI"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            className={styles.arrowMarkerAI}
          >
            <polygon points="0 0, 6 3, 0 6" />
          </marker>
        </defs>

        {/* ===== BOXES ===== */}

        {/* Spec Box - Top, smallest */}
        <g className={styles.specGroup}>
          <rect
            x={centerX - specBoxWidth / 2}
            y={specY}
            width={specBoxWidth}
            height={boxHeight}
            rx="5"
            className={styles.layerBox}
          />
          <text
            x={centerX}
            y={specY + 21}
            className={styles.layerLabel}
            textAnchor="middle"
          >
            HIGH-LEVEL SPEC
          </text>
          <text
            x={centerX}
            y={specY + 38}
            className={styles.sizeLabel}
            textAnchor="middle"
          >
            ~100 lines
          </text>
        </g>

        {/* Design Box - Middle */}
        <g className={styles.designGroup}>
          <rect
            x={centerX - designBoxWidth / 2}
            y={designY}
            width={designBoxWidth}
            height={boxHeight}
            rx="5"
            className={styles.layerBox}
          />
          <text
            x={centerX}
            y={designY + 21}
            className={styles.layerLabel}
            textAnchor="middle"
          >
            DETAILED DESIGN
          </text>
          <text
            x={centerX}
            y={designY + 38}
            className={styles.sizeLabel}
            textAnchor="middle"
          >
            ~1k lines
          </text>
        </g>

        {/* Code Box - Bottom, largest, emphasized */}
        <g className={styles.codeGroup}>
          <rect
            x={centerX - codeBoxWidth / 2}
            y={codeY}
            width={codeBoxWidth}
            height={codeBoxHeight}
            rx="6"
            className={styles.layerBoxCode}
            filter="url(#codeShadow)"
          />
          <text
            x={centerX}
            y={codeY + 26}
            className={styles.codeLabel}
            textAnchor="middle"
          >
            CODE
          </text>
          <text
            x={centerX}
            y={codeY + 44}
            className={styles.sizeLabel}
            textAnchor="middle"
          >
            ~10k lines
          </text>
        </g>

        {/* Source of Truth label - below CODE box */}
        <text
          x={centerX}
          y={codeY + codeBoxHeight + 14}
          className={styles.codeSubtitle}
          textAnchor="middle"
        >
          Source of Truth
        </text>

        {/* ===== LEFT ARROWS (Traditional - Purple, Downward) ===== */}
        <g className={styles.traditionalGroup}>
          <path
            d={leftArrow1}
            className={styles.arrowTraditional}
            markerEnd="url(#arrowTraditional)"
            fill="none"
          />
          <path
            d={leftArrow2}
            className={styles.arrowTraditional}
            markerEnd="url(#arrowTraditional)"
            fill="none"
          />

          {/* Left annotations - aligned to consistent x position */}
          <text
            x={leftAnnotationX}
            y={annotation1Y - 5}
            className={styles.annotation}
            textAnchor="end"
          >
            adds: edge cases,
          </text>
          <text
            x={leftAnnotationX}
            y={annotation1Y + 9}
            className={styles.annotation}
            textAnchor="end"
          >
            constraints
          </text>

          <text
            x={leftAnnotationX}
            y={annotation2Y - 5}
            className={styles.annotation}
            textAnchor="end"
          >
            adds: implementation
          </text>
          <text
            x={leftAnnotationX}
            y={annotation2Y + 9}
            className={styles.annotation}
            textAnchor="end"
          >
            approach
          </text>
        </g>

        {/* ===== RIGHT ARROWS (AI - Cyan, Upward) ===== */}
        <g className={styles.aiGroup}>
          <path
            d={rightArrow1}
            className={styles.arrowAI}
            markerEnd="url(#arrowAI)"
            fill="none"
            filter="url(#aiGlow)"
          />
          <path
            d={rightArrow2}
            className={styles.arrowAI}
            markerEnd="url(#arrowAI)"
            fill="none"
            filter="url(#aiGlow)"
          />

          {/* Right annotations - symmetric with left */}
          <text
            x={rightAnnotationX}
            y={annotation2Y - 5}
            className={styles.annotationAI}
            textAnchor="start"
          >
            extracts: patterns,
          </text>
          <text
            x={rightAnnotationX}
            y={annotation2Y + 9}
            className={styles.annotationAI}
            textAnchor="start"
          >
            rules
          </text>

          <text
            x={rightAnnotationX}
            y={annotation1Y - 5}
            className={styles.annotationAI}
            textAnchor="start"
          >
            extracts: intent,
          </text>
          <text
            x={rightAnnotationX}
            y={annotation1Y + 9}
            className={styles.annotationAI}
            textAnchor="start"
          >
            boundaries
          </text>
        </g>

        {/* ===== LEGEND ===== */}
        <g className={styles.legend}>
          {/* Centered legend with equal spacing */}
          <circle
            cx={centerX - 95}
            cy={legendY}
            r={5}
            className={styles.legendDotTraditional}
          />
          <text x={centerX - 85} y={legendY + 4} className={styles.legendText}>
            Traditional (expansion)
          </text>

          <circle
            cx={centerX + 65}
            cy={legendY}
            r={5}
            className={styles.legendDotAI}
          />
          <text x={centerX + 75} y={legendY + 4} className={styles.legendText}>
            AI-Enabled (extraction)
          </text>
        </g>
      </svg>

      {/* Description text */}
      {!compact && (
        <p className={styles.description}>
          <strong>Traditional:</strong> Knowledge expands from spec to code.{' '}
          <br />
          <strong>AI-enabled:</strong> Knowledge can now be extracted back —
          code becomes the single source of truth.
        </p>
      )}
    </div>
  );
}
