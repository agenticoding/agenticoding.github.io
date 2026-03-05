import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './PlanExecuteDiagram.module.css';
import { AgentNode, PromptIcon } from './ActorNodes';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';

// Layout — ViewBox 560×264
//
// Plan Card:     rect x=16  y=80  w=66  h=72  rx=8
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
  const phase = useAnimationPhase();
  const { wasReached, isCurrentAct } = useActs(ACTS as unknown as { id: string; threshold: number }[], phase);

  const handoffRef = useRef<SVGPathElement>(null);
  const branch1Ref = useRef<SVGPathElement>(null);
  const branch2Ref = useRef<SVGPathElement>(null);
  const branch3Ref = useRef<SVGPathElement>(null);
  const merge1Ref  = useRef<SVGPathElement>(null);
  const merge2Ref  = useRef<SVGPathElement>(null);
  const merge3Ref  = useRef<SVGPathElement>(null);
  const branchRefs = [branch1Ref, branch2Ref, branch3Ref];
  const mergeRefs  = [merge1Ref, merge2Ref, merge3Ref];

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Initialise stroke-dasharray/offset from computed length on mount
  useEffect(() => {
    for (const p of [
      handoffRef.current,
      branch1Ref.current, branch2Ref.current, branch3Ref.current,
      merge1Ref.current,  merge2Ref.current,  merge3Ref.current,
    ]) {
      if (!p) continue;
      const len = p.getTotalLength();
      p.style.strokeDasharray  = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    }
  }, []);

  const forkReached     = wasReached('fork');
  const executeReached  = wasReached('execute');
  const convergeReached = wasReached('converge');
  const completeReached = wasReached('complete');

  // Per-arc scroll-driven t in [0,1], staggered by PHASE_STAGGER
  const branchArcT = (i: number) => {
    const start = FORK_START + i * PHASE_STAGGER;
    const span  = EXECUTE_START - FORK_START;
    return Math.min(Math.max((phase - start) / span, 0), 1);
  };

  const mergeArcT = (i: number) => {
    const start = CONVERGE_START + i * PHASE_STAGGER;
    const span  = COMPLETE_START - CONVERGE_START;
    return Math.min(Math.max((phase - start) / span, 0), 1);
  };

  // Drive branch and merge arc strokeDashoffset from scroll phase
  useEffect(() => {
    branchRefs.forEach((ref, i) => {
      const path = ref.current;
      if (!path) return;
      path.style.strokeDashoffset = `${path.getTotalLength() * (1 - branchArcT(i))}`;
    });
    mergeRefs.forEach((ref, i) => {
      const path = ref.current;
      if (!path) return;
      path.style.strokeDashoffset = `${path.getTotalLength() * (1 - mergeArcT(i))}`;
    });
  }, [phase]);

  // Branch prompt positions: travel along branch arcs during execute phase
  const branchPromptPositions = BRANCHES.map((_, i) => {
    if (!executeReached) return null;
    const path = branchRefs[i].current;
    if (!path) return null;
    const start = EXECUTE_START + i * PHASE_STAGGER;
    const span  = CONVERGE_START - EXECUTE_START;
    const t = Math.min(Math.max((phase - start) / span, 0), 1);
    if (t <= 0) return null;
    const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const pt = path.getPointAtLength(t * path.getTotalLength());
    return { x: pt.x, y: pt.y, opacity };
  });

  // Merge prompt positions: travel along merge arcs during converge phase
  const mergePromptPositions = BRANCHES.map((_, i) => {
    if (!convergeReached) return null;
    const path = mergeRefs[i].current;
    if (!path) return null;
    const t = mergeArcT(i);
    if (t <= 0) return null;
    const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const pt = path.getPointAtLength(t * path.getTotalLength());
    return { x: pt.x, y: pt.y, opacity };
  });

  return (
    <svg
      viewBox="0 0 560 264"
      width="100%"
      height="auto"
      role="img"
      aria-label="A plan card is handed off to an orchestrator, which forks into three parallel agent branches that execute independently and converge at a merge point."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
    >
      {/* Ghost worker placeholders — provide rightward visual mass before execute act */}
      {BRANCHES.map((branch, i) => (
        <rect
          key={`ghost-${i}`}
          x={branch.workerX + 2.4} y={branch.workerY + 2.4}
          width={27.2} height={27.2} rx={6.8}
          fill="var(--visual-bg-violet)"
          stroke="var(--visual-violet)"
          strokeWidth={1}
          strokeDasharray="3 4"
          className={clsx(
            styles.ghostWorker,
            mounted && !executeReached && styles.ghostWorkerShown,
            executeReached && styles.ghostWorkerHidden,
          )}
          style={executeReached ? { transitionDelay: `${branch.nodeDelay}ms` } : undefined}
        />
      ))}

      {/* Plan card — checklist artifact */}
      <g className={clsx(styles.planCard, wasReached('plan') && styles.entered)}>
        <rect x={16} y={80} width={66} height={72} rx={8}
          fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} />
        {/* Title line */}
        <rect x={24} y={92} width={42} height={3} rx={1} fill="var(--visual-indigo)" />
        {/* Row 1 — checked */}
        <circle cx={27} cy={108} r={4.5} fill="var(--visual-success)" />
        <rect x={35} y={105.5} width={30} height={2.5} rx={1} fill="var(--visual-indigo)" />
        {/* Row 2 — checked */}
        <circle cx={27} cy={124} r={4.5} fill="var(--visual-success)" />
        <rect x={35} y={121.5} width={24} height={2.5} rx={1} fill="var(--visual-indigo)" />
        {/* Row 3 — pending until complete act */}
        <circle cx={27} cy={140} r={4.5}
          fill={completeReached ? 'var(--visual-success)' : 'none'}
          stroke={completeReached ? 'none' : 'var(--visual-neutral)'}
          strokeWidth={1.5}
          style={{ transition: 'fill 300ms var(--ease-enter)' }}
        />
        <rect x={35} y={137.5} width={18} height={2.5} rx={1}
          fill={completeReached ? 'var(--visual-indigo)' : 'var(--visual-neutral)'}
          style={{ transition: 'fill 300ms var(--ease-enter)' }}
        />
      </g>

      {/* Handoff arc — plan card → orchestrator */}
      <path
        ref={handoffRef}
        className={clsx(styles.handoffArc, wasReached('handoff') && styles.arcDraw)}
        d={HANDOFF_D}
        fill="none"
        stroke="var(--border-default)"
        strokeWidth={1}
        strokeDasharray="4 6"
        strokeLinecap="round"
      />

      {/* Branch arcs — orchestrator → workers, JS-driven dashoffset */}
      {BRANCHES.map((branch, i) => (
        <path
          key={i}
          ref={branchRefs[i]}
          className={clsx(styles.branchArc, forkReached && styles.branchDraw)}
          d={branch.branchD}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={1}
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
      ))}

      {/* Merge arcs — workers → merge node, JS-driven dashoffset */}
      {BRANCHES.map((branch, i) => (
        <path
          key={i}
          ref={mergeRefs[i]}
          className={clsx(styles.mergeArc, convergeReached && styles.mergeDraw)}
          d={branch.mergeD}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={1}
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
      ))}

      {/* Orchestrator */}
      <g className={clsx(
        styles.actorNode,
        wasReached('handoff') && styles.entered,
        isCurrentAct('handoff') && 'idle-ready-breathe',
      )}>
        <AgentNode x={155} y={100} size={40} />
      </g>

      {/* Workers — bloom in on execute act, staggered */}
      {BRANCHES.map((branch, i) => (
        <g
          key={i}
          className={clsx(styles.workerNode, executeReached && styles.workerEntered)}
          style={{ transitionDelay: executeReached ? `${branch.nodeDelay}ms` : undefined }}
        >
          <AgentNode x={branch.workerX} y={branch.workerY} size={32} />
        </g>
      ))}

      {/* Branch prompts — travel along branch arcs during execute phase */}
      {branchPromptPositions.map((pos, i) => pos && (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`} style={{ opacity: pos.opacity }}>
          <g className={styles.promptIcon}>
            <PromptIcon />
          </g>
        </g>
      ))}

      {/* Merge prompts — travel along merge arcs during converge phase */}
      {mergePromptPositions.map((pos, i) => pos && (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`} style={{ opacity: pos.opacity }}>
          <g className={styles.promptIcon}>
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
      <g className={clsx(styles.labels, wasReached('handoff') && styles.entered)}>
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
          className={clsx(styles.workerLabel, executeReached && styles.workerLabelEntered)}
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
          <rect x={-24} y={-14} width={48} height={28} rx={8}
            fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} />
          <rect x={-12} y={-6} width={24} height={3} rx={1} fill="var(--visual-indigo)" />
          <rect x={-8}  y={2}  width={16} height={3} rx={1} fill="var(--visual-indigo)" />
        </g>
      </g>
    </svg>
  );
}
