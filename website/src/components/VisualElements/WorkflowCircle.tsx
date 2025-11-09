import React from 'react';
import styles from './WorkflowCircle.module.css';

interface Phase {
  name: string;
  x: number;
  y: number;
  angle: number;
}

interface Connection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface WorkflowCircleProps {
  compact?: boolean;
}

export default function WorkflowCircle({ compact = false }: WorkflowCircleProps) {
  const centerX = 250;
  const centerY = 250;
  const radius = 170;
  const nodeRadius = 60;

  // Calculate positions for each phase (clockwise starting from top)
  const phases: Phase[] = [
    { name: 'RESEARCH', x: centerX, y: centerY - radius, angle: -90 }, // Top
    { name: 'PLAN', x: centerX + radius, y: centerY, angle: 0 }, // Right
    { name: 'EXECUTE', x: centerX, y: centerY + radius, angle: 90 }, // Bottom
    { name: 'VALIDATE', x: centerX - radius, y: centerY, angle: 180 }, // Left
  ];

  // Define edge connection points for each arrow
  const connections: Connection[] = [
    // Research → Plan: right edge of Research to top edge of Plan
    {
      startX: phases[0].x + nodeRadius,
      startY: phases[0].y,
      endX: phases[1].x,
      endY: phases[1].y - nodeRadius - 5,
    },
    // Plan → Execute: bottom edge of Plan to right edge of Execute
    {
      startX: phases[1].x,
      startY: phases[1].y + nodeRadius,
      endX: phases[2].x + nodeRadius + 5,
      endY: phases[2].y,
    },
    // Execute → Validate: left edge of Execute to bottom edge of Validate
    {
      startX: phases[2].x - nodeRadius,
      startY: phases[2].y,
      endX: phases[3].x,
      endY: phases[3].y + nodeRadius + 5,
    },
    // Validate → Research: top edge of Validate to left edge of Research
    {
      startX: phases[3].x,
      startY: phases[3].y - nodeRadius,
      endX: phases[0].x - nodeRadius - 20,
      endY: phases[0].y,
    },
  ];

  // Create arrow paths between phases
  const createArrowPath = (connection: Connection, index: number): string => {
    const { startX, startY, endX, endY } = connection;

    // Calculate control points for curved arrows on the outer ring
    // Use the midpoint between start and end angles, pushed outward
    const outerRadius = radius + 50;

    // Calculate angles for start and end points
    const startAngle = Math.atan2(startY - centerY, startX - centerX);
    const endAngle = Math.atan2(endY - centerY, endX - centerX);

    // Calculate the mid-angle (going clockwise)
    let midAngle = (startAngle + endAngle) / 2;

    // Adjust for angle wrapping and ensure clockwise direction
    if (endAngle < startAngle) {
      midAngle = (startAngle + endAngle + 2 * Math.PI) / 2;
    }

    // For the last arrow (Validate→Research, wrapping around top-left)
    if (index === 3) {
      midAngle = Math.PI * 1.25; // 225 degrees (top-left)
    }

    const controlX = centerX + outerRadius * Math.cos(midAngle);
    const controlY = centerY + outerRadius * Math.sin(midAngle);

    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  };

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''}`}
      role="img"
      aria-label="Four-phase iterative workflow diagram showing Research, Plan, Execute, and Validate phases in a continuous cycle"
    >
      <svg
        viewBox="0 0 500 500"
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Define arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            className={styles.arrowMarker}
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>
          <marker
            id="arrowhead-dashed"
            markerWidth="10"
            markerHeight="10"
            refX="2"
            refY="3"
            orient="auto"
            className={styles.arrowMarkerDashed}
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>
        </defs>

        {/* Background circle for visual structure */}
        {/*<circle
          cx={centerX}
          cy={centerY}
          r={radius + 50}
          className={styles.backgroundCircle}
          fill="none"
        />*/}

        {/* Arrow paths connecting phases */}
        {connections.map((connection, index) => {
          const isLastArrow = index === connections.length - 1;

          return (
            <path
              key={`arrow-${index}`}
              d={createArrowPath(connection, index)}
              className={
                isLastArrow ? styles.arrowPathDashed : styles.arrowPath
              }
              markerEnd={
                isLastArrow ? 'url(#arrowhead-dashed)' : 'url(#arrowhead)'
              }
              fill="none"
            />
          );
        })}

        {/* Phase nodes */}
        {phases.map((phase) => (
          <g key={phase.name} className={styles.phaseGroup}>
            {/* Phase circle */}
            <circle
              cx={phase.x}
              cy={phase.y}
              r={nodeRadius}
              className={styles.phaseCircle}
            />

            {/* Phase label */}
            <text
              x={phase.x}
              y={phase.y}
              className={styles.phaseText}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {phase.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Text description for additional context */}
      {!compact && (
        <p className={styles.description}>
          Each phase flows into the next in a continuous cycle. After validation,
          iterate back to research as needed to refine and improve.
        </p>
      )}
    </div>
  );
}
