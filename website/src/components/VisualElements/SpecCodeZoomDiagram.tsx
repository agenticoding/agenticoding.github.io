import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './SpecCodeZoomDiagram.module.css';

export default function SpecCodeZoomDiagram({
  compact = false,
}: PresentationAwareProps = {}) {
  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;

  // Layout constants
  const viewBoxWidth = 440;
  const viewBoxHeight = 380;
  const centerX = viewBoxWidth / 2;

  const viewBox = compact
    ? '30 0 380 340'
    : `0 0 ${viewBoxWidth} ${viewBoxHeight}`;

  // Box dimensions — SPEC smaller, CODE larger
  const specBoxWidth = 160;
  const specBoxHeight = 56;
  const codeBoxWidth = 220;
  const codeBoxHeight = 68;

  // Vertical positions
  const specY = 20;
  const codeY = specY + specBoxHeight + 160;

  // Arrow curve control
  const arrowCurveOffset = 110;

  // Center text Y
  const midY = specY + specBoxHeight + 80;

  // Helper for quadratic bezier arrow paths
  const createArrowPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    curveX: number,
  ) => {
    const midPointY = (startY + endY) / 2;
    return `M ${startX} ${startY} Q ${curveX} ${midPointY} ${endX} ${endY}`;
  };

  // Left arrow (downward, cyan) — Generate: spec→code
  const leftArrow = createArrowPath(
    centerX - specBoxWidth / 2 + 8,
    specY + specBoxHeight,
    centerX - codeBoxWidth / 2 + 8,
    codeY,
    centerX - arrowCurveOffset,
  );

  // Right arrow (upward, cyan) — Extract: code→spec
  const rightArrow = createArrowPath(
    centerX + codeBoxWidth / 2 - 8,
    codeY,
    centerX + specBoxWidth / 2 - 8,
    specY + specBoxHeight,
    centerX + arrowCurveOffset,
  );

  // Annotation positions
  const leftAnnotationX = centerX - arrowCurveOffset - 10;
  const rightAnnotationX = centerX + arrowCurveOffset + 10;

  // Legend Y
  const legendY = codeY + codeBoxHeight + 30;

  return (
    <div
      className={containerClassName}
      role="img"
      aria-label="Spec-Code Zoom Diagram: Spec defines architecture and boundaries. Code handles edge cases and implementation. Left arrow generates code from spec, right arrow extracts learnings back to spec. Iterate until convergence."
    >
      <svg
        viewBox={viewBox}
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for CODE box emphasis */}
          <linearGradient
            id="sczdCodeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor="var(--visual-cyan)"
              stopOpacity="0.7"
            />
            <stop
              offset="50%"
              stopColor="var(--visual-success)"
              stopOpacity="1"
            />
            <stop
              offset="100%"
              stopColor="var(--visual-cyan)"
              stopOpacity="0.7"
            />
          </linearGradient>

          {/* Shadow for CODE box */}
          <filter
            id="sczdCodeShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="4"
              floodColor="var(--visual-cyan)"
              floodOpacity="0.15"
            />
          </filter>

          {/* Glow for AI (upward) arrows */}
          <filter
            id="sczdAiGlow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow markers */}
          <marker
            id="sczdArrowGenerate"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            className={styles.arrowMarkerGenerate}
          >
            <polygon points="0 0, 6 3, 0 6" />
          </marker>

          <marker
            id="sczdArrowExtract"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            className={styles.arrowMarkerExtract}
          >
            <polygon points="0 0, 6 3, 0 6" />
          </marker>
        </defs>

        {/* ===== SPEC BOX (Top, smaller) ===== */}
        <g className={styles.specGroup}>
          <rect
            x={centerX - specBoxWidth / 2}
            y={specY}
            width={specBoxWidth}
            height={specBoxHeight}
            rx="5"
            className={styles.layerBox}
          />
          <text
            x={centerX}
            y={specY + 24}
            className={styles.layerLabel}
            textAnchor="middle"
          >
            SPEC
          </text>
          <text
            x={centerX}
            y={specY + 40}
            className={styles.subtitleLabel}
            textAnchor="middle"
          >
            Architecture &amp; boundaries
          </text>
        </g>

        {/* ===== CODE BOX (Bottom, larger, emphasized) ===== */}
        <g className={styles.codeGroup}>
          <rect
            x={centerX - codeBoxWidth / 2}
            y={codeY}
            width={codeBoxWidth}
            height={codeBoxHeight}
            rx="6"
            className={styles.layerBoxCode}
            filter="url(#sczdCodeShadow)"
          />
          <text
            x={centerX}
            y={codeY + 28}
            className={styles.codeLabel}
            textAnchor="middle"
          >
            CODE
          </text>
          <text
            x={centerX}
            y={codeY + 46}
            className={styles.subtitleLabel}
            textAnchor="middle"
          >
            Edge cases &amp; implementation
          </text>

          {/* Source of Truth label */}
          <text
            x={centerX}
            y={codeY + codeBoxHeight + 14}
            className={styles.sourceLabel}
            textAnchor="middle"
          >
            Source of Truth
          </text>
        </g>

        {/* ===== LEFT ARROW (Generate — Purple, Downward) ===== */}
        <g className={styles.generateGroup}>
          <path
            d={leftArrow}
            className={styles.arrowGenerate}
            markerEnd="url(#sczdArrowGenerate)"
            fill="none"
          />

          {/* Label */}
          <text
            x={leftAnnotationX}
            y={midY - 12}
            className={styles.arrowLabel}
            textAnchor="end"
          >
            Generate
          </text>
        </g>

        {/* ===== RIGHT ARROW (Extract — Cyan, Upward) ===== */}
        <g className={styles.extractGroup}>
          <path
            d={rightArrow}
            className={styles.arrowExtract}
            markerEnd="url(#sczdArrowExtract)"
            fill="none"
            filter="url(#sczdAiGlow)"
          />

          {/* Label */}
          <text
            x={rightAnnotationX}
            y={midY - 12}
            className={styles.arrowLabelExtract}
            textAnchor="start"
          >
            Extract + Learn
          </text>
        </g>

        {/* ===== CENTER TEXT ===== */}
        <text
          x={centerX}
          y={midY}
          className={styles.iterateLabel}
          textAnchor="middle"
        >
          Iterate until convergence
        </text>

        {/* ===== LEGEND ===== */}
        {!compact && (
          <g className={styles.legend}>
            <line
              x1={centerX - 140}
              y1={legendY}
              x2={centerX - 125}
              y2={legendY}
              className={styles.legendLineGenerate}
            />
            <text
              x={centerX - 120}
              y={legendY + 4}
              className={styles.legendText}
            >
              Spec sharpens through contact with implementation
            </text>
          </g>
        )}
      </svg>

      {/* Description text */}
      {!compact && (
        <p className={styles.description}>
          <strong>Spec</strong> = hypothesis.{' '}
          <strong>Code</strong> = experiment.{' '}
          Each pass reveals what the previous spec missed.
        </p>
      )}
    </div>
  );
}
