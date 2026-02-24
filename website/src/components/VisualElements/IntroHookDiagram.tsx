import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './IntroHookDiagram.module.css';
import { OperatorNode, AgentNode, PromptIcon } from './ActorNodes';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';

// Layout — ViewBox 560×264 (fan: symmetric ±22.6° about orchestrator centre y=108)
//
// Operator:     BB x=70  y=88  size=40 → right shoulder (108, 108)
// Orchestrator: BB x=250 y=88  size=40 → left shoulder (243, 108); right shoulder (288, 108)
// W1 (branch):  BB x=435 y=24  size=32 → left edge (437, 40)
// W2 (tests):   BB x=475 y=96  size=32 → left edge (477, 112)
// W3 (review):  BB x=435 y=160 size=32 → left edge (437, 176)
//
// Main arc:  M 108 108 Q 178 48 243 108
// Fan W1:    M 288 108 Q 345 60 437 40
// Fan W2:    M 288 108 Q 375 108 477 112
// Fan W3:    M 288 108 Q 345 156 437 176
//
// Lightbulb: globe center (90, 55), r=13; cap x=82 y=68 w=16 h=5 rx=2
// Ghost workers: AgentNode S=32 squircle outline at worker positions, opacity 0.28 → 0 on dispatch

// 5 rays, −45° to +45° CW from North (top), 90° total arc. Globe center (90, 55), r=13.
// r_inner=16 (r+3), r_outer=21 (r_inner+5). All coords integer. All rays in sync.
const BULB_RAYS = [
  { x1: 79,  y1: 44, x2: 75,  y2: 40, dx: -1, dy: -1 },  // θ=−45°
  { x1: 84,  y1: 40, x2: 82,  y2: 36, dx: -1, dy: -2 },  // θ=−22.5°
  { x1: 90,  y1: 39, x2: 90,  y2: 34, dx:  0, dy: -2 },  // θ=0°
  { x1: 96,  y1: 40, x2: 98,  y2: 36, dx:  1, dy: -2 },  // θ=+22.5°
  { x1: 101, y1: 44, x2: 105, y2: 40, dx:  1, dy: -1 },  // θ=+45°
] as const;

const ARC_D    = 'M 108 108 Q 178 48 243 108';
const TRAVEL_D = 'M 90 73 Q 178 40 243 108';
const FAN1_D   = 'M 288 108 Q 345 60 437 40';
const FAN2_D   = 'M 288 108 Q 375 108 477 112';
const FAN3_D   = 'M 288 108 Q 345 156 437 176';

const DISPATCH_START = 0.80;
const DISPATCH_END   = 0.995;
const PHASE_STAGGER  = 0.04;   // ≈ 80 ms / 400 ms × 0.195 phase range

const ACTS = [
  { id: 'arc',          threshold: 0    },
  { id: 'operator',     threshold: 0    },
  { id: 'orchestrator', threshold: 0    },
  { id: 'labels',       threshold: 0    },
  { id: 'composing',    threshold: 0.5  },
  { id: 'traveling',    threshold: 0.6  },
  { id: 'dispatch',     threshold: 0.80 },
] as const;

type FanSpec = {
  d: string;
  pathDefId: string;
  workerX: number; workerY: number;
  labelX: number;  labelY: number;
  label: string;
  arcDelay: number; nodeDelay: number;
};

const FAN_ARCS: FanSpec[] = [
  { d: FAN1_D, pathDefId: 'ihFan1Path', workerX: 435, workerY: 24,  labelX: 451, labelY: 72,  label: 'explore', arcDelay: 0,   nodeDelay: 200 },
  { d: FAN2_D, pathDefId: 'ihFan2Path', workerX: 475, workerY: 96,  labelX: 491, labelY: 144, label: 'build',   arcDelay: 80,  nodeDelay: 280 },
  { d: FAN3_D, pathDefId: 'ihFan3Path', workerX: 435, workerY: 160, labelX: 451, labelY: 208, label: 'verify',  arcDelay: 160, nodeDelay: 360 },
];

export default function IntroHookDiagram() {
  const phase = useAnimationPhase();
  const { wasReached, isCurrentAct } = useActs(ACTS as unknown as { id: string; threshold: number }[], phase);

  const arcPathRef    = useRef<SVGPathElement>(null);
  const travelPathRef = useRef<SVGPathElement>(null);
  const fan1Ref       = useRef<SVGPathElement>(null);
  const fan2Ref       = useRef<SVGPathElement>(null);
  const fan3Ref       = useRef<SVGPathElement>(null);
  const fanRefs       = [fan1Ref, fan2Ref, fan3Ref];

  // Keep lightbulb and ghost workers hidden until mount so the client has computed
  // the correct phase. ideaBulb / ghostWorker default to opacity:0; the *Visible /
  // *Shown classes make them explicit once safe.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Set stroke-dasharray/offset from computed path length on mount
  useEffect(() => {
    for (const p of [arcPathRef.current, fan1Ref.current, fan2Ref.current, fan3Ref.current]) {
      if (!p) continue;
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    }
  }, []);

  const composingReached = wasReached('composing');
  const travelingReached = wasReached('traveling');
  const dispatchReached  = wasReached('dispatch');
  const dispatched       = dispatchReached;

  // Per-arc staggered t: maps phase into [0,1] with each arc offset by PHASE_STAGGER
  const fanT = (i: number) => {
    const start = DISPATCH_START + i * PHASE_STAGGER;
    const range = DISPATCH_END - start;
    return Math.min(Math.max((phase - start) / range, 0), 1);
  };

  // Drive fan arc strokeDashoffset directly from scroll phase (keeps tip in sync with prompt)
  useEffect(() => {
    fanRefs.forEach((ref, i) => {
      const path = ref.current;
      if (!path) return;
      const len = path.getTotalLength();
      const t = fanT(i);
      path.style.strokeDashoffset = `${len * (1 - t)}`;
    });
  }, [phase]);

  // Main prompt position: idle at path start, then scroll-interpolated along arc
  const mainPromptPos = (() => {
    if (!composingReached) return null;
    if (!travelingReached) return { x: 90, y: 73, opacity: 1 };
    const path = travelPathRef.current;
    if (!path) return { x: 243, y: 108, opacity: 0 };       // fallback: arc end
    const t = Math.min((phase - 0.6) / 0.20, 1);           // 0.6→0.80 maps to 0→1
    const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const pt = path.getPointAtLength(t * path.getTotalLength());
    return { x: pt.x, y: pt.y, opacity };
  })();

  // Fan prompt positions: scroll-interpolated along each fan arc, staggered per arc
  const fanPromptPositions = FAN_ARCS.map((_, i) => {
    if (!dispatchReached) return null;
    const path = fanRefs[i].current;
    if (!path) return null;
    const t = fanT(i);
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
      aria-label="A prompt travels from the operator to an orchestrator, which dispatches parallel workers to explore, build, and verify independently."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
    >
      <defs>
        <path id="ihTravelPath" ref={travelPathRef} d={TRAVEL_D} />
        {FAN_ARCS.map(fan => <path key={fan.pathDefId} id={fan.pathDefId} d={fan.d} />)}
      </defs>

      {/* Ghost worker placeholders — provide rightward visual mass in start state,
          fading out as the real workers bloom in on dispatch. Shape matches the
          AgentNode S=32 head squircle (headX=2.4 headY=2.4 headW=27.2 headH=27.2 rx=6.8). */}
      {FAN_ARCS.map((fan, i) => (
        <rect
          key={`ghost-${i}`}
          x={fan.workerX + 2.4} y={fan.workerY + 2.4}
          width={27.2} height={27.2} rx={6.8}
          fill="var(--visual-bg-violet)"
          stroke="var(--visual-violet)"
          strokeWidth={1}
          strokeDasharray="3 4"
          className={clsx(
            styles.ghostWorker,
            mounted && !dispatched && styles.ghostWorkerShown,
            dispatched && styles.ghostWorkerHidden,
          )}
          style={dispatched ? { transitionDelay: `${fan.nodeDelay}ms` } : undefined}
        />
      ))}

      {/* Idea lightbulb — pre-prompt state; fades out when composing begins. */}
      <g className={clsx(
        styles.ideaBulb,
        mounted && !composingReached && styles.ideaBulbVisible,
        composingReached && styles.ideaBulbFadeOut,
      )}>
        {/* Rays — drawn first, globe+cap fill covers inner endpoints naturally */}
        {BULB_RAYS.map((ray, i) => (
          <g key={i}>
            <line
              x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2}
              stroke="var(--visual-warning)" strokeWidth={1.5} strokeLinecap="round"
              opacity={0.7}
            >
              <animateTransform
                attributeName="transform" type="translate"
                values={`0 0; ${ray.dx} ${ray.dy}; 0 0`}
                dur="2s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.5;1"
                keySplines="0.5 0 0.5 1;0.5 0 0.5 1"
              />
            </line>
          </g>
        ))}
        {/* Globe */}
        <circle cx={90} cy={55} r={13}
          fill="var(--visual-bg-warning)" stroke="var(--visual-warning)" strokeWidth={1.5} />
        {/* Cap — x=82 y=68 w=16 h=5 rx=2 */}
        <rect x={82} y={68} width={16} height={5} rx={2}
          fill="var(--visual-bg-warning)" stroke="var(--visual-warning)" strokeWidth={1.5} />
        {/* Question mark — Radon (human-actor voice), fontSize=13 centered at globe (cx=90,cy=55,r=13).
            80%-fill rule: cap-h≈10px < 20.8px limit. fontWeight=400 (only weight Radon ships). */}
        <text
          x={90}
          y={55}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={400}
          fill="var(--visual-warning)"
          style={{ fontFamily: 'var(--font-mono-human)', fontFeatureSettings: 'var(--font-mono-features)' }}
        >?</text>
      </g>

      {/* Guide arc — operator → orchestrator */}
      <path
        ref={arcPathRef}
        className={clsx(styles.guideArc, wasReached('arc') && styles.arcDraw)}
        d={ARC_D}
        fill="none"
        stroke="var(--border-default)"
        strokeWidth={1}
        strokeDasharray="4 6"
        strokeLinecap="round"
      />

      {/* Fan arcs — orchestrator → workers, staggered on dispatch */}
      {FAN_ARCS.map((fan, i) => (
        <path
          key={i}
          ref={fanRefs[i]}
          className={clsx(styles.fanArc, dispatched && styles.fanDraw)}
          d={fan.d}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={1}
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
      ))}

      {/* Operator */}
      <g className={clsx(styles.actorNode, wasReached('operator') && styles.entered)}>
        <OperatorNode x={70} y={88} size={40} />
      </g>

      {/* Main prompt: enters at operator, idles, then travels to orchestrator.
          Outer <g> handles SVG-attribute positioning only — no CSS class here,
          because CSS `transform` (from actEnter) would override the SVG attribute. */}
      {mainPromptPos && (
        <g transform={`translate(${mainPromptPos.x}, ${mainPromptPos.y})`} style={{ opacity: mainPromptPos.opacity }}>
          <g className={styles.promptIcon}>
            <PromptIcon />
          </g>
        </g>
      )}

      {/* Fan dispatch prompts — one per worker, scroll-driven */}
      {fanPromptPositions.map((pos, i) => pos && (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`} style={{ opacity: pos.opacity }}>
          <g className={styles.promptIcon}>
            <PromptIcon />
          </g>
        </g>
      ))}

      {/* Orchestrator */}
      <g className={clsx(
        styles.actorNode,
        wasReached('orchestrator') && styles.entered,
        isCurrentAct('orchestrator') && 'idle-ready-breathe',
      )}>
        <AgentNode x={250} y={88} size={40} />
      </g>

      {/* Workers — bloom out on dispatch, staggered */}
      {FAN_ARCS.map((fan, i) => (
        <g
          key={i}
          className={clsx(styles.workerNode, dispatched && styles.workerEntered)}
          style={{ transitionDelay: dispatched ? `${fan.nodeDelay}ms` : undefined }}
        >
          <AgentNode x={fan.workerX} y={fan.workerY} size={32} />
        </g>
      ))}

      {/* Permanent orientation labels */}
      <g className={clsx(styles.labels, wasReached('labels') && styles.entered)}>
        <text
          x={90} y={144}
          fill="var(--visual-neutral)"
          style={{ fontFamily: 'var(--font-mono-human)' }}
          fontSize={11} fontWeight={400} textAnchor="middle"
        >You</text>
        <text
          x={270} y={144}
          fill="var(--visual-violet)"
          style={{ fontFamily: 'var(--font-mono)' }}
          fontSize={11} fontWeight={500} textAnchor="middle"
        >Orchestrator</text>
      </g>

      {/* Worker labels — appear on dispatch, staggered with nodes */}
      {FAN_ARCS.map((fan, i) => (
        <text
          key={i}
          x={fan.labelX} y={fan.labelY}
          className={clsx(styles.workerLabel, dispatched && styles.workerLabelEntered)}
          fill="var(--visual-neutral)"
          style={{
            fontFamily: 'var(--font-mono)',
            transitionDelay: dispatched ? `${fan.nodeDelay + 100}ms` : undefined,
          }}
          fontSize={9} fontWeight={400} textAnchor="middle"
        >{fan.label}</text>
      ))}

      {/* Reduced-motion fallback: static card at arc midpoint (177, 78) */}
      <g className={styles.staticCard}>
        <g transform="translate(177, 78)">
          <rect x={-18} y={-10} width={36} height={20} rx={8}
            fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} />
          <rect x={-9} y={-4} width={18} height={2} rx={1} fill="var(--visual-indigo)" />
          <rect x={-6} y={2}  width={12} height={2} rx={1} fill="var(--visual-indigo)" />
        </g>
      </g>
    </svg>
  );
}
