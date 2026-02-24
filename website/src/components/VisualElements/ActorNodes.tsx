import React from 'react';

// Computed via scripts/compute-actor-coords.js

type ActorSize = 40 | 32 | 14;

export interface OperatorNodeProps { x: number; y: number; size?: ActorSize; }
export interface AgentNodeProps    { x: number; y: number; size?: ActorSize; }
export interface PromptBubbleProps { x: number; y: number; showCursor?: boolean; }

// ── OperatorNode S=40 ──
const OP_40 = {
  headCx: 20, headCy: 9, headR: 8,
  bodyPath: 'M 2 40 C 2 29.65, 12 17, 20 17 C 28 17, 38 29.65, 38 40 Z',
} as const;

// ── OperatorNode S=32 ──
const OP_32 = {
  headCx: 16, headCy: 7.2, headR: 6.4,
  bodyPath: 'M 1.6 32 C 1.6 23.72, 9.6 13.6, 16 13.6 C 22.4 13.6, 30.4 23.72, 30.4 32 Z',
} as const;

// ── AgentNode S=40 ──
const AGENT_40 = {
  headX: 3, headY: 3, headW: 34, headH: 34, headRx: 8.5,
  eyeR: 3, eyeY: 15.92, eyeLx: 12.52, eyeRx: 27.48,
  mouthX: 7.08, mouthY: 25.1, mouthW: 25.84, mouthH: 5.44,
  dividers: [15.61, 24.13] as const,
} as const;

// ── AgentNode S=32 ──
const AGENT_32 = {
  headX: 2.4, headY: 2.4, headW: 27.2, headH: 27.2, headRx: 6.8,
  eyeR: 2.4, eyeY: 12.74, eyeLx: 10.02, eyeRx: 21.98,
  mouthX: 5.66, mouthY: 20.08, mouthW: 20.67, mouthH: 4.35,
  dividers: [12.48, 19.3] as const,
} as const;

// ── AgentNode S=14 ──
const AGENT_14 = {
  headX: 1.05, headY: 1.05, headW: 11.9, headH: 11.9, headRx: 2.98,
  eyeR: 1.05, eyeY: 5.57, eyeLx: 4.38, eyeRx: 9.62,
  mouthX: 2.48, mouthY: 8.79, mouthW: 9.04, mouthH: 1.9,
  dividers: [5.46, 8.45] as const,
} as const;

// ── PromptBubble (40×18 body, same card shape as TravelingPromptCard) ──
// Cursor bar: active authoring signal.
// All coords computed via scripts/compute-actor-coords.js
const BUBBLE_GEOM = {
  W: 40, H: 18, rx: 9,
  stubs: [
    { x: 8, y: 6,  w: 20, h: 2, rx: 1 },
    { x: 8, y: 11, w: 14, h: 2, rx: 1 },
  ] as const,
  cursor: { x: 23, y: 9, w: 2, h: 6, rx: 1 },
} as const;

// ── IdeaIcon S=32 ──
// All coords computed via scripts/compute-actor-coords.js
const IDEA_32 = {
  globeR: 12, globeCx: 16, globeCy: 14,
  capX: 10, capY: 27, capW: 12, capH: 4, capRx: 2,
} as const;

// ── TravelingPromptCard (36×20, centered at 0,0 for animateMotion origin) ──
// All coords computed via scripts/compute-actor-coords.js
const TCARD_GEOM = {
  W: 36, H: 20, rx: 8, bodyX: -18, bodyY: -10,
  stubs: [
    { x: -9, y: -4, w: 18, h: 2, rx: 1 },
    { x: -6, y:  2, w: 12, h: 2, rx: 1 },
  ] as const,
} as const;

// ── IdeaIcon ─────────────────────────────────────────────────────────────────
// Shape essence traced from 💡 (Lightbulb emoji).
// Globe: smooth circle (Smooth Circuit). Base cap: slight rx (positive valence).
// Represents pre-prompt idea — uses indigo to signal proto-prompt continuity.
export function IdeaIcon({ x, y }: { x: number; y: number }) {
  const g = IDEA_32;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle
        cx={g.globeCx} cy={g.globeCy} r={g.globeR}
        fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5}
      />
      <rect
        x={g.capX} y={g.capY} width={g.capW} height={g.capH} rx={g.capRx}
        fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5}
      />
    </g>
  );
}

// ── OperatorNode ─────────────────────────────────────────────────────────────
// Shape essence traced from 🧑 (gender-free Person emoji).
// Body: smooth cubic Bezier bust silhouette, Smooth Circuit throughout.
// Head: circle sits flush on the neck point; rendered last to overlay the body top.
export function OperatorNode({ x, y, size = 40 }: OperatorNodeProps) {
  const g = size === 40 ? OP_40 : OP_32;
  const sw = size === 40 ? 2 : 1.5;
  return (
    <g transform={`translate(${x},${y})`}>
      <path
        d={g.bodyPath}
        fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)" strokeWidth={sw}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <circle
        cx={g.headCx} cy={g.headCy} r={g.headR}
        fill="var(--visual-bg-neutral)" stroke="var(--visual-neutral)" strokeWidth={sw}
      />
    </g>
  );
}

// ── AgentNode ─────────────────────────────────────────────────────────────────
// Head squircle: Smooth Circuit. Eyes: solid dots. Mouth: Terminal Geometry.
export function AgentNode({ x, y, size = 40 }: AgentNodeProps) {
  const g = size === 40 ? AGENT_40 : size === 32 ? AGENT_32 : AGENT_14;
  const sw = size === 40 ? 2 : size === 32 ? 1.5 : 1;
  const mouthSw = size === 14 ? 0.75 : 1;
  const mouthRx = size === 14 ? 1 : 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x={g.headX} y={g.headY} width={g.headW} height={g.headH} rx={g.headRx}
        fill="var(--visual-bg-violet)" stroke="var(--visual-violet)" strokeWidth={sw}
      />
      <circle cx={g.eyeLx} cy={g.eyeY} r={g.eyeR} fill="var(--visual-violet)" />
      <circle cx={g.eyeRx} cy={g.eyeY} r={g.eyeR} fill="var(--visual-violet)" />
      <rect
        x={g.mouthX} y={g.mouthY} width={g.mouthW} height={g.mouthH} rx={mouthRx}
        fill="var(--visual-bg-cyan)" stroke="var(--visual-cyan)" strokeWidth={mouthSw}
      />
      {g.dividers.map((dx, i) => (
        <line key={i} x1={dx} y1={g.mouthY} x2={dx} y2={g.mouthY + g.mouthH}
          stroke="var(--visual-cyan)" strokeWidth={mouthSw} />
      ))}
    </g>
  );
}

// ── PromptBubble ──────────────────────────────────────────────────────────────
// Body: Smooth Circuit (rx=9). Matches TravelingPromptCard shape (no tail).
// 2 text stubs + optional cursor bar signal message-in-composition.
export function PromptBubble({ x, y, showCursor = true }: PromptBubbleProps) {
  const g = BUBBLE_GEOM;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x={0} y={0} width={g.W} height={g.H} rx={g.rx}
        fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5}
      />
      {g.stubs.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx}
          fill="var(--visual-indigo)" />
      ))}
      {showCursor && (
        <rect x={g.cursor.x} y={g.cursor.y} width={g.cursor.w} height={g.cursor.h}
          rx={g.cursor.rx} fill="var(--visual-indigo)" />
      )}
    </g>
  );
}

// ── PromptIcon ────────────────────────────────────────────────────────────────
// Unified prompt shape — same geometry as TravelingPromptCard, centered at 0,0.
// No embedded animateMotion; parent applies scroll-driven transform.
export function PromptIcon({ className }: { className?: string }) {
  const g = TCARD_GEOM;
  return (
    <g className={className}>
      <rect x={g.bodyX} y={g.bodyY} width={g.W} height={g.H} rx={g.rx}
        fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} />
      {g.stubs.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx}
          fill="var(--visual-indigo)" />
      ))}
    </g>
  );
}

// ── TravelingPromptCard ───────────────────────────────────────────────────────
// (0,0) is the animateMotion anchor. Parent supplies <path id={pathId}> in <defs>.
// begin defaults to "indefinite" — caller triggers via motionRef.current.beginElement().
// rotate defaults to "0" — prompt cards are artifacts that don't tilt (Smooth Circuit).
export interface TravelingPromptCardProps {
  pathId: string;
  dur?: string;                                        // default "0.4s"
  motionRef?: React.RefObject<SVGAnimateMotionElement>;
  className?: string;
  style?: React.CSSProperties;
  rotate?: string; // "0" | "auto-reverse" — default "0"
}

export function TravelingPromptCard({ pathId, dur = '0.4s', motionRef, className, style, rotate }: TravelingPromptCardProps) {
  const g = TCARD_GEOM;
  return (
    <g className={className} style={style}>
      <animateMotion ref={motionRef} begin="indefinite" dur={dur} fill="freeze"
        calcMode="spline" keyTimes="0;1" keySplines="0.20 0 0.38 0.9"
        rotate={rotate ?? '0'}>
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <rect x={g.bodyX} y={g.bodyY} width={g.W} height={g.H} rx={g.rx}
        fill="var(--visual-bg-indigo)" stroke="var(--visual-indigo)" strokeWidth={1.5} />
      {g.stubs.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx}
          fill="var(--visual-indigo)" />
      ))}
    </g>
  );
}
