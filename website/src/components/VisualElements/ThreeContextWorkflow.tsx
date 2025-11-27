import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './ThreeContextWorkflow.module.css';

interface ThreeContextWorkflowProps extends PresentationAwareProps {
  vertical?: boolean;
}

interface ContextData {
  id: string;
  title: string;
  label: string;
  description: string;
}

const CONTEXTS: ContextData[] = [
  {
    id: 'A',
    title: 'Context A',
    label: 'Write Code',
    description: 'Research patterns, plan, execute',
  },
  {
    id: 'B',
    title: 'Context B',
    label: 'Write Tests',
    description: 'Independent test derivation',
  },
  {
    id: 'C',
    title: 'Context C',
    label: 'Triage Failures',
    description: 'Objective diagnostic analysis',
  },
];

function VerticalLayout() {
  const boxWidth = 280;
  const boxHeight = 80;
  const boxGap = 50;
  const centerX = 180;
  const startY = 40;
  const viewBoxWidth = 360;
  const viewBoxHeight = startY + 3 * boxHeight + 2 * boxGap + 40;

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={styles.svg}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrowhead-vertical"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="1.5"
          orient="auto"
          className={styles.arrowMarker}
        >
          <polygon points="0 0, 5 1.5, 0 3" />
        </marker>
      </defs>

      {/* Arrows connecting contexts */}
      {[0, 1].map((i) => {
        const startYPos = startY + i * (boxHeight + boxGap) + boxHeight + 5;
        const endYPos = startY + (i + 1) * (boxHeight + boxGap) - 12;

        return (
          <line
            key={`arrow-${i}`}
            x1={centerX}
            y1={startYPos}
            x2={centerX}
            y2={endYPos}
            className={styles.arrow}
            markerEnd="url(#arrowhead-vertical)"
          />
        );
      })}

      {/* Context boxes */}
      {CONTEXTS.map((context, index) => {
        const y = startY + index * (boxHeight + boxGap);
        return (
          <g
            key={context.id}
            className={styles.contextGroup}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <rect
              x={centerX - boxWidth / 2}
              y={y}
              width={boxWidth}
              height={boxHeight}
              rx="12"
              className={styles.contextBox}
            />
            <text
              x={centerX}
              y={y + 30}
              className={styles.contextTitle}
              textAnchor="middle"
            >
              {context.title}
            </text>
            <text
              x={centerX}
              y={y + 55}
              className={styles.contextLabel}
              textAnchor="middle"
            >
              {context.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HorizontalLayout({ compact }: { compact: boolean }) {
  const boxWidth = 550;
  const boxHeight = 280;
  const boxGap = 150;
  const startX = 80;
  const centerY = 300;
  const viewBoxWidth = startX + 3 * boxWidth + 2 * boxGap + 80;
  const viewBoxHeight = 600;

  const contexts = CONTEXTS.map((ctx, i) => ({
    ...ctx,
    x: startX + i * (boxWidth + boxGap),
  }));

  return (
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
          <rect
            x={context.x}
            y={centerY - boxHeight / 2}
            width={boxWidth}
            height={boxHeight}
            rx="16"
            className={styles.contextBox}
          />

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
  );
}

export default function ThreeContextWorkflow({
  compact = false,
  vertical = false,
}: ThreeContextWorkflowProps = {}) {
  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''} ${vertical ? styles.vertical : ''} three-context-workflow`}
      role="img"
      aria-label="Three-context workflow showing separated contexts for writing code, tests, and triage to prevent shared assumptions"
    >
      {vertical ? <VerticalLayout /> : <HorizontalLayout compact={compact} />}

      {!compact && !vertical && (
        <p className={styles.description}>
          Each context operates independently with fresh state, preventing
          shared assumptions and bias between code, tests, and diagnostic
          analysis.
        </p>
      )}
    </div>
  );
}
