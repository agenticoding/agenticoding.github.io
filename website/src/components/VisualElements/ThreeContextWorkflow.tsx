import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './ThreeContextWorkflow.module.css';

interface Context {
  id: string;
  title: string;
  label: string;
  description: string;
  x: number;
}

export default function ThreeContextWorkflow({
  compact = false,
}: PresentationAwareProps = {}) {
  const boxWidth = 550;
  const boxHeight = 280;
  const boxGap = 150;
  const startX = 80;
  const centerY = 300;

  const contexts: Context[] = [
    {
      id: 'A',
      title: 'Context A',
      label: 'Write Code',
      description: 'Research patterns, plan, execute',
      x: startX,
    },
    {
      id: 'B',
      title: 'Context B',
      label: 'Write Tests',
      description: 'Independent test derivation',
      x: startX + boxWidth + boxGap,
    },
    {
      id: 'C',
      title: 'Context C',
      label: 'Triage Failures',
      description: 'Objective diagnostic analysis',
      x: startX + 2 * (boxWidth + boxGap),
    },
  ];

  const viewBoxWidth = startX + 3 * boxWidth + 2 * boxGap + 80;
  const viewBoxHeight = 600;

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''} three-context-workflow`}
      role="img"
      aria-label="Three-context workflow showing separated contexts for writing code, tests, and triage to prevent shared assumptions"
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrowhead-three-context"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            className={styles.arrowMarker}
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>

          {/* Dashed pattern for separation barriers */}
          <pattern
            id="barrier-pattern"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="5"
              y1="0"
              x2="5"
              y2="10"
              className={styles.barrierLine}
              strokeDasharray="4 4"
            />
          </pattern>
        </defs>

        {/* Separation barriers between contexts */}
        {[0, 1].map((i) => {
          const barrierX = contexts[i].x + boxWidth + boxGap / 2;
          return (
            <line
              key={`barrier-${i}`}
              x1={barrierX}
              y1={centerY - boxHeight / 2 - 20}
              x2={barrierX}
              y2={centerY + boxHeight / 2 + 20}
              className={styles.barrier}
              strokeDasharray="12 8"
            />
          );
        })}

        {/* Arrows connecting contexts */}
        {[0, 1].map((i) => {
          const arrowStartX = contexts[i].x + boxWidth + 10;
          const arrowEndX = contexts[i + 1].x - 10;
          const arrowY = centerY;

          return (
            <line
              key={`arrow-${i}`}
              x1={arrowStartX}
              y1={arrowY}
              x2={arrowEndX}
              y2={arrowY}
              className={styles.arrow}
              markerEnd="url(#arrowhead-three-context)"
            />
          );
        })}

        {/* Context boxes */}
        {contexts.map((context, index) => (
          <g
            key={context.id}
            className={styles.contextGroup}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            {/* Box background */}
            <rect
              x={context.x}
              y={centerY - boxHeight / 2}
              width={boxWidth}
              height={boxHeight}
              rx="16"
              className={styles.contextBox}
            />

            {/* Title and Label combined */}
            <text
              x={context.x + boxWidth / 2}
              y={centerY - 70}
              className={styles.contextTitle}
              textAnchor="middle"
            >
              {context.title}
            </text>

            <text
              x={context.x + boxWidth / 2}
              y={centerY + 20}
              className={styles.contextLabel}
              textAnchor="middle"
            >
              {context.label}
            </text>

            {/* Description - hidden in compact mode */}
            {!compact && (
              <text
                x={context.x + boxWidth / 2}
                y={centerY + 50}
                className={styles.contextDescription}
                textAnchor="middle"
              >
                {context.description}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Additional context description */}
      {!compact && (
        <p className={styles.description}>
          Each context operates independently with fresh state, preventing
          shared assumptions and bias between code, tests, and diagnostic
          analysis.
        </p>
      )}
    </div>
  );
}
