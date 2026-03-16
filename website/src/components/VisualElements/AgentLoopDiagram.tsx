import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './AgentLoopDiagram.module.css';
import { NotoEmoji } from './ActorNodes';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { CONNECTOR_STYLE, GHOST_STYLE, ARROWHEAD_POINTS, arrowOpacity } from './diagramConstants';

// Layout — ViewBox 520×352
//
// Pentagon: center=(270,185), radius=110, clockwise from top
//   Perceive  (top):          center=(270, 75)   rect x=246 y=51  48×48
//   Reason    (upper-right):  center=(375,151)   rect x=351 y=127 48×48
//   Act       (lower-right):  center=(335,274)   rect x=311 y=250 48×48
//   Observe   (lower-left):   center=(205,274)   rect x=181 y=250 48×48
//   Verify    (upper-left):   center=(165,151)   rect x=141 y=127 48×48
//   Done      (exit, below-left of verify): rect x=72 y=240 48×48 rx=12
//
// Arc paths computed via scripts/compute-agent-loop-arcs.js (BULGE=30, REF_X=5); node and label positions are hand-placed
//   Arc 1 perceive→reason:  M 294 75 Q 350.71 75.75 372.86 122.48
//   Arc 2 reason→act:       M 375 175 Q 381.47 226.62 339.47 247.75
//   Arc 3 act→observe:      M 311 274 Q 270 304 233.04 276.95
//   Arc 4 observe→verify:   M 205 250 Q 158.53 226.62 164.38 179.96
//   Arc 5 verify→perceive:  M 165 127 Q 189.29 75.75 241 75.07  (iterate / "No")
//   Exit  verify→done:      M 141 151 Q 91.73 181.96 95.63 235.01  ("Yes")

// Font rule: --font-mono-ai for loop step labels (what the agent does),
//            --font-mono-spec for decision/exit labels (what the system decides).
const ACTS = [
  { id: 'perceive', threshold: 0.00 },
  { id: 'reason',   threshold: 0.18 },
  { id: 'act',      threshold: 0.35 },
  { id: 'observe',  threshold: 0.52 },
  { id: 'verify',   threshold: 0.70 },
  { id: 'loop',     threshold: 0.85 },
] as const;

export default function AgentLoopDiagram() {
  const phase = useAnimationPhase();
  const { wasReached } = useActs(ACTS, phase);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Node visibility
  const reasonReached  = mounted && wasReached('reason');
  const actReached     = mounted && wasReached('act');
  const observeReached = mounted && wasReached('observe');
  const verifyReached  = mounted && wasReached('verify');
  const loopReached    = mounted && wasReached('loop');

  const arc1Ref    = useRef<SVGGeometryElement>(null);
  const arc2Ref    = useRef<SVGGeometryElement>(null);
  const arc3Ref    = useRef<SVGGeometryElement>(null);
  const arc4Ref    = useRef<SVGGeometryElement>(null);
  const arc5Ref    = useRef<SVGGeometryElement>(null);
  const arcExitRef = useRef<SVGGeometryElement>(null);

  const t1    = useStrokeDraw(arc1Ref,    phase, 0.18, 0.33);
  const t2    = useStrokeDraw(arc2Ref,    phase, 0.35, 0.50);
  const t3    = useStrokeDraw(arc3Ref,    phase, 0.52, 0.67);
  const t4    = useStrokeDraw(arc4Ref,    phase, 0.70, 0.82);
  // arc5 (iterate) and arcExit (done) emanate from verify simultaneously — same phase window
  const t5    = useStrokeDraw(arc5Ref,    phase, 0.85, 0.95);
  const tExit = useStrokeDraw(arcExitRef, phase, 0.85, 0.95);

  return (
    <svg
      viewBox="0 0 520 352"
      width="100%"
      height="auto"
      role="img"
      aria-label="Agent execution loop: Perceive, Reason, Act, Observe, Verify — iterate until done."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '520px', margin: '0 auto' }}
    >
      {/* ── Perceive node — act 0 (threshold 0.00), visible on mount; no ghost needed ── */}
      <g className={clsx(styles.node, styles.nodeIn)}>
        <NotoEmoji codepoint="1f52c" x={250} y={55} size={40} />
      </g>
      <text x={270} y={33}
        fill="var(--visual-indigo)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, styles.labelIn)}
      >perceive</text>

      {/* ── Arc 1: perceive → reason ──────────────────────────────────────── */}
      <path
        ref={arc1Ref}
        d="M 294 75 Q 350.71 75.75 372.86 122.48"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, reasonReached && styles.connectorDrawing)}
      />
      <g transform="translate(375,127) rotate(65)" style={{ opacity: arrowOpacity(t1) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Reason ghost placeholder ──────────────────────────────────────── */}
      <rect x={351} y={127} width={48} height={48} rx={12}
        fill="var(--visual-bg-violet)" stroke="var(--visual-violet)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !reasonReached && styles.ghostShown,
          reasonReached && styles.ghostHidden,
        )}
      />

      {/* ── Reason node ───────────────────────────────────────────────────── */}
      <g className={clsx(styles.node, reasonReached && styles.nodeIn)}>
        <NotoEmoji codepoint="1f9e0" x={355} y={131} size={40} />
      </g>
      <text x={414.56} y={138.03}
        fill="var(--visual-violet)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, reasonReached && styles.labelIn)}
      >reason</text>

      {/* ── Arc 2: reason → act ───────────────────────────────────────────── */}
      <path
        ref={arc2Ref}
        d="M 375 175 Q 381.47 226.62 339.47 247.75"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, actReached && styles.connectorDrawing)}
      />
      <g transform="translate(335,250) rotate(153)" style={{ opacity: arrowOpacity(t2) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Act ghost placeholder ─────────────────────────────────────────── */}
      <rect x={311} y={250} width={48} height={48} rx={12}
        fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !actReached && styles.ghostShown,
          actReached && styles.ghostHidden,
        )}
      />

      {/* ── Act node ──────────────────────────────────────────────────────── */}
      <g className={clsx(styles.node, actReached && styles.nodeIn)}>
        <NotoEmoji codepoint="1f9be" x={315} y={254} size={40} />
      </g>
      <text x={359.34} y={307.97}
        fill="var(--visual-cyan)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, actReached && styles.labelIn)}
      >act</text>

      {/* ── Arc 3: act → observe ─────────────────────────────────────────── */}
      <path
        ref={arc3Ref}
        d="M 311 274 Q 270 304 233.04 276.95"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, observeReached && styles.connectorDrawing)}
      />
      <g transform="translate(229,274) rotate(-144)" style={{ opacity: arrowOpacity(t3) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Observe ghost placeholder ─────────────────────────────────────── */}
      <rect x={181} y={250} width={48} height={48} rx={12}
        fill="var(--visual-bg-magenta)" stroke="var(--visual-magenta)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !observeReached && styles.ghostShown,
          observeReached && styles.ghostHidden,
        )}
      />

      {/* ── Observe node ─────────────────────────────────────────────────── */}
      <g className={clsx(styles.node, observeReached && styles.nodeIn)}>
        <NotoEmoji codepoint="1f440" x={185} y={254} size={40} />
      </g>
      <text x={180.66} y={307.97}
        fill="var(--visual-magenta)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, observeReached && styles.labelIn)}
      >observe</text>

      {/* ── Arc 4: observe → verify ───────────────────────────────────────── */}
      <path
        ref={arc4Ref}
        d="M 205 250 Q 158.53 226.62 164.38 179.96"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, verifyReached && styles.connectorDrawing)}
      />
      <g transform="translate(165,175) rotate(-83)" style={{ opacity: arrowOpacity(t4) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>

      {/* ── Verify ghost placeholder ──────────────────────────────────────── */}
      <rect x={141} y={127} width={48} height={48} rx={12}
        fill="var(--visual-bg-warning)" stroke="var(--visual-warning)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !verifyReached && styles.ghostShown,
          verifyReached && styles.ghostHidden,
        )}
      />

      {/* ── Verify node ───────────────────────────────────────────────────── */}
      <g className={clsx(styles.node, verifyReached && styles.nodeIn)}>
        <NotoEmoji codepoint="1f4cf" x={145} y={131} size={40} />
      </g>
      {/* label nudged left/down from computed (125.4, 138) to avoid overlap with the "Yes" arc label */}
      <text x={108} y={155}
        fill="var(--visual-warning)"
        style={{ fontFamily: 'var(--font-mono-ai)' }}
        fontSize={10} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, verifyReached && styles.labelIn)}
      >verify</text>

      {/* ── Arc 5: verify → perceive (iterate / "No") ────────────────────── */}
      <path
        ref={arc5Ref}
        d="M 165 127 Q 189.29 75.75 241 75.07"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, loopReached && styles.connectorDrawing)}
      />
      <g transform="translate(246,75) rotate(-1)" style={{ opacity: arrowOpacity(t5) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>
      <text x={197} y={78}
        fill="var(--text-muted)"
        style={{ fontFamily: 'var(--font-mono-spec)' }}
        fontSize={9} textAnchor="middle"
        className={clsx(styles.decisionLabel, loopReached && styles.decisionLabelIn)}
      >No</text>

      {/* ── Exit arc: verify → done ("Yes") ──────────────────────────────── */}
      <path
        ref={arcExitRef}
        d="M 141 151 Q 91.73 181.96 95.63 235.01"
        {...CONNECTOR_STYLE}
        className={clsx(styles.connector, loopReached && styles.connectorDrawing)}
      />
      <g transform="translate(96,240) rotate(86)" style={{ opacity: arrowOpacity(tExit) }}>
        <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
      </g>
      <text x={127} y={196}
        fill="var(--text-muted)"
        style={{ fontFamily: 'var(--font-mono-spec)' }}
        fontSize={9} textAnchor="middle"
        className={clsx(styles.decisionLabel, loopReached && styles.decisionLabelIn)}
      >Yes</text>

      {/* ── Done ghost placeholder ────────────────────────────────────────── */}
      <rect x={72} y={240} width={48} height={48} rx={12}
        fill="var(--visual-bg-success)" stroke="var(--visual-success)"
        {...GHOST_STYLE}
        className={clsx(
          styles.ghost,
          mounted && !loopReached && styles.ghostShown,
          loopReached && styles.ghostHidden,
        )}
      />

      {/* ── Done node ─────────────────────────────────────────────────────── */}
      <g className={clsx(styles.node, loopReached && styles.nodeIn)}>
        <NotoEmoji codepoint="2705" x={76} y={244} size={40} />
      </g>
      <text x={96} y={300}
        fill="var(--visual-success)"
        style={{ fontFamily: 'var(--font-mono-spec)' }}
        fontSize={9} fontWeight={500} textAnchor="middle"
        className={clsx(styles.label, loopReached && styles.labelIn)}
      >done</text>
    </svg>
  );
}
