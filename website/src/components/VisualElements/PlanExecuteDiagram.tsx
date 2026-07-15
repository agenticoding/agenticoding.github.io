import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './PlanExecuteDiagram.module.css';
import shared from './diagram.module.css';
import { ContextAgentTile, type AgentContextTile } from './AgentTile';
import { Ghost } from './Ghost';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { useMounted } from '../../hooks/useMounted';

const DASHED_CONNECTOR = {
  fill: 'none',
  stroke: 'var(--border-subtle)',
  strokeWidth: 1,
  strokeDasharray: '4 6',
  strokeLinecap: 'round' as const,
};

// Layout — ViewBox 680×480. Work stays inside each agent tile.
const HANDOFF_D = 'M 82 220 Q 96 180 114 240';

const FORK_START = 0.3;
const EXECUTE_START = 0.5;
const CONVERGE_START = 0.72;
const COMPLETE_START = 0.88;
const PHASE_STAGGER = 0.04;

const ACTS = [
  { id: 'plan', threshold: 0 },
  { id: 'handoff', threshold: 0.12 },
  { id: 'fork', threshold: 0.3 },
  { id: 'execute', threshold: 0.5 },
  { id: 'converge', threshold: 0.72 },
  { id: 'complete', threshold: 0.88 },
] as const;

type BranchSpec = {
  branchD: string;
  mergeD: string;
  workerX: number;
  workerY: number;
  label: string;
  nodeDelay: number;
};

const BRANCHES: BranchSpec[] = [
  {
    branchD: 'M 268 240 Q 320 84 376 84',
    mergeD: 'M 508 84 Q 560 150 604 220',
    workerX: 376,
    workerY: 8,
    label: 'auth',
    nodeDelay: 0,
  },
  {
    branchD: 'M 268 240 Q 320 240 376 240',
    mergeD: 'M 508 240 Q 560 240 604 220',
    workerX: 376,
    workerY: 160,
    label: 'api',
    nodeDelay: 120,
  },
  {
    branchD: 'M 268 240 Q 320 396 376 396',
    mergeD: 'M 508 396 Q 560 290 604 220',
    workerX: 376,
    workerY: 312,
    label: 'tests',
    nodeDelay: 240,
  },
];

export default function PlanExecuteDiagram() {
  const phase = useStaticAnimationPhase();
  const { wasReached, isCurrentAct } = useActs(ACTS, phase);
  const mounted = useMounted();

  const handoffRef = useRef<SVGPathElement>(null);
  const branch1Ref = useRef<SVGPathElement>(null);
  const branch2Ref = useRef<SVGPathElement>(null);
  const branch3Ref = useRef<SVGPathElement>(null);
  const merge1Ref = useRef<SVGPathElement>(null);
  const merge2Ref = useRef<SVGPathElement>(null);
  const merge3Ref = useRef<SVGPathElement>(null);
  const branchRefs = [branch1Ref, branch2Ref, branch3Ref];
  const mergeRefs = [merge1Ref, merge2Ref, merge3Ref];

  useEffect(() => {
    const path = handoffRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  }, []);

  useStrokeDraw(
    branch1Ref as React.RefObject<SVGGeometryElement | null>,
    phase,
    FORK_START,
    EXECUTE_START
  );
  useStrokeDraw(
    branch2Ref as React.RefObject<SVGGeometryElement | null>,
    phase,
    FORK_START + PHASE_STAGGER,
    EXECUTE_START + PHASE_STAGGER
  );
  useStrokeDraw(
    branch3Ref as React.RefObject<SVGGeometryElement | null>,
    phase,
    FORK_START + 2 * PHASE_STAGGER,
    EXECUTE_START + 2 * PHASE_STAGGER
  );
  useStrokeDraw(
    merge1Ref as React.RefObject<SVGGeometryElement | null>,
    phase,
    CONVERGE_START,
    COMPLETE_START
  );
  useStrokeDraw(
    merge2Ref as React.RefObject<SVGGeometryElement | null>,
    phase,
    CONVERGE_START + PHASE_STAGGER,
    COMPLETE_START + PHASE_STAGGER
  );
  useStrokeDraw(
    merge3Ref as React.RefObject<SVGGeometryElement | null>,
    phase,
    CONVERGE_START + 2 * PHASE_STAGGER,
    COMPLETE_START + 2 * PHASE_STAGGER
  );

  const forkReached = wasReached('fork');
  const executeReached = wasReached('execute');
  const convergeReached = wasReached('converge');
  const completeReached = wasReached('complete');

  return (
    <svg
      viewBox="0 0 680 480"
      width="100%"
      role="img"
      aria-label="A plan card is handed off to an orchestrator, which keeps work inside its context, coordinates three parallel agent work regions, and converges their results."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '680px', margin: '0 auto' }}
    >
      {BRANCHES.map((branch, i) => (
        <Ghost
          key={`ghost-${i}`}
          x={branch.workerX}
          y={branch.workerY}
          width={132}
          height={152}
          rx={0}
          fill="var(--visual-bg-violet)"
          stroke="var(--visual-violet)"
          mounted={mounted}
          reached={executeReached}
          style={
            executeReached
              ? { transitionDelay: `${branch.nodeDelay}ms` }
              : undefined
          }
        />
      ))}

      <g
        className={clsx(
          styles.planCard,
          wasReached('plan') && shared.actEntered
        )}
      >
        <rect
          x={16}
          y={204}
          width={66}
          height={72}
          rx={0}
          fill="var(--visual-bg-indigo)"
          stroke="var(--visual-indigo)"
          strokeWidth={1.5}
        />
        <rect
          x={24}
          y={216}
          width={42}
          height={3}
          rx={0}
          fill="var(--visual-indigo)"
        />
        <circle cx={27} cy={232} r={4.5} fill="var(--visual-success)" />
        <rect
          x={35}
          y={229.5}
          width={30}
          height={2.5}
          rx={0}
          fill="var(--visual-indigo)"
        />
        <circle cx={27} cy={248} r={4.5} fill="var(--visual-success)" />
        <rect
          x={35}
          y={245.5}
          width={24}
          height={2.5}
          rx={0}
          fill="var(--visual-indigo)"
        />
        <circle
          cx={27}
          cy={264}
          r={4.5}
          fill={completeReached ? 'var(--visual-success)' : 'none'}
          stroke={completeReached ? 'none' : 'var(--visual-neutral)'}
          strokeWidth={1.5}
          style={{ transition: 'fill 300ms var(--ease-enter)' }}
        />
        <rect
          x={35}
          y={261.5}
          width={18}
          height={2.5}
          rx={0}
          fill={
            completeReached ? 'var(--visual-indigo)' : 'var(--visual-neutral)'
          }
          style={{ transition: 'fill 300ms var(--ease-enter)' }}
        />
      </g>

      <path
        ref={handoffRef}
        className={clsx(
          styles.handoffArc,
          wasReached('handoff') && styles.arcDraw
        )}
        d={HANDOFF_D}
        {...DASHED_CONNECTOR}
        stroke="var(--border-default)"
      />

      {BRANCHES.map((branch, i) => (
        <path
          key={`branch-${i}`}
          ref={branchRefs[i]}
          className={clsx(
            shared.connector,
            forkReached && shared.connectorDrawing
          )}
          d={branch.branchD}
          {...DASHED_CONNECTOR}
        />
      ))}

      {BRANCHES.map((branch, i) => (
        <path
          key={`merge-${i}`}
          ref={mergeRefs[i]}
          className={clsx(
            shared.connector,
            convergeReached && shared.connectorDrawing
          )}
          d={branch.mergeD}
          {...DASHED_CONNECTOR}
        />
      ))}

      <g
        className={clsx(
          styles.actorNode,
          wasReached('handoff') && shared.actEntered,
          isCurrentAct('handoff') && 'idle-ready-breathe'
        )}
      >
        <ContextAgentTile
          x={112}
          y={134}
          width={156}
          height={212}
          agentBlockHeight={88}
          tone="violet"
          contextEyebrow="ORCHESTRATOR CONTEXT"
          contextDetail="work stays attached"
          contextTiles={orchestratorTiles()}
          contextClasses={contextClasses()}
          eyebrow="ORCHESTRATOR"
          title="coordinates work"
          iconSize={32}
          rectClassName={styles.agentRect}
          titleClassName={styles.agentTitle}
        />
      </g>

      {BRANCHES.map((branch, i) => (
        <g
          key={`worker-${i}`}
          className={clsx(
            shared.workerNode,
            executeReached && shared.workerEntered
          )}
          style={{
            transitionDelay: executeReached
              ? `${branch.nodeDelay}ms`
              : undefined,
          }}
        >
          <ContextAgentTile
            x={branch.workerX}
            y={branch.workerY}
            width={132}
            height={152}
            agentBlockHeight={72}
            tone="violet"
            contextEyebrow="WORK REGION"
            contextDetail="agent context"
            contextTiles={workerTiles(branch)}
            contextClasses={contextClasses()}
            eyebrow="WORKER"
            title={branch.label}
            iconSize={24}
            rectClassName={styles.agentRect}
            titleClassName={styles.workerTitle}
          />
        </g>
      ))}

      <g
        className={clsx(
          styles.mergeNode,
          completeReached && styles.mergeEntered
        )}
      >
        <circle
          cx={620}
          cy={220}
          r={16}
          fill="var(--visual-bg-success)"
          stroke="var(--visual-success)"
          strokeWidth={1.5}
        />
        <path
          d="M 612 220 L 618 226 L 628 214"
          fill="none"
          stroke="var(--visual-success)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function contextClasses() {
  return {
    tile: styles.contextTile,
    tileRect: styles.contextTileRect,
    tileText: styles.contextTileText,
  };
}

function orchestratorTiles(): readonly AgentContextTile[] {
  return [
    { label: 'PLAN', activationDelayMs: 500 },
    { label: 'BOUNDARIES', activationDelayMs: 900 },
    { label: 'RESULTS', activationDelayMs: 1300 },
  ];
}

function workerTiles(branch: BranchSpec): readonly AgentContextTile[] {
  return [{ label: branch.label.toUpperCase(), activationDelayMs: 700 }];
}
