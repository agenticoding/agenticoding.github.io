import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  EMOJI,
  OPENMOJI_VIEWBOX_SIZE,
  centeredEmojiOffset,
  emojiDisplaySize,
  type EmojiAsset,
  emojiSrc,
} from './emojiAssets';

export interface OperatorNodeProps {
  x: number;
  y: number;
  size?: number;
}
export interface AgentNodeProps {
  x: number;
  y: number;
  size?: number;
}
// ── TravelingPromptCard (36×20, centered at 0,0 for animateMotion origin) ──
// All coords computed via scripts/compute-actor-coords.js
const TCARD_GEOM = {
  W: 36,
  H: 20,
  rx: 8,
  bodyX: -18,
  bodyY: -10,
  stubs: [
    { x: -9, y: -4, w: 18, h: 2, rx: 1 },
    { x: -6, y: 2, w: 12, h: 2, rx: 1 },
  ] as const,
} as const;

// ── OperatorNode ─────────────────────────────────────────────────────────────
export function OperatorNode({ x, y, size = 40 }: OperatorNodeProps) {
  return <EmojiImage asset={EMOJI.operator} x={x} y={y} size={size} />;
}

// ── EmojiImage ────────────────────────────────────────────────────────────────
// <image> isolates external SVG internals from the parent diagram document.
export interface EmojiImageProps {
  asset: EmojiAsset;
  x: number;
  y: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function EmojiImage({
  asset,
  x,
  y,
  size = 40,
  className,
  style,
}: EmojiImageProps) {
  const base = useBaseUrl('/img/emoji');
  const displaySize = emojiDisplaySize(size);
  const offset = centeredEmojiOffset(size);
  return (
    <svg
      x={x - offset}
      y={y - offset}
      width={displaySize}
      height={displaySize}
      viewBox={`0 0 ${OPENMOJI_VIEWBOX_SIZE} ${OPENMOJI_VIEWBOX_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label={asset.label}
      className={className}
      style={style}
    >
      <image
        href={emojiSrc(base, asset)}
        width={OPENMOJI_VIEWBOX_SIZE}
        height={OPENMOJI_VIEWBOX_SIZE}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}

// ── AgentNode ─────────────────────────────────────────────────────────────────
export function AgentNode({ x, y, size = 40 }: AgentNodeProps) {
  return <EmojiImage asset={EMOJI.agent} x={x} y={y} size={size} />;
}

// ── AuthorWaveNode ────────────────────────────────────────────────────────────
// 🙋🏻‍♂️ Emoji-style waving figure — author greeting the reader. Used on the about page.
// Site-specific inline figure; replace with OpenMoji-derived art in the inline slice.
// Fills use flat colors (no gradients) per design system; hairHighlights omitted.
// Draw order: shirt/body → head/face → arm assembly (hand in front of head).
// LEFT hand waves (viewer perspective) — animations use negative rotations.
export function AuthorWaveNode({ className }: { className?: string }) {
  const base = useBaseUrl('/img/emoji');
  const size = emojiDisplaySize(104);
  return (
    <img
      src={emojiSrc(base, EMOJI.wavingAuthor)}
      width={size}
      height={size}
      role="img"
      aria-label="Author waving hello"
      className={className}
      style={{ display: 'block' }}
    />
  );
}
// ── PromptIcon ────────────────────────────────────────────────────────────────
// Unified prompt shape — same geometry as TravelingPromptCard, centered at 0,0.
// No embedded animateMotion; parent applies scroll-driven transform.
export function PromptIcon({ className }: { className?: string }) {
  const g = TCARD_GEOM;
  return (
    <g className={className}>
      <rect
        x={g.bodyX}
        y={g.bodyY}
        width={g.W}
        height={g.H}
        rx={0}
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
        strokeWidth={1.5}
      />
      {g.stubs.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={0}
          fill="var(--visual-indigo)"
        />
      ))}
    </g>
  );
}

// ── TravelingPromptCard ───────────────────────────────────────────────────────
// (0,0) is the animateMotion anchor. Parent supplies <path id={pathId}> in <defs>.
// begin defaults to "indefinite" — caller triggers via motionRef.current.beginElement().
// rotate defaults to "0" — prompt cards are stable artifacts that don't tilt.
export interface TravelingPromptCardProps {
  pathId: string;
  dur?: string; // default "0.4s"
  motionRef?: React.RefObject<SVGAnimateMotionElement>;
  className?: string;
  style?: React.CSSProperties;
  rotate?: string; // "0" | "auto-reverse" — default "0"
}

export function TravelingPromptCard({
  pathId,
  dur = '0.4s',
  motionRef,
  className,
  style,
  rotate,
}: TravelingPromptCardProps) {
  const g = TCARD_GEOM;
  return (
    <g className={className} style={style}>
      <animateMotion
        ref={motionRef}
        begin="indefinite"
        dur={dur}
        fill="freeze"
        calcMode="spline"
        keyTimes="0;1"
        keySplines="0.20 0 0.38 0.9"
        rotate={rotate ?? '0'}
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <rect
        x={g.bodyX}
        y={g.bodyY}
        width={g.W}
        height={g.H}
        rx={0}
        fill="var(--visual-bg-indigo)"
        stroke="var(--visual-indigo)"
        strokeWidth={1.5}
      />
      {g.stubs.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={0}
          fill="var(--visual-indigo)"
        />
      ))}
    </g>
  );
}
