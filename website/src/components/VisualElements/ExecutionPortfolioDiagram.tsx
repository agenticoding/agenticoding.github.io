import React from 'react';
import { OperatorNode } from './ActorNodes';
import { AgentTile, agentIconSize } from './AgentTile';
import type { WorkingAgentActivation } from './WorkingAgentNode';
import styles from './ExecutionPortfolioDiagram.module.css';

const ARIA_LABEL =
  "Execution coordination diagram. Four agents work through grounding, planning, execution, and review while a human operator monitors them according to each agent's risk profile and their own capacity to context-switch.";

const PHASES = {
  ground: { label: 'GROUND', tone: 'indigo' },
  plan: { label: 'PLAN', tone: 'warning' },
  execute: { label: 'EXECUTE', tone: 'violet' },
  review: { label: 'REVIEW', tone: 'success' },
} as const;

const STAGES = [
  {
    agent: 'AGENT B',
    tone: 'warning',
    states: [PHASES.plan, PHASES.execute, PHASES.review, PHASES.ground],
  },
  {
    agent: 'AGENT C',
    tone: 'indigo',
    states: [PHASES.ground, PHASES.plan, PHASES.review, PHASES.execute],
  },
  {
    agent: 'AGENT A',
    tone: 'violet',
    states: [PHASES.execute, PHASES.review, PHASES.ground, PHASES.plan],
  },
  {
    agent: 'AGENT D',
    tone: 'success',
    states: [PHASES.review, PHASES.ground, PHASES.execute, PHASES.plan],
  },
] as const;

const STATUS_CHANGE_MS = 2400;
const STATUS_CYCLE_MS = STATUS_CHANGE_MS * STAGES.length * 4;
const AGENT_STATUS_INTERVAL_MS = STATUS_CHANGE_MS * STAGES.length;
// Two percent of the cycle gives states a short overlap without obscuring labels.
const STATUS_CROSSFADE_MS = STATUS_CYCLE_MS * 0.02;

const ACTIVE_GEARS = {
  activeMs: 10_000,
  cycleMs: 10_000,
  delayMs: 0,
  turnScale: 0.45,
} as const satisfies WorkingAgentActivation;
type Point = { x: number; y: number };

const DESKTOP_CARDS = STAGES.map((stage, index) => ({
  ...stage,
  statusOffsetMs: index * STATUS_CHANGE_MS,
  x: 24 + index * 184,
  y: 40,
}));

const MOBILE_CARDS = STAGES.map((stage, index) => ({
  ...stage,
  statusOffsetMs: index * STATUS_CHANGE_MS,
  x: 76,
  y: 32 + index * 136,
}));

export default function ExecutionPortfolioDiagram() {
  return (
    <div className={styles.container}>
      <DesktopDiagram />
      <MobileDiagram />
    </div>
  );
}

function DesktopDiagram() {
  const stations = DESKTOP_CARDS.map((card) => ({ x: card.x + 80, y: 232 }));
  return (
    <svg
      className={`${styles.diagram} ${styles.desktopDiagram}`}
      viewBox="0 0 760 320"
      role="img"
      aria-label={ARIA_LABEL}
    >
      {DESKTOP_CARDS.map((card) => (
        <StageCard key={card.agent} {...card} />
      ))}
      <WatchRail x1={92} x2={668} y={248} />
      <OperatorWatcher stations={stations} />
    </svg>
  );
}

function MobileDiagram() {
  const stations = MOBILE_CARDS.map((card) => ({ x: 28, y: card.y + 48 }));
  return (
    <svg
      className={`${styles.diagram} ${styles.mobileDiagram}`}
      viewBox="0 0 340 616"
      role="img"
      aria-label={ARIA_LABEL}
    >
      {MOBILE_CARDS.map((card) => (
        <StageCard key={card.agent} {...card} />
      ))}
      <WatchRail x1={28} x2={28} y={80} y2={512} />
      <OperatorWatcher stations={stations} compact />
    </svg>
  );
}

function StageCard({
  x,
  y,
  agent,
  tone,
  statusOffsetMs,
  states,
}: (typeof DESKTOP_CARDS)[number]) {
  return (
    <g style={phaseStyle(statusOffsetMs, states)}>
      <AgentTile
        x={x}
        y={y}
        width={160}
        height={128}
        tone={tone}
        title={agent}
        detail="portfolio stream"
        gearActivation={ACTIVE_GEARS}
        iconSize={agentIconSize()}
        rectClassName={`${styles.vectorStroke} ${styles.phaseSurface}`}
      >
        <PhaseStates x={x} y={y} offsetMs={statusOffsetMs} states={states} />
      </AgentTile>
    </g>
  );
}

function phaseStyle(
  offsetMs: number,
  states: readonly (typeof PHASES)[keyof typeof PHASES][]
): React.CSSProperties {
  return states.reduce(
    (style, state, index) => ({
      ...style,
      [`--phase-${index}-fill`]: `var(--visual-bg-${state.tone})`,
      [`--phase-${index}-stroke`]: `var(--visual-${state.tone})`,
    }),
    {
      '--phase-cycle': `${STATUS_CYCLE_MS}ms`,
      '--phase-offset': `${offsetMs}ms`,
      '--phase-crossfade': `${STATUS_CROSSFADE_MS}ms`,
    } as React.CSSProperties
  );
}

function PhaseStates({
  x,
  y,
  offsetMs,
  states,
}: {
  x: number;
  y: number;
  offsetMs: number;
  states: readonly (typeof PHASES)[keyof typeof PHASES][];
}) {
  return (
    <g>
      {states.map((state, index) => (
        <text
          key={state.label}
          x={x + 80}
          y={y + 86}
          textAnchor="middle"
          fill={`var(--visual-${state.tone})`}
          className={styles.phaseState}
          style={
            {
              '--phase-delay': `${offsetMs + index * AGENT_STATUS_INTERVAL_MS}ms`,
            } as React.CSSProperties
          }
        >
          {state.label}
        </text>
      ))}
    </g>
  );
}

function WatchRail({
  x1,
  x2,
  y,
  y2 = y,
}: {
  x1: number;
  x2: number;
  y: number;
  y2?: number;
}) {
  return <line x1={x1} y1={y} x2={x2} y2={y2} className={styles.watchRail} />;
}

function OperatorWatcher({
  stations,
  compact = false,
}: {
  stations: Point[];
  compact?: boolean;
}) {
  const [first, ...rest] = stations;
  const motionStyle = rest.reduce(
    (style, station, index) => ({
      ...style,
      [`--watch-${index + 1}-x`]: `${station.x - first.x}px`,
      [`--watch-${index + 1}-y`]: `${station.y - first.y}px`,
    }),
    {}
  ) as React.CSSProperties;
  return (
    <g className={styles.operatorWatcher} style={motionStyle}>
      <OperatorNode
        x={first.x - (compact ? 16 : 20)}
        y={first.y - (compact ? 16 : 20)}
        size={compact ? 32 : 40}
      />
    </g>
  );
}
