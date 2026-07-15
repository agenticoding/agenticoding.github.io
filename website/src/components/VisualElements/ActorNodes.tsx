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
