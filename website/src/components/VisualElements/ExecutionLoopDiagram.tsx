import React, { useRef } from 'react';
import clsx from 'clsx';
import shared from './diagram.module.css';
import { EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import { Ghost } from './Ghost';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { useMounted } from '../../hooks/useMounted';
import { CONNECTOR_STYLE, ARROWHEAD_POINTS, arrowOpacity } from './diagramConstants';

// Layout — ViewBox 480×264
//
//           🧠 Brain (predict)        x=216 y=32  w=48 h=48 rx=0   center=(240,56)
//                ↗               ↘
//   👀 Observe (result)          🦾 Execute      x=312 y=152 w=48 h=48 rx=0   center=(336,176)
//        x=120 y=152 w=48 h=48 rx=0  center=(144,176)
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
  const mounted = useMounted();

  const predictReached = mounted && wasReached('predict');
  const executeReached = mounted && wasReached('execute');
  const observeReached = mounted && wasReached('observe');

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
      <g className={clsx(shared.node, shared.nodeIn)}>
        <EmojiImage asset={EMOJI.brain} x={220} y={36} size={40} />
      </g>

      {/* "predict" label */}
      <text
        x={240} y={16}
        fill="var(--visual-violet)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(shared.label, predictReached && shared.labelIn)}
      >predict</text>

      {/* ── Arc 1: brain → execute ────────────────────────────────────── */}
      <path
        ref={arc1Ref}
        d="M 264 56 Q 335.2 77.6 335.95 147"
        {...CONNECTOR_STYLE}
        className={clsx(shared.connector, predictReached && shared.connectorDrawing)}
      />
      <g transform="translate(336,152) rotate(89)" style={{ opacity: arrowOpacity(t1) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Execute ghost placeholder ─────────────────────────────────── */}
      <Ghost x={312} y={152} width={48} height={48} rx={0}
        fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)"
        mounted={mounted} reached={executeReached}
      />

      {/* ── Execute node (Body) ───────────────────────────────────────── */}
      <g className={clsx(shared.node, executeReached && shared.nodeIn)}>
        <EmojiImage asset={EMOJI.act} x={316} y={156} size={40} />
      </g>

      {/* "execute" label */}
      <text
        x={336} y={216}
        fill="var(--visual-cyan)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(shared.label, executeReached && shared.labelIn)}
      >execute</text>

      {/* ── Arc 2: execute → observe ──────────────────────────────────── */}
      <path
        ref={arc2Ref}
        d="M 312 176 Q 240 220 172.27 178.61"
        {...CONNECTOR_STYLE}
        className={clsx(shared.connector, executeReached && shared.connectorDrawing)}
      />
      <g transform="translate(168,176) rotate(-149)" style={{ opacity: arrowOpacity(t2) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Observe ghost placeholder ─────────────────────────────────── */}
      <Ghost x={120} y={152} width={48} height={48} rx={0}
        fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)"
        mounted={mounted} reached={observeReached}
      />

      {/* ── Observe node (Result) ─────────────────────────────────────── */}
      <g className={clsx(shared.node, observeReached && shared.nodeIn)}>
        <EmojiImage asset={EMOJI.observe} x={124} y={156} size={40} />
      </g>

      {/* "observe" label */}
      <text
        x={144} y={216}
        fill="var(--visual-indigo)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(shared.label, observeReached && shared.labelIn)}
      >observe</text>

      {/* ── Arc 3: observe → brain ────────────────────────────────────── */}
      <path
        ref={arc3Ref}
        d="M 144 152 Q 144.8 77.6 211.22 57.45"
        {...CONNECTOR_STYLE}
        className={clsx(shared.connector, observeReached && shared.connectorDrawing)}
      />
      <g transform="translate(216,56) rotate(-17)" style={{ opacity: arrowOpacity(t3) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>
    </svg>
  );
}
