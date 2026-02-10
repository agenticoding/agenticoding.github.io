import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './SystemFlowDiagram.module.css';

interface FlowStep {
  id: string;
  label: string;
}

interface FlowPhase {
  id: string;
  steps: FlowStep[]; // Multiple steps = concurrent execution
  x: number;
}

interface ExitMarker {
  fromStep: string;
  code: string;
  type: 'error' | 'success';
}

interface SystemFlowDiagramProps extends PresentationAwareProps {
  phases?: FlowPhase[];
  exitMarkers?: ExitMarker[];
}

const DEFAULT_PHASES: FlowPhase[] = [
  { id: 'receive', steps: [{ id: 'receive', label: 'Receive' }], x: 60 },
  {
    id: 'process',
    steps: [
      { id: 'validate', label: 'Validate' },
      { id: 'enrich', label: 'Enrich' },
    ],
    x: 260,
  },
  { id: 'store', steps: [{ id: 'store', label: 'Store' }], x: 460 },
];

const DEFAULT_EXIT_MARKERS: ExitMarker[] = [
  { fromStep: 'validate', code: '400', type: 'error' },
  { fromStep: 'store', code: '500', type: 'error' },
];

const BOX_WIDTH = 140;
const BOX_HEIGHT = 56;
const CONCURRENT_STEP_GAP = 12;
const CENTER_Y = 80;
const EXIT_Y = 200;
const VIEWBOX_HEIGHT = 240;
const VIEWBOX_PADDING = 30;
const STROKE_WIDTH = 3;
const HALF_STROKE = STROKE_WIDTH / 2;
const ARROW_GAP = 8; // Gap between box edges and arrow start/end

// Terminal (checkmark circle)
const TERMINAL_CIRCLE_OFFSET = 85;
const TERMINAL_CIRCLE_RADIUS = 22;
const TERMINAL_ARROW_END = TERMINAL_CIRCLE_OFFSET - TERMINAL_CIRCLE_RADIUS - ARROW_GAP; // 55

// Box styling
const BOX_CORNER_RADIUS = 8;
const CHECKMARK_Y_OFFSET = 7;

// Exit markers
const EXIT_START_PADDING = 5;
const EXIT_PILL_WIDTH = 56;
const EXIT_PILL_HEIGHT = 32;
const EXIT_PILL_RADIUS = 16;
const EXIT_PILL_GAP = 18;

export default function SystemFlowDiagram({
  compact = false,
  phases = DEFAULT_PHASES,
  exitMarkers = DEFAULT_EXIT_MARKERS,
}: SystemFlowDiagramProps = {}) {
  // Calculate content bounds for tight viewBox
  const contentLeft = Math.min(...phases.map((p) => p.x));
  const lastPhase = phases[phases.length - 1];
  const contentRight =
    lastPhase.x + BOX_WIDTH + TERMINAL_CIRCLE_OFFSET + TERMINAL_CIRCLE_RADIUS;
  const viewBoxX = contentLeft - VIEWBOX_PADDING;
  const viewBoxWidth = contentRight - contentLeft + 2 * VIEWBOX_PADDING;

  // Find the phase and step for a given step ID
  const findStepLocation = (stepId: string) => {
    for (const phase of phases) {
      const stepIndex = phase.steps.findIndex((s) => s.id === stepId);
      if (stepIndex !== -1) {
        return { phase, stepIndex };
      }
    }
    return null;
  };

  // Calculate center X for a step (always center of its phase)
  const getStepCenterX = (stepId: string) => {
    const location = findStepLocation(stepId);
    if (!location) return 0;
    return location.phase.x + BOX_WIDTH / 2;
  };

  // Calculate Y position for a step within a concurrent phase
  const getStepY = (phase: FlowPhase, stepIndex: number) => {
    const totalSteps = phase.steps.length;
    if (totalSteps === 1) return CENTER_Y;

    // Stack steps vertically around CENTER_Y
    const totalHeight =
      totalSteps * BOX_HEIGHT + (totalSteps - 1) * CONCURRENT_STEP_GAP;
    const startY = CENTER_Y - totalHeight / 2 + BOX_HEIGHT / 2;
    return startY + stepIndex * (BOX_HEIGHT + CONCURRENT_STEP_GAP);
  };

  // Calculate the Y range for a phase (for drawing connecting arrows)
  const getPhaseYRange = (phase: FlowPhase) => {
    const firstY = getStepY(phase, 0);
    const lastY = getStepY(phase, phase.steps.length - 1);
    return { minY: firstY, maxY: lastY };
  };

  // Helper: Horizontal arrow line
  const HorizontalArrow = ({
    x1, x2, y, className, hasArrowhead = true
  }: {
    x1: number; x2: number; y: number; className: string; hasArrowhead?: boolean
  }) => (
    <line
      x1={x1} y1={y} x2={x2} y2={y}
      className={className}
      markerEnd={hasArrowhead ? "url(#arrowhead-flow)" : undefined}
    />
  );

  // Helper: Vertical spine line
  const VerticalSpine = ({
    x, minY, maxY, className
  }: {
    x: number; minY: number; maxY: number; className: string
  }) => (
    <line x1={x} y1={minY} x2={x} y2={maxY} className={className} />
  );

  // Helper: Multiple arrows from spine to targets (fork pattern)
  const ForkArrows = ({
    spineX, targetX, phase, keyPrefix = 'fork'
  }: {
    spineX: number; targetX: number; phase: FlowPhase; keyPrefix?: string
  }) => (
    <>
      {phase.steps.map((_, i) => (
        <HorizontalArrow
          key={`${keyPrefix}-${i}`}
          x1={spineX + HALF_STROKE}
          x2={targetX - ARROW_GAP}
          y={getStepY(phase, i)}
          className={styles.forkPath}
        />
      ))}
    </>
  );

  // Helper: Multiple arrows from sources to spine (join pattern)
  const JoinArrows = ({
    sourceX, spineX, phase, keyPrefix = 'join'
  }: {
    sourceX: number; spineX: number; phase: FlowPhase; keyPrefix?: string
  }) => (
    <>
      {phase.steps.map((_, i) => (
        <HorizontalArrow
          key={`${keyPrefix}-${i}`}
          x1={sourceX + ARROW_GAP}
          x2={spineX - HALF_STROKE}
          y={getStepY(phase, i)}
          className={styles.joinPath}
          hasArrowhead={false}
        />
      ))}
    </>
  );

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''} system-flow-diagram`}
      role="img"
      aria-label="System processing flow: Receive request, Verify signature (400 on failure), Deduplicate by event ID (200 if duplicate), Store in database (500 on failure), then continue processing"
    >
      <svg
        viewBox={`${viewBoxX} 0 ${viewBoxWidth} ${VIEWBOX_HEIGHT}`}
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrowhead-flow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
            className={styles.arrowMarker}
          >
            <polygon points="0 0, 8 3, 0 6" />
          </marker>
        </defs>

        {/* Main flow arrows between phases with fork/join for concurrent */}
        {phases.slice(0, -1).map((phase, i) => {
          const nextPhase = phases[i + 1];
          const isCurrent = phase.steps.length > 1;
          const isNext = nextPhase.steps.length > 1;

          // Simple case: single step to single step
          if (!isCurrent && !isNext) {
            return (
              <HorizontalArrow
                key={`arrow-${phase.id}`}
                x1={phase.x + BOX_WIDTH + ARROW_GAP}
                x2={nextPhase.x - ARROW_GAP}
                y={CENTER_Y}
                className={styles.mainArrow}
              />
            );
          }

          // Fork: single step to concurrent phase
          if (!isCurrent && isNext) {
            // Position spine 1/3 of the way from source, giving 2/3 space for arrow bodies
            const gapStart = phase.x + BOX_WIDTH;
            const gapEnd = nextPhase.x;
            const forkX = gapStart + (gapEnd - gapStart) / 3;
            const { minY, maxY } = getPhaseYRange(nextPhase);
            return (
              <g key={`arrow-${phase.id}`}>
                {/* Line to fork point - end at spine's left edge */}
                <HorizontalArrow
                  x1={gapStart + ARROW_GAP}
                  x2={forkX - HALF_STROKE}
                  y={CENTER_Y}
                  className={styles.mainArrow}
                  hasArrowhead={false}
                />
                {/* Vertical fork spine */}
                <VerticalSpine x={forkX} minY={minY} maxY={maxY} className={styles.forkPath} />
                {/* Horizontal lines to each concurrent step */}
                <ForkArrows spineX={forkX} targetX={gapEnd} phase={nextPhase} />
              </g>
            );
          }

          // Join: concurrent phase to single step
          if (isCurrent && !isNext) {
            // Position spine 1/3 of the way from source, giving 2/3 space for arrow body to next
            const gapStart = phase.x + BOX_WIDTH;
            const gapEnd = nextPhase.x;
            const joinX = gapStart + (gapEnd - gapStart) / 3;
            const { minY, maxY } = getPhaseYRange(phase);
            return (
              <g key={`arrow-${phase.id}`}>
                {/* Horizontal lines from each concurrent step */}
                <JoinArrows sourceX={gapStart} spineX={joinX} phase={phase} />
                {/* Vertical join spine */}
                <VerticalSpine x={joinX} minY={minY} maxY={maxY} className={styles.joinPath} />
                {/* Line from join point to next phase */}
                <HorizontalArrow
                  x1={joinX + HALF_STROKE}
                  x2={gapEnd - ARROW_GAP}
                  y={CENTER_Y}
                  className={styles.mainArrow}
                />
              </g>
            );
          }

          // Both concurrent: join then fork
          const gapStart = phase.x + BOX_WIDTH;
          const gapEnd = nextPhase.x;
          const gapWidth = gapEnd - gapStart;
          // Position join spine 1/3 in, fork spine 2/3 in
          const joinSpineX = gapStart + gapWidth / 3;
          const forkSpineX = gapStart + (gapWidth * 2) / 3;
          const currentRange = getPhaseYRange(phase);
          const nextRange = getPhaseYRange(nextPhase);
          return (
            <g key={`arrow-${phase.id}`}>
              {/* Horizontal lines from current phase steps */}
              <JoinArrows sourceX={gapStart} spineX={joinSpineX} phase={phase} />
              {/* Vertical join spine */}
              <VerticalSpine x={joinSpineX} minY={currentRange.minY} maxY={currentRange.maxY} className={styles.joinPath} />
              {/* Center connection - between spine edges */}
              <HorizontalArrow
                x1={joinSpineX + HALF_STROKE}
                x2={forkSpineX - HALF_STROKE}
                y={CENTER_Y}
                className={styles.mainArrow}
                hasArrowhead={false}
              />
              {/* Vertical fork spine */}
              <VerticalSpine x={forkSpineX} minY={nextRange.minY} maxY={nextRange.maxY} className={styles.forkPath} />
              {/* Horizontal lines to next phase steps */}
              <ForkArrows spineX={forkSpineX} targetX={gapEnd} phase={nextPhase} />
            </g>
          );
        })}

        {/* Arrow to success terminal */}
        {phases.length > 0 && (() => {
          const lastPhase = phases[phases.length - 1];
          const isConcurrent = lastPhase.steps.length > 1;
          const gapStart = lastPhase.x + BOX_WIDTH;
          // Position join spine 1/3 of the way to terminal (consistent with other join spines)
          const joinX = gapStart + TERMINAL_CIRCLE_OFFSET / 3;
          const terminalArrowEnd = gapStart + TERMINAL_ARROW_END;

          if (!isConcurrent) {
            return (
              <HorizontalArrow
                x1={gapStart + ARROW_GAP}
                x2={terminalArrowEnd}
                y={CENTER_Y}
                className={styles.mainArrow}
              />
            );
          }

          // Join from concurrent final phase
          const { minY, maxY } = getPhaseYRange(lastPhase);
          return (
            <g>
              {/* Horizontal lines from each step */}
              <JoinArrows sourceX={gapStart} spineX={joinX} phase={lastPhase} keyPrefix="final-join" />
              {/* Vertical join spine */}
              <VerticalSpine x={joinX} minY={minY} maxY={maxY} className={styles.joinPath} />
              {/* Arrow to terminal */}
              <HorizontalArrow
                x1={joinX + HALF_STROKE}
                x2={terminalArrowEnd}
                y={CENTER_Y}
                className={styles.mainArrow}
              />
            </g>
          );
        })()}

        {/* Success terminal (checkmark circle) */}
        {phases.length > 0 && (
          <g
            className={styles.stepGroup}
            style={{ animationDelay: `${phases.length * 0.12}s` }}
          >
            <circle
              cx={phases[phases.length - 1].x + BOX_WIDTH + TERMINAL_CIRCLE_OFFSET}
              cy={CENTER_Y}
              r={TERMINAL_CIRCLE_RADIUS}
              className={styles.successTerminal}
            />
            <text
              x={phases[phases.length - 1].x + BOX_WIDTH + TERMINAL_CIRCLE_OFFSET}
              y={CENTER_Y + CHECKMARK_Y_OFFSET}
              className={styles.checkmark}
              textAnchor="middle"
            >
              ✓
            </text>
          </g>
        )}

        {/* Phase groups with step boxes */}
        {phases.map((phase, phaseIndex) => (
          <g key={phase.id}>
            {/* Step boxes within this phase */}
            {phase.steps.map((step, stepIndex) => {
              const stepY = getStepY(phase, stepIndex);
              return (
                <g
                  key={step.id}
                  className={styles.stepGroup}
                  style={{
                    animationDelay: `${phaseIndex * 0.12 + stepIndex * 0.06}s`,
                  }}
                >
                  <rect
                    x={phase.x}
                    y={stepY - BOX_HEIGHT / 2}
                    width={BOX_WIDTH}
                    height={BOX_HEIGHT}
                    rx={BOX_CORNER_RADIUS}
                    className={styles.stepBox}
                  />
                  <text
                    x={phase.x + BOX_WIDTH / 2}
                    y={stepY + 6}
                    className={styles.stepLabel}
                    textAnchor="middle"
                  >
                    {step.label}
                  </text>
                </g>
              );
            })}
          </g>
        ))}

        {/* Exit markers (error/success paths below main flow) */}
        {exitMarkers.map((marker, index) => {
          const location = findStepLocation(marker.fromStep);
          if (!location) return null;

          const exitX = getStepCenterX(marker.fromStep);
          const isConcurrent = location.phase.steps.length > 1;

          // For concurrent phases, exit from bottom of group; otherwise from step bottom
          const exitStartY = isConcurrent
            ? getPhaseYRange(location.phase).maxY + BOX_HEIGHT / 2 + EXIT_START_PADDING
            : getStepY(location.phase, location.stepIndex) + BOX_HEIGHT / 2 + EXIT_START_PADDING;

          // Center exit marker directly below the phase
          const finalExitX = exitX;

          return (
            <g
              key={`exit-${marker.fromStep}-${marker.code}`}
              className={styles.exitGroup}
              style={{ animationDelay: `${0.5 + index * 0.1}s` }}
            >
              {/* Dashed line down from step */}
              <line
                x1={finalExitX}
                y1={exitStartY}
                x2={finalExitX}
                y2={EXIT_Y - EXIT_PILL_GAP}
                className={styles.exitPath}
              />
              {/* Exit marker pill */}
              <rect
                x={finalExitX - EXIT_PILL_WIDTH / 2}
                y={EXIT_Y - EXIT_PILL_HEIGHT / 2}
                width={EXIT_PILL_WIDTH}
                height={EXIT_PILL_HEIGHT}
                rx={EXIT_PILL_RADIUS}
                className={
                  marker.type === 'error'
                    ? styles.exitMarkerError
                    : styles.exitMarkerSuccess
                }
              />
              <text
                x={finalExitX}
                y={EXIT_Y + 6}
                className={styles.exitCode}
                textAnchor="middle"
              >
                {marker.code}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
