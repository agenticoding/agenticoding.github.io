import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './OperatorCycleDiagram.module.css';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { NotoEmoji } from './ActorNodes';

// Layout — ViewBox 560×280
//
// Research: center (160,  64)   Plan:     center (400,  64)
// Validate: center (160, 216)   Execute:  center (400, 216)
//
// Cycle direction (clockwise): Research → Plan → Execute → Validate → Research
// Node radius: R = 22px  |  Horizontal gap: 240px  |  Vertical gap: 152px  (~1.58:1)
//
// Connector endpoints (at circle edges, R from center):
//   Research right (182,64)   Plan left     (378,64)
//   Plan bottom   (400,86)    Execute top   (400,194)
//   Execute left  (378,216)   Validate right(182,216)
//   Validate top  (160,194)   Research bottom(160,86)
//
// Nodes render without background circles — icons are 36×36 (ICON_HALF = 18)
// All four phases use viewBox="0 0 128 128"

const R = 22;

const ICON_HALF = 18;

const EMOJI: Record<string, string> = {
  research: '1f52c',
  plan:     '1f4d1',
  execute:  '1f916',
  validate: '1f4cf',
};

const NODES = [
  {
    id: 'research',
    label: 'Research',
    cx: 160, cy: 64,
    labelAbove: true,
    color: 'var(--visual-indigo)',
    bgColor: 'var(--visual-bg-indigo)',
    description: 'Ground agents in codebase patterns and domain knowledge before acting',
  },
  {
    id: 'plan',
    label: 'Plan',
    cx: 400, cy: 64,
    labelAbove: true,
    color: 'var(--visual-cyan)',
    bgColor: 'var(--visual-bg-cyan)',
    description: 'Design changes strategically — explore when uncertain, be directive when clear',
  },
  {
    id: 'execute',
    label: 'Execute',
    cx: 400, cy: 216,
    labelAbove: false,
    color: 'var(--visual-magenta)',
    bgColor: 'var(--visual-bg-magenta)',
    description: 'Run agents supervised or autonomous based on trust and task criticality',
  },
  {
    id: 'validate',
    label: 'Validate',
    cx: 160, cy: 216,
    labelAbove: false,
    color: 'var(--visual-warning)',
    bgColor: 'var(--visual-bg-warning)',
    description: 'Verify against your mental model, then iterate or regenerate',
  },
] as const;

// Connector paths — straight lines for clear directed segments
const FWD_CONNECTORS = [
  { d: `M 182,64 L 378,64` },    // top:    R → P
  { d: `M 400,86 L 400,194` },   // right:  P → E
  { d: `M 378,216 L 182,216` },  // bottom: E → V
] as const;

const RETURN_D = `M 160,194 L 160,86`; // left: V → R

const ACTS = [
  { id: 'nodes',   threshold: 0.00 },
  { id: 'forward', threshold: 0.15 },
  { id: 'return',  threshold: 0.45 },
  { id: 'settle',  threshold: 0.65 },
] as const;

const FWD_PHASE_START = 0.15;
const FWD_PHASE_END   = 0.40;
const FWD_STAGGER     = 0.04;
const RET_PHASE_START = 0.45;
const RET_PHASE_END   = 0.62;

// ── Component ──────────────────────────────────────────────────────────────

export default function OperatorCycleDiagram() {
  const phase = useAnimationPhase();
  const { wasReached } = useActs(
    ACTS as unknown as { id: string; threshold: number }[],
    phase,
  );

  // Refs for connector paths (dasharray/dashoffset computed on mount)
  const fwdRef0 = useRef<SVGPathElement>(null);
  const fwdRef1 = useRef<SVGPathElement>(null);
  const fwdRef2 = useRef<SVGPathElement>(null);
  const fwdRefs = [fwdRef0, fwdRef1, fwdRef2];
  const returnRef = useRef<SVGPathElement>(null);

  // Refs for standalone arrowhead polygons
  const arrowRef0 = useRef<SVGGElement>(null);
  const arrowRef1 = useRef<SVGGElement>(null);
  const arrowRef2 = useRef<SVGGElement>(null);
  const arrowRefs = [arrowRef0, arrowRef1, arrowRef2];
  const arrowReturnRef = useRef<SVGGElement>(null);

  // Mount: compute strokeDasharray from path geometry
  useEffect(() => {
    for (const ref of [...fwdRefs, returnRef]) {
      const p = ref.current;
      if (!p) continue;
      p.style.strokeDasharray = `${p.getTotalLength()}`;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase-driven: drive strokeDashoffset and arrowhead opacity from scroll phase (reverses on scroll-up)
  useEffect(() => {
    fwdRefs.forEach((ref, i) => {
      const p = ref.current;
      if (!p) return;
      const len = parseFloat(p.style.strokeDasharray || '0');
      if (!len) return;
      const start = FWD_PHASE_START + i * FWD_STAGGER;
      const t = Math.min(Math.max((phase - start) / (FWD_PHASE_END - start), 0), 1);
      p.style.strokeDashoffset = `${len * (1 - t)}`;
      const arrowG = arrowRefs[i].current;
      if (arrowG) arrowG.style.opacity = `${Math.min(Math.max((t - 0.85) / 0.15, 0), 1)}`;
    });
    const rp = returnRef.current;
    if (rp) {
      const len = parseFloat(rp.style.strokeDasharray || '0');
      if (len) {
        const t = Math.min(Math.max((phase - RET_PHASE_START) / (RET_PHASE_END - RET_PHASE_START), 0), 1);
        rp.style.strokeDashoffset = `${len * (1 - t)}`;
        const arrowG = arrowReturnRef.current;
        if (arrowG) arrowG.style.opacity = `${Math.min(Math.max((t - 0.85) / 0.15, 0), 1)}`;
      }
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const nodesReached   = wasReached('nodes');
  const forwardReached = wasReached('forward');
  const returnReached  = wasReached('return');
  const settleReached  = wasReached('settle');

  return (
    <div>
      {/* SVG Diagram */}
      <svg
        viewBox="0 0 560 280"
        width="100%"
        height="auto"
        role="img"
        aria-label="The operator cycle: Research → Plan → Execute → Validate, then iterate."
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
      >
        {/* Forward connectors — top, right, bottom — staggered draw on `forward` act */}
        {FWD_CONNECTORS.map((conn, i) => (
          <path
            key={i}
            ref={fwdRefs[i]}
            className={clsx(styles.connector, forwardReached && styles.drawing)}
            d={conn.d}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}

        {/* Return connector — Validate → Research — draws on `return` act */}
        <path
          ref={returnRef}
          className={clsx(styles.returnPath, returnReached && styles.drawing)}
          d={RETURN_D}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />

        {/* Standalone arrowheads — phase-driven opacity so they appear when line arrives */}
        {/* R→P: tip at (378,64), pointing right (rotate 0°) */}
        <g ref={arrowRef0} transform="translate(378,64) rotate(0)"  style={{ opacity: 0 }}>
          <polygon points="-8,-4 0,0 -8,4" fill="var(--text-muted)" />
        </g>
        {/* P→E: tip at (400,194), pointing down (rotate 90°) */}
        <g ref={arrowRef1} transform="translate(400,194) rotate(90)" style={{ opacity: 0 }}>
          <polygon points="-8,-4 0,0 -8,4" fill="var(--text-muted)" />
        </g>
        {/* E→V: tip at (182,216), pointing left (rotate 180°) */}
        <g ref={arrowRef2} transform="translate(182,216) rotate(180)" style={{ opacity: 0 }}>
          <polygon points="-8,-4 0,0 -8,4" fill="var(--text-muted)" />
        </g>
        {/* V→R: tip at (160,86), pointing up (rotate 270°) */}
        <g ref={arrowReturnRef} transform="translate(160,86) rotate(270)" style={{ opacity: 0 }}>
          <polygon points="-8,-4 0,0 -8,4" fill="var(--text-muted)" />
        </g>

        {/* Phase nodes — staggered entrance on `nodes` act */}
        {NODES.map((node, i) => (
          <g
            key={node.id}
            className={clsx(styles.phaseNode, nodesReached && styles.entered)}
            style={nodesReached ? { animationDelay: `${i * 80}ms` } : undefined}
          >
            <NotoEmoji codepoint={EMOJI[node.id]} x={node.cx - ICON_HALF} y={node.cy - ICON_HALF} size={ICON_HALF * 2} />
            {/* Phase label — above top-row nodes, below bottom-row nodes */}
            <text
              x={node.cx} y={node.labelAbove ? node.cy - R - 8 : node.cy + R + 14}
              fill={node.color}
              textAnchor="middle"
              fontSize={11}
              fontWeight={500}
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: 'var(--font-mono-features)',
              }}
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Center "iterate" label — appears on `settle` act */}
        <text
          x={280} y={140}
          className={clsx(styles.cycleLabel, settleReached && styles.settled)}
          fill="var(--text-muted)"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fontWeight={400}
          style={{
            fontFamily: 'var(--font-mono-keyword)',
            fontFeatureSettings: 'var(--font-mono-features)',
          }}
        >
          iterate
        </text>


      </svg>

      {/* Description grid — fades in with nodes */}
      <div className={clsx(styles.descGrid, nodesReached && styles.descVisible)}>
        {NODES.map((node) => (
          <div key={node.id} className={styles.descCell}>
            <span
              className={styles.descLabel}
              style={{ color: node.color }}
            >
              {node.label}
            </span>
            <span className={styles.descText}>{node.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
