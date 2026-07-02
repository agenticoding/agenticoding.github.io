import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './IntroHookDiagram.module.css';
import shared from './diagram.module.css';
import { OperatorNode, AgentNode, EmojiImage } from './ActorNodes';
import { EMOJI } from './emojiAssets';
import { Ghost } from './Ghost';
import { useStaticAnimationPhase } from '../../hooks/useStaticAnimationPhase';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { useMounted } from '../../hooks/useMounted';
import { promptFadeOpacity } from './diagramConstants';

// Layout — ViewBox 560×264 (fan: symmetric ±22.6° about orchestrator centre y=108)
//
// Shoulder formula:
//   parent_x = BB_x + (viewBox_x / 128) × size
//   parent_y = BB_y + (viewBox_y / 128) × size
// AgentNode arms: x=4.25–124, y=53.05–108 → arm center viewBox y=(53.05+108)/2=80.5
// OperatorNode face widest at viewBox (121.6, 62.9) → parent (108, 108) for size=40 at y=88.
//
// Operator:     BB x=70  y=88  size=40 → right shoulder (108, 108)
// Orchestrator: BB x=250 y=88  size=40 → left shoulder (251, 113); right shoulder (289, 113)
// W1 (branch):  BB x=435 y=24  size=32 → left edge (436, 44)
// W2 (tests):   BB x=475 y=96  size=32 → left edge (476, 116)
// W3 (review):  BB x=435 y=160 size=32 → left edge (436, 180)
//
// Main arc:  M 108 108 Q 180 48 251 113
// Fan W1:    M 289 113 Q 345 62 436 44
// Fan W2:    M 289 113 Q 375 113 476 116
// Fan W3:    M 289 113 Q 345 158 436 180
//
// Lightbulb: globe center (90, 55), r=13; cap x=82 y=68 w=16 h=5 rx=0
// Ghost workers: AgentNode S=32 sharp outline at worker positions, opacity 0.28 → 0 on dispatch

// 5 rays, −45° to +45° CW from North (top), 90° total arc. Globe center (90, 55), r=13.
// r_inner=16 (r+3), r_outer=21 (r_inner+5). All coords integer. All rays in sync.
const BULB_RAYS = [
  { x1: 79,  y1: 44, x2: 75,  y2: 40, dx: -1, dy: -1 },  // θ=−45°
  { x1: 84,  y1: 40, x2: 82,  y2: 36, dx: -1, dy: -2 },  // θ=−22.5°
  { x1: 90,  y1: 39, x2: 90,  y2: 34, dx:  0, dy: -2 },  // θ=0°
  { x1: 96,  y1: 40, x2: 98,  y2: 36, dx:  1, dy: -2 },  // θ=+22.5°
  { x1: 101, y1: 44, x2: 105, y2: 40, dx:  1, dy: -1 },  // θ=+45°
] as const;

const ARC_D    = 'M 108 108 Q 180 48 251 113';
const TRAVEL_D = 'M 90 73 Q 180 40 251 113';
const FAN1_D   = 'M 289 113 Q 345 62 436 44';
const FAN2_D   = 'M 289 113 Q 375 113 476 116';
const FAN3_D   = 'M 289 113 Q 345 158 436 180';

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
  const phase = useStaticAnimationPhase();
  const { wasReached, isCurrentAct } = useActs(ACTS, phase);
  const mounted = useMounted();

  const arcPathRef    = useRef<SVGPathElement>(null);
  const travelPathRef = useRef<SVGPathElement>(null);
  const fan1Ref       = useRef<SVGPathElement>(null);
  const fan2Ref       = useRef<SVGPathElement>(null);
  const fan3Ref       = useRef<SVGPathElement>(null);
  const fanRefs       = [fan1Ref, fan2Ref, fan3Ref];

  // Guide arc init only — CSS drawPath animation handles drawing.
  // useStrokeDraw cannot be used here because the CSS animation would conflict
  // with imperative strokeDashoffset updates.
  useEffect(() => {
    const p = arcPathRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  }, []);

  // Fan arcs: scroll-driven stroke draw, staggered start phases
  const fan1T = useStrokeDraw(fan1Ref as React.RefObject<SVGGeometryElement | null>, phase, 0.80, 0.995);
  const fan2T = useStrokeDraw(fan2Ref as React.RefObject<SVGGeometryElement | null>, phase, 0.84, 0.995);
  const fan3T = useStrokeDraw(fan3Ref as React.RefObject<SVGGeometryElement | null>, phase, 0.88, 0.995);
  const fanTs = [fan1T, fan2T, fan3T];

  const composingReached = wasReached('composing');
  const travelingReached = wasReached('traveling');
  const dispatched       = wasReached('dispatch');

  // Main prompt position: idle at path start, then scroll-interpolated along arc
  const mainPromptPos = (() => {
    if (!composingReached) return null;
    if (!travelingReached) return { x: 90, y: 73, opacity: 1 };
    const path = travelPathRef.current;
    if (!path) return { x: 251, y: 113, opacity: 0 };       // fallback: arc end
    const t = Math.min((phase - 0.6) / 0.20, 1);           // 0.6→0.80 maps to 0→1
    const opacity = promptFadeOpacity(t);
    const pt = path.getPointAtLength(t * path.getTotalLength());
    return { x: pt.x, y: pt.y, opacity };
  })();

  // Fan prompt positions: scroll-interpolated along each fan arc, staggered per arc
  const fanPromptPositions = FAN_ARCS.map((_, i) => {
    if (!dispatched) return null;
    const path = fanRefs[i].current;
    if (!path) return null;
    const t = fanTs[i];
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
          AgentNode S=32 head rectangle (headX=2.4 headY=2.4 headW=27.2 headH=27.2 rx=0). */}
      {FAN_ARCS.map((fan, i) => (
        <Ghost
          key={`ghost-${i}`}
          x={fan.workerX + 2.4} y={fan.workerY + 2.4}
          width={27.2} height={27.2} rx={0}
          fill="var(--visual-bg-violet)" stroke="var(--visual-violet)"
          mounted={mounted} reached={dispatched}
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
        {/* IdeaIcon — globe center lands at (90, 55) matching BULB_RAYS geometry.
            x = 90 − size/2 = 70; y chosen so globe center (64/128 × size) ≈ 55. */}
        <EmojiImage asset={EMOJI.lightBulb} x={70} y={41} size={40} />
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
      <g className={clsx(styles.actorNode, wasReached('operator') && shared.actEntered)}>
        <OperatorNode x={70} y={88} size={40} />
      </g>

      {/* Main prompt: enters at operator, idles, then travels to orchestrator.
          Outer <g> handles SVG-attribute positioning only — no CSS class here,
          because CSS `transform` (from actEnter) would override the SVG attribute. */}
      {mainPromptPos && (
        <g transform={`translate(${mainPromptPos.x}, ${mainPromptPos.y})`} style={{ opacity: mainPromptPos.opacity }}>
          <g className={shared.actEntered}>
            <EmojiImage asset={EMOJI.chat} x={-11} y={-11} size={22} />
          </g>
        </g>
      )}

      {/* Fan dispatch prompts — one per worker, scroll-driven */}
      {fanPromptPositions.map((pos, i) => pos && (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`} style={{ opacity: pos.opacity }}>
          <g className={shared.actEntered}>
            <EmojiImage asset={EMOJI.chat} x={-11} y={-11} size={22} />
          </g>
        </g>
      ))}

      {/* Orchestrator */}
      <g className={clsx(
        styles.actorNode,
        wasReached('orchestrator') && shared.actEntered,
        isCurrentAct('orchestrator') && 'idle-ready-breathe',
      )}>
        <AgentNode x={250} y={88} size={40} />
      </g>

      {/* Workers — bloom out on dispatch, staggered */}
      {FAN_ARCS.map((fan, i) => (
        <g
          key={i}
          className={clsx(shared.workerNode, dispatched && shared.workerEntered)}
          style={{ transitionDelay: dispatched ? `${fan.nodeDelay}ms` : undefined }}
        >
          <AgentNode x={fan.workerX} y={fan.workerY} size={32} />
        </g>
      ))}

      {/* Permanent orientation labels */}
      <g className={clsx(styles.labels, wasReached('labels') && shared.actEntered)}>
        <text
          x={90} y={144}
          fill="var(--visual-neutral)"
          style={{ fontFamily: 'var(--font-mono-human)' }}
          fontSize={11} fontWeight={400} textAnchor="middle"
        >You</text>
        <text
          x={270} y={144}
          fill="var(--visual-magenta)"
          style={{ fontFamily: 'var(--font-mono)' }}
          fontSize={11} fontWeight={500} textAnchor="middle"
        >Orchestrator</text>
      </g>

      {/* Worker labels — appear on dispatch, staggered with nodes */}
      {FAN_ARCS.map((fan, i) => (
        <text
          key={i}
          x={fan.labelX} y={fan.labelY}
          className={clsx(shared.workerLabel, dispatched && shared.workerLabelEntered)}
          fill="var(--visual-neutral)"
          style={{
            fontFamily: 'var(--font-mono)',
            transitionDelay: dispatched ? `${fan.nodeDelay + 100}ms` : undefined,
          }}
          fontSize={9} fontWeight={400} textAnchor="middle"
        >{fan.label}</text>
      ))}

      {/* Reduced-motion fallback: static emoji at arc midpoint (177, 78) */}
      <g className={styles.staticCard}>
        <EmojiImage asset={EMOJI.chat} x={166} y={67} size={22} />
      </g>
    </svg>
  );
}
