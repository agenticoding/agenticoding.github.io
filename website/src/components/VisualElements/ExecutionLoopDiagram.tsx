import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './ExecutionLoopDiagram.module.css';
import { NotoEmoji } from './ActorNodes';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { CONNECTOR_STYLE, GHOST_STYLE, ARROWHEAD_POINTS, arrowOpacity } from './diagramConstants';

// Layout — ViewBox 480×264
//
//           🧠 Brain (predict)        x=216 y=32  w=48 h=48 rx=12   center=(240,56)
//                ↗               ↘
//   👀 Observe (result)          🦾 Execute      x=312 y=152 w=48 h=48 rx=12   center=(336,176)
//        x=120 y=152 w=48 h=48 rx=12  center=(144,176)
//
// Arcs computed via scripts/compute-execution-loop-arcs.js (BULGE=44, markerRefX=5)
// ARC_PREDICT: M 264 56 Q 335.2 77.6 335.95 147      (brain right-center → execute top-center)
// ARC_EXECUTE: M 312 176 Q 240 220 172.27 178.61      (execute left-center → observe right-center)
// ARC_OBSERVE: M 144 152 Q 144.8 77.6 211.22 57.45   (observe top-center → brain left-center)

const ACTS = [
  { id: 'predict', threshold: 0.20 },
  { id: 'execute', threshold: 0.45 },
  { id: 'observe', threshold: 0.65 },
  { id: 'loop',    threshold: 0.85 },
] as const;

export default function ExecutionLoopDiagram() {
  const phase = useAnimationPhase();
  const { wasReached } = useActs(ACTS, phase);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const brainVisible   = true; // act 0 — brain visible immediately
  const predictReached = mounted && wasReached('predict');
  const executeReached = mounted && wasReached('execute');
  const observeReached = mounted && wasReached('observe');

  // Arc visibility — mirrors node thresholds via wasReached() to stay in sync with ACTS
  const arc1Visible = mounted && wasReached('predict');
  const arc2Visible = mounted && wasReached('execute');
  const arc3Visible = mounted && wasReached('observe');

  const arc1Ref = useRef<SVGGeometryElement>(null);
  const arc2Ref = useRef<SVGGeometryElement>(null);
  const arc3Ref = useRef<SVGGeometryElement>(null);

  const t1 = useStrokeDraw(arc1Ref, phase, 0.20, 0.40);
  const t2 = useStrokeDraw(arc2Ref, phase, 0.45, 0.65);
  const t3 = useStrokeDraw(arc3Ref, phase, 0.65, 0.85);

  return (
    <svg
      viewBox="0 0 480 264"
      width="100%"
      height="auto"
      role="img"
      aria-label="Execution loop: LLM predicts, agent executes, result observed, loop repeats."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* ── Brain node (LLM) — always visible ─────────────────────────── */}
      <g className={clsx(styles.node, styles.nodeIn)}>
        <NotoEmoji codepoint="1f9e0" x={220} y={36} size={40} />
      </g>

      {/* "predict" label */}
      <text
        x={240} y={16}
        fill="var(--visual-violet)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, predictReached && styles.labelIn)}
      >predict</text>

      {/* ── Arc 1: brain → execute ────────────────────────────────────── */}
      <path
        ref={arc1Ref}
        d="M 264 56 Q 335.2 77.6 335.95 147"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, arc1Visible && styles.connectorDrawing)}
      />
      <g transform="translate(336,152) rotate(89)" style={{ opacity: arrowOpacity(t1) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Execute ghost placeholder ─────────────────────────────────── */}
      <rect
        x={312} y={152} width={48} height={48} rx={12}
        fill="var(--visual-bg-cyan)"
        stroke="var(--visual-cyan)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !executeReached && styles.ghostShown,
          executeReached && styles.ghostHidden,
        )}
      />

      {/* ── Execute node (Body) ───────────────────────────────────────── */}
      <g className={clsx(styles.node, executeReached && styles.nodeIn)}>
        <NotoEmoji codepoint="1f9be" x={316} y={156} size={40} />
      </g>

      {/* "execute" label */}
      <text
        x={336} y={216}
        fill="var(--visual-cyan)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, executeReached && styles.labelIn)}
      >execute</text>

      {/* ── Arc 2: execute → observe ──────────────────────────────────── */}
      <path
        ref={arc2Ref}
        d="M 312 176 Q 240 220 172.27 178.61"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, arc2Visible && styles.connectorDrawing)}
      />
      <g transform="translate(168,176) rotate(-149)" style={{ opacity: arrowOpacity(t2) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Observe ghost placeholder ─────────────────────────────────── */}
      <rect
        x={120} y={152} width={48} height={48} rx={12}
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !observeReached && styles.ghostShown,
          observeReached && styles.ghostHidden,
        )}
      />

      {/* ── Observe node (Result) ─────────────────────────────────────── */}
      <g className={clsx(styles.node, observeReached && styles.nodeIn)}>
        <NotoEmoji codepoint="1f440" x={124} y={156} size={40} />
      </g>

      {/* "observe" label */}
      <text
        x={144} y={216}
        fill="var(--visual-indigo)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, observeReached && styles.labelIn)}
      >observe</text>

      {/* ── Arc 3: observe → brain ────────────────────────────────────── */}
      <path
        ref={arc3Ref}
        d="M 144 152 Q 144.8 77.6 211.22 57.45"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, arc3Visible && styles.connectorDrawing)}
      />
      <g transform="translate(216,56) rotate(-17)" style={{ opacity: arrowOpacity(t3) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>
    </svg>
  );
}
