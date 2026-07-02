import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './PlanExecuteDiagram.module.css';
import shared from './diagram.module.css';
import { AgentNode, PromptIcon } from './ActorNodes';
import { Ghost } from './Ghost';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { useMounted } from '../../hooks/useMounted';
import { promptFadeOpacity } from './diagramConstants';

// Intentionally lighter than CONNECTOR_STYLE: --border-subtle color, thinner stroke
const DASHED_CONNECTOR = {
  fill: 'none',
  stroke: 'var(--border-subtle)',
  strokeWidth: 1,
  strokeDasharray: '4 6',
  strokeLinecap: 'round' as const,
};

// Layout — ViewBox 560×264
//
// Plan Card:     rect x=16  y=80  w=66  h=72  rx=0
// Orchestrator:  AgentNode x=155 y=100 size=40  right shoulder ~(193,125)
// Worker 1:      AgentNode x=392 y=36  size=32  (top)
// Worker 2:      AgentNode x=392 y=108 size=32  (mid)
// Worker 3:      AgentNode x=392 y=180 size=32  (bot)
// Merge circle:  cx=508 cy=132 r=16
//
// Handoff arc:  M 82 116 Q 120 78 158 125
// Branch W1:    M 193 125 Q 290 50  393 56
// Branch W2:    M 193 125 Q 300 125 393 128
// Branch W3:    M 193 125 Q 290 200 393 200
// Merge W1:     M 424 56  Q 462 82  492 120
// Merge W2:     M 424 128 Q 462 128 492 132
// Merge W3:     M 424 200 Q 462 182 492 144

const HANDOFF_D = 'M 82 116 Q 120 78 158 125';

const FORK_START     = 0.30;
const EXECUTE_START  = 0.50;
const CONVERGE_START = 0.72;
const COMPLETE_START = 0.88;
const PHASE_STAGGER  = 0.04;

const ACTS = [
  { id: 'plan',     threshold: 0    },
  { id: 'handoff',  threshold: 0.12 },
  { id: 'fork',     threshold: 0.30 },
  { id: 'execute',  threshold: 0.50 },
  { id: 'converge', threshold: 0.72 },
  { id: 'complete', threshold: 0.88 },
] as const;

type BranchSpec = {
  branchD: string;
  mergeD: string;
  workerX: number;
  workerY: number;
  labelX: number;
  labelY: number;
  label: string;
  nodeDelay: number;
};

const BRANCHES: BranchSpec[] = [
  {
    branchD: 'M 193 125 Q 290 50  393 56',
    mergeD:  'M 424 56  Q 462 82  492 120',
    workerX: 392, workerY: 36,
    labelX: 408,  labelY: 82,
    label: 'auth', nodeDelay: 0,
  },
  {
    branchD: 'M 193 125 Q 300 125 393 128',
    mergeD:  'M 424 128 Q 462 128 492 132',
    workerX: 392, workerY: 108,
    labelX: 408,  labelY: 154,
    label: 'api', nodeDelay: 120,
  },
  {
    branchD: 'M 193 125 Q 290 200 393 200',
    mergeD:  'M 424 200 Q 462 182 492 144',
    workerX: 392, workerY: 180,
    labelX: 408,  labelY: 226,
    label: 'tests', nodeDelay: 240,
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
  const merge1Ref  = useRef<SVGPathElement>(null);
  const merge2Ref  = useRef<SVGPathElement>(null);
  const merge3Ref  = useRef<SVGPathElement>(null);
  const branchRefs = [branch1Ref, branch2Ref, branch3Ref];
  const mergeRefs  = [merge1Ref, merge2Ref, merge3Ref];

  // Handoff arc: CSS-animation-driven (not scroll-driven) — needs manual dasharray init
  useEffect(() => {
    const p = handoffRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    p.style.strokeDasharray  = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  }, []);

  // Branch arcs: scroll-driven via useStrokeDraw (replaces manual phase useEffect)
  const b1t = useStrokeDraw(branch1Ref as React.RefObject<SVGGeometryElement | null>, phase, FORK_START,                   EXECUTE_START);
  const b2t = useStrokeDraw(branch2Ref as React.RefObject<SVGGeometryElement | null>, phase, FORK_START + PHASE_STAGGER,    EXECUTE_START + PHASE_STAGGER);
  const b3t = useStrokeDraw(branch3Ref as React.RefObject<SVGGeometryElement | null>, phase, FORK_START + 2 * PHASE_STAGGER, EXECUTE_START + 2 * PHASE_STAGGER);

  // Merge arcs: scroll-driven via useStrokeDraw
  const m1t = useStrokeDraw(merge1Ref as React.RefObject<SVGGeometryElement | null>, phase, CONVERGE_START,                   COMPLETE_START);
  const m2t = useStrokeDraw(merge2Ref as React.RefObject<SVGGeometryElement | null>, phase, CONVERGE_START + PHASE_STAGGER,    COMPLETE_START + PHASE_STAGGER);
  const m3t = useStrokeDraw(merge3Ref as React.RefObject<SVGGeometryElement | null>, phase, CONVERGE_START + 2 * PHASE_STAGGER, COMPLETE_START + 2 * PHASE_STAGGER);

  const branchTs = [b1t, b2t, b3t];
  const mergeTs  = [m1t, m2t, m3t];

  const forkReached     = wasReached('fork');
  const executeReached  = wasReached('execute');
  const convergeReached = wasReached('converge');
  const completeReached = wasReached('complete');

  // Branch prompt positions: travel along branch arcs during execute phase
  const branchPromptPositions = BRANCHES.map((_, i) => {
    if (!executeReached) return null;
    const path = branchRefs[i].current;
    if (!path) return null;
    const start = EXECUTE_START + i * PHASE_STAGGER;
    const span  = CONVERGE_START - EXECUTE_START;
    const t = Math.min(Math.max((phase - start) / span, 0), 1);
    if (t <= 0) return null;
    const opacity = promptFadeOpacity(t);
    const pt = path.getPointAtLength(t * path.getTotalLength());
    return { x: pt.x, y: pt.y, opacity };
  });

  // Merge prompt positions: travel along merge arcs during converge phase
  const mergePromptPositions = BRANCHES.map((_, i) => {
    if (!convergeReached) return null;
    const path = mergeRefs[i].current;
    if (!path) return null;
    const t = mergeTs[i];
    if (t <= 0) return null;
    const opacity = promptFadeOpacity(t);
    const pt = path.getPointAtLength(t * path.getTotalLength());
    return { x: pt.x, y: pt.y, opacity };
  });

  return (
    <svg
      viewBox="0 0 560 264"
      width="100%"
      role="img"
      aria-label="A plan card is handed off to an orchestrator, which forks into three parallel agent branches that execute independently and converge at a merge point."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
    >
      {/* Ghost worker placeholders — provide rightward visual mass before execute act */}
      {BRANCHES.map((branch, i) => (
        <Ghost
          key={`ghost-${i}`}
          x={branch.workerX + 2.4} y={branch.workerY + 2.4}
          width={27.2} height={27.2} rx={0}
          fill="var(--visual-bg-violet)" stroke="var(--visual-violet)"
          mounted={mounted} reached={executeReached}
          style={executeReached ? { transitionDelay: `${branch.nodeDelay}ms` } : undefined}
        />
      ))}

      {/* Plan card — checklist artifact */}
      <g className={clsx(styles.planCard, wasReached('plan') && shared.actEntered)}>
        <rect x={16} y={80} width={66} height={72} rx={0}
          fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} />
        {/* Title line */}
        <rect x={24} y={92} width={42} height={3} rx={0} fill="var(--visual-indigo)" />
        {/* Row 1 — checked */}
        <circle cx={27} cy={108} r={4.5} fill="var(--visual-success)" />
        <rect x={35} y={105.5} width={30} height={2.5} rx={0} fill="var(--visual-indigo)" />
        {/* Row 2 — checked */}
        <circle cx={27} cy={124} r={4.5} fill="var(--visual-success)" />
        <rect x={35} y={121.5} width={24} height={2.5} rx={0} fill="var(--visual-indigo)" />
        {/* Row 3 — pending until complete act */}
        <circle cx={27} cy={140} r={4.5}
          fill={completeReached ? 'var(--visual-success)' : 'none'}
          stroke={completeReached ? 'none' : 'var(--visual-neutral)'}
          strokeWidth={1.5}
          style={{ transition: 'fill 300ms var(--ease-enter)' }}
        />
        <rect x={35} y={137.5} width={18} height={2.5} rx={0}
          fill={completeReached ? 'var(--visual-indigo)' : 'var(--visual-neutral)'}
          style={{ transition: 'fill 300ms var(--ease-enter)' }}
        />
      </g>

      {/* Handoff arc: stroke overrides DASHED_CONNECTOR for higher contrast. */}
      <path
        ref={handoffRef}
        className={clsx(styles.handoffArc, wasReached('handoff') && styles.arcDraw)}
        d={HANDOFF_D}
        {...DASHED_CONNECTOR}
        stroke="var(--border-default)"
      />

      {/* Branch arcs — orchestrator → workers, scroll-driven dashoffset */}
      {BRANCHES.map((branch, i) => (
        <path
          key={i}
          ref={branchRefs[i]}
          className={clsx(shared.connector, forkReached && shared.connectorDrawing)}
          d={branch.branchD}
          {...DASHED_CONNECTOR}
        />
      ))}

      {/* Merge arcs — workers → merge node, scroll-driven dashoffset */}
      {BRANCHES.map((branch, i) => (
        <path
          key={i}
          ref={mergeRefs[i]}
          className={clsx(shared.connector, convergeReached && shared.connectorDrawing)}
          d={branch.mergeD}
          {...DASHED_CONNECTOR}
        />
      ))}

      {/* Orchestrator */}
      <g className={clsx(
        styles.actorNode,
        wasReached('handoff') && shared.actEntered,
        isCurrentAct('handoff') && 'idle-ready-breathe',
      )}>
        <AgentNode x={155} y={100} size={40} />
      </g>

      {/* Workers — bloom in on execute act, staggered */}
      {BRANCHES.map((branch, i) => (
        <g
          key={i}
          className={clsx(shared.workerNode, executeReached && shared.workerEntered)}
          style={{ transitionDelay: executeReached ? `${branch.nodeDelay}ms` : undefined }}
        >
          <AgentNode x={branch.workerX} y={branch.workerY} size={32} />
        </g>
      ))}

      {/* Branch prompts — travel along branch arcs during execute phase */}
      {branchPromptPositions.map((pos, i) => pos && (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`} style={{ opacity: pos.opacity }}>
          <g className={shared.actEntered}>
            <PromptIcon />
          </g>
        </g>
      ))}

      {/* Merge prompts — travel along merge arcs during converge phase */}
      {mergePromptPositions.map((pos, i) => pos && (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`} style={{ opacity: pos.opacity }}>
          <g className={shared.actEntered}>
            <PromptIcon />
          </g>
        </g>
      ))}

      {/* Merge node — enters at complete act */}
      <g className={clsx(styles.mergeNode, completeReached && styles.mergeEntered)}>
        <circle cx={508} cy={132} r={16}
          fill="var(--visual-bg-success)" stroke="var(--visual-success)" strokeWidth={1.5} />
        <path
          d="M 500 132 L 506 138 L 516 126"
          fill="none" stroke="var(--visual-success)" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
        />
      </g>

      {/* Permanent orientation labels */}
      <g className={clsx(styles.labels, wasReached('handoff') && shared.actEntered)}>
        <text
          x={49} y={162}
          fill="var(--visual-indigo)"
          style={{ fontFamily: 'var(--font-mono-human)' }}
          fontSize={11} fontWeight={400} textAnchor="middle"
        >plan</text>
        <text
          x={175} y={156}
          fill="var(--visual-violet)"
          style={{ fontFamily: 'var(--font-mono)' }}
          fontSize={11} fontWeight={500} textAnchor="middle"
        >orchestrator</text>
      </g>

      {/* Worker labels — appear on execute act, staggered */}
      {BRANCHES.map((branch, i) => (
        <text
          key={i}
          x={branch.labelX} y={branch.labelY}
          className={clsx(shared.workerLabel, executeReached && shared.workerLabelEntered)}
          fill="var(--visual-neutral)"
          style={{
            fontFamily: 'var(--font-mono)',
            transitionDelay: executeReached ? `${branch.nodeDelay + 100}ms` : undefined,
          }}
          fontSize={9} fontWeight={400} textAnchor="middle"
        >{branch.label}</text>
      ))}

      {/* Reduced-motion static fallback */}
      <g className={styles.staticCard}>
        <g transform="translate(280, 108)">
          <rect x={-24} y={-14} width={48} height={28} rx={0}
            fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} />
          <rect x={-12} y={-6} width={24} height={3} rx={0} fill="var(--visual-indigo)" />
          <rect x={-8}  y={2}  width={16} height={3} rx={0} fill="var(--visual-indigo)" />
        </g>
      </g>
    </svg>
  );
}
